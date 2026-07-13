export interface Env {
  DB: D1Database;
  BOT_KV: KVNamespace;
  ASSETS: Fetcher;

  APP_ENV: string;

  // این‌ها با `wrangler secret put` تنظیم می‌شوند، نه در wrangler.toml
  ENCRYPTION_KEY: string; // هر متن دلخواه؛ داخلی با SHA-256 به کلید AES-256 تبدیل می‌شود
  ADMIN_PASSWORD: string; // رمز عبور ساده برای ورود به پنل (به‌صورت secret رمزنگاری‌شده ذخیره می‌شود)
  SESSION_SECRET: string; // هر متن دلخواه، برای امضای کوکی نشست ادمین
}

export interface Bot {
  id: string;
  name: string;
  business_description: string | null;
  tone: string;
  fallback_message: string;
  telegram_token_enc: string;
  telegram_webhook_secret: string;
  ai_provider: 'openai' | 'gemini' | 'anthropic';
  ai_api_key_enc: string;
  ai_model: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  bot_id: string;
  name: string;
  price: number | null;
  currency: string;
  stock: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
