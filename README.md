# 🕊️ پلتفرم ربات پشتیبانی هوش مصنوعی برای تلگرام

پلتفرم متن‌باز و رایگان برای ساخت ربات پشتیبانی مشتریان در تلگرام با هوش مصنوعی.
هر کسب‌وکاری می‌تواند این ریپو را فورک کند، روی حساب Cloudflare خودش (رایگان) دیپلوی کند،
و از طریق یک پنل مدیریت زیبا، اطلاعات فروشگاه/محصولات را وارد کند تا بات تلگرامش
فقط بر اساس همان اطلاعات به مشتریان پاسخ بدهد.

## چرا Cloudflare؟

Railway و بیشتر PaaSهای مشابه دیگر تیر رایگان واقعی ندارند (فقط اعتبار آزمایشی محدود).
Cloudflare Workers + D1 + KV تیر رایگان دائمی دارد و نیازی به کارت اعتباری نیست.

## معماری

یک Worker واحد هم API پنل را سرو می‌کند، هم وبهوک تلگرام را می‌گیرد، هم فایل‌های
پنل React ساخته‌شده را سرو می‌کند. یعنی فقط یک پروژه روی Cloudflare دیپلوی می‌شود.

```
تلگرام ──Webhook──▶ Cloudflare Worker ──▶ AI Provider (OpenAI/Gemini/Claude)
                        │
                D1 (بات‌ها، محصولات، لاگ) + KV (rate-limit)
```

---

## 🟢 روش نصب کاملاً بدون ترمینال (حتی با گوشی)

این روش هیچ نصب Node.js، هیچ خط فرمان و هیچ کامپیوتری لازم ندارد — همه‌چیز از
طریق اپ/سایت گیت‌هاب و داشبورد وب Cloudflare انجام می‌شود. Cloudflare یک قابلیت
به نام **Workers Builds** دارد که هر بار به ریپوی گیت‌هاب شما push شود، خودش
پروژه را build و deploy می‌کند — دقیقاً مثل Git integration که برای Pages می‌شناسید.

### قدم ۱ — فورک ریپو در گیت‌هاب

با مرورگر گوشی یا اپ GitHub وارد ریپو شوید و دکمه‌ی **Fork** را بزنید تا یک
نسخه از پروژه در حساب گیت‌هاب خودتان ساخته شود.

### قدم ۲ — ساخت حساب Cloudflare (اگر ندارید)

در مرورگر گوشی به [dash.cloudflare.com](https://dash.cloudflare.com) بروید و
یک حساب رایگان بسازید.

### قدم ۳ — ساخت پایگاه‌داده D1 (از طریق داشبورد، بدون CLI)

در داشبورد Cloudflare:
**Storage & Databases → D1 SQL Database → Create Database**
یک نام دلخواه بدهید (مثلاً `telegram_ai_bot_db`) و بسازید.
بعد از ساخت، وارد صفحه‌ی همان دیتابیس شوید و **Database ID** را کپی کنید.

### قدم ۴ — اجرای اسکیمای دیتابیس (بدون CLI، مستقیم در داشبورد)

همان‌جا در صفحه‌ی دیتابیس، تب **Console** را باز کنید. کل محتوای فایل
`migrations/0001_init.sql` از ریپوی خودتان را کپی کنید، در کادر Console
پیست کنید و Execute بزنید. جدول‌ها ساخته می‌شوند.

### قدم ۵ — ساخت KV Namespace

**Storage & Databases → KV → Create Namespace**
نامش را مثلاً `BOT_KV` بگذارید و **Namespace ID** را کپی کنید.

### قدم ۶ — ویرایش دو خط در wrangler.toml (از طریق اپ گیت‌هاب)

در اپ یا سایت گیت‌هاب، وارد فایل `wrangler.toml` در ریپوی فورک‌شده‌ی خودتان شوید،
روی آیکون مداد (ویرایش) بزنید و این دو مقدار را جایگزین کنید:

- `REPLACE_WITH_YOUR_D1_DATABASE_ID` ← Database ID از قدم ۳
- `REPLACE_WITH_YOUR_KV_NAMESPACE_ID` ← Namespace ID از قدم ۵

مستقیم در همان صفحه‌ی گیت‌هاب دکمه‌ی **Commit changes** را بزنید.

### قدم ۷ — اتصال ریپو به Cloudflare Workers Builds

در داشبورد Cloudflare:
**Workers & Pages → Create → Import a Git repository**
گیت‌هاب را متصل کنید (اولین بار باید دسترسی بدهید) و ریپوی فورک‌شده را انتخاب کنید.

در تنظیمات بیلد این مقادیر را وارد کنید:
- **Build command:** `npm install`
- **Deploy command:** `npm run deploy`

سپس **Save and Deploy** را بزنید. هر بار هم که بعداً تغییری در ریپو بدهید، این
مراحل خودکار دوباره اجرا می‌شود.

### قدم ۸ — تنظیم سه مقدار محرمانه (Secrets)

بعد از اولین دیپلوی، در صفحه‌ی همان Worker:
**Settings → Variables and Secrets → Add**

سه متغیر زیر را اضافه کنید و تیک **Encrypt** را برای هر سه بزنید:

| نام متغیر | مقدار |
|---|---|
| `ADMIN_PASSWORD` | رمز عبور دلخواه شما برای ورود به پنل (هرچی دوست دارید) |
| `ENCRYPTION_KEY` | یک متن تصادفی و طولانی دلخواه (مثلاً چند کلمه‌ی نامرتبط پشت‌سرهم) |
| `SESSION_SECRET` | یک متن تصادفی و طولانی دیگر، متفاوت از بالا |

نیازی به فرمت خاص یا محاسبه‌ی هش نیست — هرچه بنویسید داخل کد به‌صورت خودکار
به کلید امن تبدیل می‌شود. بعد از افزودن هر سه، دوباره Deploy کنید (دکمه‌ی
**Retry deployment** یا با یک commit جزئی).

### قدم ۹ — اولین ورود و ساخت بات

آدرس Worker شما چیزی شبیه
`https://telegram-ai-support-bot.<subdomain>.workers.dev` است.
همان‌جا با رمزی که در `ADMIN_PASSWORD` گذاشتید وارد شوید و:

1. روی «ساخت بات جدید» بزنید
2. توکن بات تلگرام (از [@BotFather](https://t.me/BotFather)) را وارد کنید
3. کلید API هوش مصنوعی (OpenAI / Gemini / Anthropic) را وارد کنید
4. توضیح کسب‌وکار و لحن پاسخ‌گویی را بنویسید
5. پنل خودش وبهوک تلگرام را ثبت می‌کند — کاری لازم نیست بکنید

بعد در تب «کاتالوگ محصولات»، محصولات و قیمت‌ها را وارد کنید و در «تست گفتگو»
بدون نیاز به تلگرام امتحان کنید. در آخر به بات خودتان در تلگرام پیام بدهید.

---

## 🛠 روش دوم: نصب با ترمینال (برای کسانی که کامپیوتر و Node.js دارند)

```bash
git clone <آدرس-فورک-شما>
cd telegram-ai-support-bot
npm install

npx wrangler login
npx wrangler d1 create telegram_ai_bot_db        # database_id را در wrangler.toml بگذارید
npx wrangler kv namespace create BOT_KV          # id را در wrangler.toml بگذارید
npm run db:migrate:remote

npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ENCRYPTION_KEY
npx wrangler secret put SESSION_SECRET

npm run deploy
```

توسعه‌ی محلی:
```bash
npx wrangler dev            # ترمینال ۱
cd panel && npm run dev     # ترمینال ۲ (روی /api به ترمینال ۱ proxy می‌شود)
```

---

## ساختار پروژه

```
worker/src/
  index.ts        نقطه ورود Worker: مسیرهای API و وبهوک
  db.ts           تمام کوئری‌های D1
  crypto.ts        رمزنگاری AES-GCM برای توکن/کلید API
  auth.ts          ورود/خروج ادمین با کوکی نشست امضاشده
  prompt.ts        ساخت سیستم‌پرامپت از اطلاعات کسب‌وکار + محصولات
  telegram.ts      توابع کمکی Telegram Bot API
  ai/              پیاده‌سازی هر پروایدر (openai.ts، gemini.ts، anthropic.ts)

panel/src/
  pages/           صفحات ورود، داشبورد، جزئیات بات
  components/      Layout و StampBadge (مهر تأیید وضعیت فعال/غیرفعال)
  lib/api.ts       کلاینت fetch برای ارتباط با /api

migrations/        اسکیمای D1 (برای اجرا در D1 Console یا با wrangler)
```

## افزودن پروایدر هوش مصنوعی جدید

۱. یک فایل مثل `worker/src/ai/mynewprovider.ts` بسازید که کلاس `AIProvider` را پیاده‌سازی کند.
۲. آن را در `worker/src/ai/index.ts` به آبجکت `providers` اضافه کنید.
۳. در `panel/src/pages/DashboardPage.tsx`، به `PROVIDER_LABELS` و `DEFAULT_MODELS` اضافه کنید.

## نکات امنیتی

- توکن بات و کلید API همیشه رمزنگاری‌شده (AES-GCM) در D1 ذخیره می‌شوند و هرگز به کلاینت پنل برگردانده نمی‌شوند.
- هر بات یک `webhook secret` مجزا دارد که در هدر درخواست تلگرام بررسی می‌شود.
- محدودیت نرخ ساده (rate limit) روی KV جلوی سواستفاده از هر چت را می‌گیرد.
- `ADMIN_PASSWORD`، `ENCRYPTION_KEY` و `SESSION_SECRET` را طولانی و غیرقابل حدس انتخاب کنید.

## مجوز

MIT — آزادانه فورک کنید، تغییر دهید و برای هر کسب‌وکاری استفاده کنید.
