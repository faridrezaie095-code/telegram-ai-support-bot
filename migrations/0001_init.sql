-- ============================================================================
-- اسکیمای اولیه پایگاه‌داده
-- ============================================================================

-- بات‌های تلگرام تعریف‌شده در پنل. هر سطر = یک بات فعال با تنظیمات مستقل.
CREATE TABLE IF NOT EXISTS bots (
  id TEXT PRIMARY KEY,                    -- uuid
  name TEXT NOT NULL,                     -- نام نمایشی (مثلاً "کتاب‌فروشی آفتاب")
  business_description TEXT,              -- توضیح کسب‌وکار برای تزریق به پرامپت
  tone TEXT DEFAULT 'دوستانه و حرفه‌ای',   -- لحن پاسخ‌گویی
  fallback_message TEXT DEFAULT 'برای این سوال باید با پشتیبانی انسانی صحبت کنید.',

  telegram_token_enc TEXT NOT NULL,       -- توکن بات، رمزنگاری‌شده با AES-GCM
  telegram_webhook_secret TEXT NOT NULL,  -- برای اعتبارسنجی درخواست‌های وبهوک

  ai_provider TEXT NOT NULL,              -- 'openai' | 'gemini' | 'anthropic'
  ai_api_key_enc TEXT NOT NULL,           -- کلید API، رمزنگاری‌شده
  ai_model TEXT NOT NULL,                 -- مثلاً gpt-4o-mini

  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- محصولات/خدمات هر بات — این‌ها مستقیماً در سیستم‌پرامپت تزریق می‌شوند
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  bot_id TEXT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price REAL,
  currency TEXT DEFAULT 'تومان',
  stock INTEGER DEFAULT 0,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- تاریخچه مکالمات — برای context چند پیام آخر و مشاهده لاگ در پنل
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bot_id TEXT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  telegram_chat_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_bot ON products(bot_id);
CREATE INDEX IF NOT EXISTS idx_conv_lookup ON conversations(bot_id, telegram_chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conv_bot ON conversations(bot_id, created_at DESC);
