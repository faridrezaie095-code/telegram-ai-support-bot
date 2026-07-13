import type { Bot, ChatMessage, Env, Product } from './types';

const uuid = () => crypto.randomUUID();

// ------------------------------- Bots ---------------------------------

export async function getBotById(db: D1Database, id: string): Promise<Bot | null> {
  const row = await db.prepare('SELECT * FROM bots WHERE id = ?').bind(id).first<Bot>();
  return row ?? null;
}

export async function listBots(db: D1Database): Promise<Bot[]> {
  const { results } = await db.prepare('SELECT * FROM bots ORDER BY created_at DESC').all<Bot>();
  return results ?? [];
}

export interface CreateBotInput {
  name: string;
  business_description?: string;
  tone?: string;
  fallback_message?: string;
  telegram_token_enc: string;
  telegram_webhook_secret: string;
  ai_provider: string;
  ai_api_key_enc: string;
  ai_model: string;
}

export async function createBot(db: D1Database, input: CreateBotInput): Promise<Bot> {
  const id = uuid();
  await db
    .prepare(
      `INSERT INTO bots
        (id, name, business_description, tone, fallback_message,
         telegram_token_enc, telegram_webhook_secret,
         ai_provider, ai_api_key_enc, ai_model)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.name,
      input.business_description ?? null,
      input.tone ?? 'دوستانه و حرفه‌ای',
      input.fallback_message ?? 'برای این سوال باید با پشتیبانی انسانی صحبت کنید.',
      input.telegram_token_enc,
      input.telegram_webhook_secret,
      input.ai_provider,
      input.ai_api_key_enc,
      input.ai_model
    )
    .run();

  const created = await getBotById(db, id);
  if (!created) throw new Error('ساخت بات ناموفق بود');
  return created;
}

export async function updateBot(
  db: D1Database,
  id: string,
  fields: Partial<CreateBotInput> & { is_active?: number }
): Promise<void> {
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;

  const setClause = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => v);

  await db
    .prepare(`UPDATE bots SET ${setClause}, updated_at = datetime('now') WHERE id = ?`)
    .bind(...values, id)
    .run();
}

export async function deleteBot(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM bots WHERE id = ?').bind(id).run();
}

// ----------------------------- Products --------------------------------

export async function listProducts(db: D1Database, botId: string): Promise<Product[]> {
  const { results } = await db
    .prepare('SELECT * FROM products WHERE bot_id = ? ORDER BY updated_at DESC')
    .bind(botId)
    .all<Product>();
  return results ?? [];
}

export interface UpsertProductInput {
  id?: string;
  bot_id: string;
  name: string;
  price?: number | null;
  currency?: string;
  stock?: number;
  description?: string | null;
}

export async function upsertProduct(db: D1Database, input: UpsertProductInput): Promise<Product> {
  const id = input.id ?? uuid();
  await db
    .prepare(
      `INSERT INTO products (id, bot_id, name, price, currency, stock, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         price = excluded.price,
         currency = excluded.currency,
         stock = excluded.stock,
         description = excluded.description,
         updated_at = datetime('now')`
    )
    .bind(
      id,
      input.bot_id,
      input.name,
      input.price ?? null,
      input.currency ?? 'تومان',
      input.stock ?? 0,
      input.description ?? null
    )
    .run();

  const row = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first<Product>();
  if (!row) throw new Error('ثبت محصول ناموفق بود');
  return row;
}

export async function deleteProduct(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
}

// --------------------------- Conversations -------------------------------

export async function getRecentHistory(
  db: D1Database,
  botId: string,
  chatId: string,
  limit = 6
): Promise<ChatMessage[]> {
  const { results } = await db
    .prepare(
      `SELECT role, content FROM conversations
       WHERE bot_id = ? AND telegram_chat_id = ?
       ORDER BY created_at DESC LIMIT ?`
    )
    .bind(botId, chatId, limit)
    .all<ChatMessage>();

  return (results ?? []).reverse();
}

export async function saveMessage(
  db: D1Database,
  botId: string,
  chatId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO conversations (bot_id, telegram_chat_id, role, content) VALUES (?, ?, ?, ?)`
    )
    .bind(botId, chatId, role, content)
    .run();
}

export async function listRecentConversations(
  db: D1Database,
  botId: string,
  limit = 50
): Promise<(ChatMessage & { telegram_chat_id: string; created_at: string })[]> {
  const { results } = await db
    .prepare(
      `SELECT telegram_chat_id, role, content, created_at FROM conversations
       WHERE bot_id = ? ORDER BY created_at DESC LIMIT ?`
    )
    .bind(botId, limit)
    .all();
  return (results ?? []) as any;
}
