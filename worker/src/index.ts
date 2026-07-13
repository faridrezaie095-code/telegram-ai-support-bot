import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, Bot } from './types';
import { encrypt, decrypt, bytesToHex } from './crypto';
import {
  createBot,
  deleteBot,
  deleteProduct,
  getBotById,
  getRecentHistory,
  listBots,
  listProducts,
  listRecentConversations,
  saveMessage,
  updateBot,
  upsertProduct,
} from './db';
import { buildSystemPrompt } from './prompt';
import { getAIProvider, SUPPORTED_PROVIDERS } from './ai';
import {
  deleteTelegramWebhook,
  getTelegramBotInfo,
  sendTelegramMessage,
  setTelegramWebhook,
} from './telegram';
import { login, logout, requireAuth } from './auth';

const app = new Hono<{ Bindings: Env }>();

app.use('/api/*', cors());

// ============================================================================
// وبهوک تلگرام — این مسیر عمومی است (بدون نیاز به کوکی ادمین)، اما با
// secret_token هر بات اعتبارسنجی می‌شود.
// ============================================================================
app.post('/webhook/:botId', async (c) => {
  const botId = c.req.param('botId');
  const secretHeader = c.req.header('X-Telegram-Bot-Api-Secret-Token');

  const bot = await getBotById(c.env.DB, botId);
  if (!bot || !bot.is_active) return c.text('not found', 404);
  if (bot.telegram_webhook_secret !== secretHeader) return c.text('unauthorized', 401);

  const update = await c.req.json<any>().catch(() => null);
  const message = update?.message;
  const chatId: string | undefined = message?.chat?.id?.toString();
  const userText: string | undefined = message?.text;

  if (!chatId || !userText) return c.text('ok'); // آپدیت‌های غیرمتنی نادیده گرفته می‌شوند

  // ------------------------- محدودیت نرخ ساده با KV -------------------------
  const rateLimitKey = `rl:${botId}:${chatId}`;
  const currentCount = parseInt((await c.env.BOT_KV.get(rateLimitKey)) || '0', 10);
  if (currentCount > 15) {
    await sendTelegramMessage(
      await decrypt(bot.telegram_token_enc, c.env.ENCRYPTION_KEY),
      chatId,
      'لطفاً کمی صبر کنید و دوباره پیام دهید.'
    );
    return c.text('ok');
  }
  await c.env.BOT_KV.put(rateLimitKey, String(currentCount + 1), { expirationTtl: 60 });

  try {
    const [botToken, aiApiKey] = await Promise.all([
      decrypt(bot.telegram_token_enc, c.env.ENCRYPTION_KEY),
      decrypt(bot.ai_api_key_enc, c.env.ENCRYPTION_KEY),
    ]);

    const [products, history] = await Promise.all([
      listProducts(c.env.DB, botId),
      getRecentHistory(c.env.DB, botId, chatId, 6),
    ]);

    const systemPrompt = buildSystemPrompt(bot, products);
    const provider = getAIProvider(bot.ai_provider);

    const reply = await provider.complete({
      systemPrompt,
      history,
      userMessage: userText,
      model: bot.ai_model,
      apiKey: aiApiKey,
    });

    await saveMessage(c.env.DB, botId, chatId, 'user', userText);
    await saveMessage(c.env.DB, botId, chatId, 'assistant', reply);
    await sendTelegramMessage(botToken, chatId, reply);
  } catch (err) {
    console.error('webhook error', err);
    const botToken = await decrypt(bot.telegram_token_enc, c.env.ENCRYPTION_KEY);
    await sendTelegramMessage(
      botToken,
      chatId,
      bot.fallback_message || 'در حال حاضر امکان پاسخ‌گویی نیست، لطفاً بعداً تلاش کنید.'
    );
  }

  return c.text('ok');
});

// ============================================================================
// احراز هویت پنل
// ============================================================================
app.post('/api/auth/login', login);
app.post('/api/auth/logout', logout);

// از این به بعد همه‌ی مسیرها نیاز به ورود ادمین دارند
app.use('/api/bots/*', requireAuth);
app.use('/api/meta', requireAuth);

// ============================================================================
// متادیتا (لیست پروایدرهای پشتیبانی‌شده و غیره) برای پنل
// ============================================================================
app.get('/api/meta', (c) => c.json({ providers: SUPPORTED_PROVIDERS }));

// ============================================================================
// CRUD بات‌ها
// ============================================================================
app.get('/api/bots', async (c) => {
  const bots = await listBots(c.env.DB);
  return c.json(bots.map(sanitizeBot));
});

app.get('/api/bots/:id', async (c) => {
  const bot = await getBotById(c.env.DB, c.req.param('id'));
  if (!bot) return c.json({ error: 'یافت نشد' }, 404);
  return c.json(sanitizeBot(bot));
});

app.post('/api/bots', async (c) => {
  const body = await c.req.json<{
    name: string;
    business_description?: string;
    tone?: string;
    fallback_message?: string;
    telegram_token: string;
    ai_provider: string;
    ai_api_key: string;
    ai_model: string;
  }>();

  if (!body.name || !body.telegram_token || !body.ai_api_key || !body.ai_provider || !body.ai_model) {
    return c.json({ error: 'همه‌ی فیلدهای ضروری را پر کنید' }, 400);
  }
  if (!SUPPORTED_PROVIDERS.includes(body.ai_provider)) {
    return c.json({ error: 'پروایدر هوش مصنوعی نامعتبر است' }, 400);
  }

  // اعتبارسنجی توکن بات با تلگرام قبل از ذخیره
  const botInfo = await getTelegramBotInfo(body.telegram_token);
  if (!botInfo.ok) {
    return c.json({ error: 'توکن بات تلگرام نامعتبر است' }, 400);
  }

  const webhookSecret = bytesToHex(crypto.getRandomValues(new Uint8Array(24)));

  const [tokenEnc, apiKeyEnc] = await Promise.all([
    encrypt(body.telegram_token, c.env.ENCRYPTION_KEY),
    encrypt(body.ai_api_key, c.env.ENCRYPTION_KEY),
  ]);

  const bot = await createBot(c.env.DB, {
    name: body.name,
    business_description: body.business_description,
    tone: body.tone,
    fallback_message: body.fallback_message,
    telegram_token_enc: tokenEnc,
    telegram_webhook_secret: webhookSecret,
    ai_provider: body.ai_provider,
    ai_api_key_enc: apiKeyEnc,
    ai_model: body.ai_model,
  });

  // وبهوک را خودکار نزد تلگرام ثبت کن
  const webhookUrl = `${new URL(c.req.url).origin}/webhook/${bot.id}`;
  const hookResult = await setTelegramWebhook(body.telegram_token, webhookUrl, webhookSecret);

  return c.json({ bot: sanitizeBot(bot), telegram_username: botInfo.result?.username, webhook: hookResult });
});

app.put('/api/bots/:id', async (c) => {
  const id = c.req.param('id');
  const existing = await getBotById(c.env.DB, id);
  if (!existing) return c.json({ error: 'یافت نشد' }, 404);

  const body = await c.req.json<Partial<{
    name: string;
    business_description: string;
    tone: string;
    fallback_message: string;
    telegram_token: string;
    ai_provider: string;
    ai_api_key: string;
    ai_model: string;
    is_active: boolean;
  }>>();

  const updateFields: Record<string, unknown> = {
    name: body.name,
    business_description: body.business_description,
    tone: body.tone,
    fallback_message: body.fallback_message,
    ai_provider: body.ai_provider,
    ai_model: body.ai_model,
    is_active: body.is_active === undefined ? undefined : body.is_active ? 1 : 0,
  };

  if (body.telegram_token) {
    updateFields.telegram_token_enc = await encrypt(body.telegram_token, c.env.ENCRYPTION_KEY);
    const webhookUrl = `${new URL(c.req.url).origin}/webhook/${id}`;
    await setTelegramWebhook(body.telegram_token, webhookUrl, existing.telegram_webhook_secret);
  }
  if (body.ai_api_key) {
    updateFields.ai_api_key_enc = await encrypt(body.ai_api_key, c.env.ENCRYPTION_KEY);
  }

  await updateBot(c.env.DB, id, updateFields as any);
  const updated = await getBotById(c.env.DB, id);
  return c.json(sanitizeBot(updated!));
});

app.delete('/api/bots/:id', async (c) => {
  const id = c.req.param('id');
  const bot = await getBotById(c.env.DB, id);
  if (bot) {
    const token = await decrypt(bot.telegram_token_enc, c.env.ENCRYPTION_KEY);
    await deleteTelegramWebhook(token).catch(() => {});
  }
  await deleteBot(c.env.DB, id);
  return c.json({ ok: true });
});

// ------------------------------- محصولات ---------------------------------

app.get('/api/bots/:id/products', async (c) => {
  const products = await listProducts(c.env.DB, c.req.param('id'));
  return c.json(products);
});

app.post('/api/bots/:id/products', async (c) => {
  const botId = c.req.param('id');
  const body = await c.req.json<{
    id?: string;
    name: string;
    price?: number | null;
    currency?: string;
    stock?: number;
    description?: string | null;
  }>();

  if (!body.name) return c.json({ error: 'نام محصول ضروری است' }, 400);

  const product = await upsertProduct(c.env.DB, { ...body, bot_id: botId });
  return c.json(product);
});

app.delete('/api/bots/:id/products/:productId', async (c) => {
  await deleteProduct(c.env.DB, c.req.param('productId'));
  return c.json({ ok: true });
});

// ------------------------------ تست اتصال ---------------------------------

app.post('/api/bots/:id/test', async (c) => {
  const bot = await getBotById(c.env.DB, c.req.param('id'));
  if (!bot) return c.json({ error: 'یافت نشد' }, 404);

  const { message } = await c.req.json<{ message: string }>();

  try {
    const aiApiKey = await decrypt(bot.ai_api_key_enc, c.env.ENCRYPTION_KEY);
    const products = await listProducts(c.env.DB, bot.id);
    const systemPrompt = buildSystemPrompt(bot, products);
    const provider = getAIProvider(bot.ai_provider);

    const reply = await provider.complete({
      systemPrompt,
      history: [],
      userMessage: message || 'سلام',
      model: bot.ai_model,
      apiKey: aiApiKey,
    });

    return c.json({ reply });
  } catch (err: any) {
    return c.json({ error: err.message || 'خطا در تست اتصال' }, 500);
  }
});

// ----------------------------- مکالمات اخیر -------------------------------

app.get('/api/bots/:id/conversations', async (c) => {
  const list = await listRecentConversations(c.env.DB, c.req.param('id'), 100);
  return c.json(list);
});

// ============================================================================
// سرو کردن پنل (React SPA) برای هر مسیر غیر از /api و /webhook
// ============================================================================
app.get('*', (c) => c.env.ASSETS.fetch(c.req.raw));

function sanitizeBot(bot: Bot) {
  // توکن و کلید رمزنگاری‌شده هرگز نباید به کلاینت برگردد
  const { telegram_token_enc, ai_api_key_enc, ...safe } = bot;
  return safe;
}

export default app;
