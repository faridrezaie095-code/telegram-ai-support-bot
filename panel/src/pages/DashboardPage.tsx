import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StampBadge } from '../components/StampBadge';
import { api, Bot } from '../lib/api';

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI (ChatGPT)',
  gemini: 'Google Gemini',
  anthropic: 'Anthropic Claude',
};

const DEFAULT_MODELS: Record<string, string[]> = {
  openai: ['gpt-4o-mini', 'gpt-4o'],
  gemini: ['gemini-2.0-flash', 'gemini-1.5-pro'],
  anthropic: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
};

export function DashboardPage() {
  const [bots, setBots] = useState<Bot[] | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function refresh() {
    setBots(await api.listBots());
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">ربات‌های شما</h1>
          <p className="mt-1 text-sm text-ink/60">هر بات یک کسب‌وکار مستقل با تنظیمات و کاتالوگ خودش است.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="focus-ring rounded-md bg-seal px-4 py-2 text-sm font-bold text-white hover:bg-seal-dark"
        >
          {showForm ? 'بستن فرم' : '+ ساخت بات جدید'}
        </button>
      </div>

      {showForm && (
        <NewBotForm
          onCreated={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}

      {bots === null && <p className="text-ink/60">در حال بارگذاری...</p>}
      {bots?.length === 0 && (
        <div className="rounded-lg border border-dashed border-line p-10 text-center text-ink/60">
          هنوز هیچ باتی نساخته‌اید. با دکمه‌ی بالا اولین ربات پشتیبانی خود را بسازید.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {bots?.map((bot) => (
          <Link
            key={bot.id}
            to={`/bots/${bot.id}`}
            className="focus-ring rounded-lg border border-line bg-white/60 p-5 transition hover:border-seal hover:shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display font-bold text-ink">{bot.name}</h2>
              <StampBadge active={!!bot.is_active} />
            </div>
            <p className="line-clamp-2 text-sm text-ink/60">
              {bot.business_description || 'بدون توضیح کسب‌وکار'}
            </p>
            <p className="mt-3 font-mono text-xs text-ink/40">
              {PROVIDER_LABELS[bot.ai_provider] || bot.ai_provider} · {bot.ai_model}
            </p>
          </Link>
        ))}
      </div>
    </Layout>
  );
}

function NewBotForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '',
    business_description: '',
    tone: 'دوستانه و حرفه‌ای',
    fallback_message: 'برای این سوال باید با پشتیبانی انسانی صحبت کنید.',
    telegram_token: '',
    ai_provider: 'openai',
    ai_model: 'gpt-4o-mini',
    ai_api_key: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.createBot(form);
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 rounded-lg border border-line bg-white/60 p-6">
      <h2 className="mb-4 font-display font-bold text-ink">ساخت ربات پشتیبانی جدید</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="نام کسب‌وکار / بات">
          <input
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="مثلاً کتاب‌فروشی آفتاب"
            className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
          />
        </Field>

        <Field label="توکن بات تلگرام (از BotFather)">
          <input
            required
            value={form.telegram_token}
            onChange={(e) => set('telegram_token', e.target.value)}
            placeholder="123456:ABC-DEF..."
            className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm font-mono"
          />
        </Field>

        <Field label="توضیح کسب‌وکار" full>
          <textarea
            value={form.business_description}
            onChange={(e) => set('business_description', e.target.value)}
            placeholder="مثلاً: کتاب‌فروشی آفتاب در اصفهان، فروش کتاب‌های دانشگاهی و رمان. ساعت کاری ۹ تا ۲۱."
            rows={3}
            className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
          />
        </Field>

        <Field label="لحن پاسخ‌گویی">
          <input
            value={form.tone}
            onChange={(e) => set('tone', e.target.value)}
            className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
          />
        </Field>

        <Field label="پیام پیش‌فرض هنگام ندانستن پاسخ">
          <input
            value={form.fallback_message}
            onChange={(e) => set('fallback_message', e.target.value)}
            className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
          />
        </Field>

        <Field label="پروایدر هوش مصنوعی">
          <select
            value={form.ai_provider}
            onChange={(e) => {
              const provider = e.target.value;
              set('ai_provider', provider);
              set('ai_model', DEFAULT_MODELS[provider]?.[0] ?? '');
            }}
            className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
          >
            {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="مدل">
          <select
            value={form.ai_model}
            onChange={(e) => set('ai_model', e.target.value)}
            className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
          >
            {(DEFAULT_MODELS[form.ai_provider] ?? []).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>

        <Field label="کلید API هوش مصنوعی" full>
          <input
            required
            value={form.ai_api_key}
            onChange={(e) => set('ai_api_key', e.target.value)}
            placeholder="sk-..."
            className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm font-mono"
          />
        </Field>
      </div>

      {error && <p className="mt-4 text-sm text-seal">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="focus-ring mt-5 rounded-md bg-seal px-5 py-2 text-sm font-bold text-white hover:bg-seal-dark disabled:opacity-60"
      >
        {loading ? 'در حال ساخت و اتصال به تلگرام...' : 'ساخت بات و اتصال به تلگرام'}
      </button>
    </form>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="mb-1 block text-sm text-ink/70">{label}</label>
      {children}
    </div>
  );
}
