const TELEGRAM_API = 'https://api.telegram.org';

export async function sendTelegramMessage(
  botToken: string,
  chatId: string | number,
  text: string
): Promise<void> {
  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    }),
  });

  if (!res.ok) {
    // اگر Markdown نامعتبر بود، بدون فرمت دوباره تلاش کن
    await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  }
}

export async function setTelegramWebhook(
  botToken: string,
  webhookUrl: string,
  secretToken: string
): Promise<{ ok: boolean; description?: string }> {
  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secretToken,
      allowed_updates: ['message'],
    }),
  });
  return res.json();
}

export async function deleteTelegramWebhook(botToken: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/deleteWebhook`, { method: 'POST' });
  return res.json();
}

export async function getTelegramBotInfo(
  botToken: string
): Promise<{ ok: boolean; result?: { username: string; first_name: string } }> {
  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/getMe`);
  return res.json();
}
