import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StampBadge } from '../components/StampBadge';
import { api, Bot, Product } from '../lib/api';

type Tab = 'products' | 'settings' | 'test' | 'logs';

export function BotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [bot, setBot] = useState<Bot | null>(null);
  const [tab, setTab] = useState<Tab>('products');
  const navigate = useNavigate();

  async function refresh() {
    if (id) setBot(await api.getBot(id));
  }

  useEffect(() => {
    refresh();
  }, [id]);

  if (!bot || !id) {
    return (
      <Layout>
        <p className="text-ink/60">در حال بارگذاری...</p>
      </Layout>
    );
  }

  const botId = id;

  async function toggleActive() {
    await api.updateBot(botId, { is_active: !bot!.is_active });
    refresh();
  }

  async function handleDelete() {
    if (!confirm('این بات برای همیشه حذف می‌شود و وبهوک آن قطع خواهد شد. مطمئن هستید؟')) return;
    await api.deleteBot(botId);
    navigate('/');
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-ink">{bot.name}</h1>
          <StampBadge active={!!bot.is_active} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleActive}
            className="focus-ring rounded-md border border-line px-3 py-1.5 text-sm hover:border-moss hover:text-moss"
          >
            {bot.is_active ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
          </button>
          <button
            onClick={handleDelete}
            className="focus-ring rounded-md border border-line px-3 py-1.5 text-sm text-seal hover:border-seal"
          >
            حذف بات
          </button>
        </div>
      </div>

      <div className="mb-6 flex gap-1 border-b border-line">
        {(
          [
            ['products', 'کاتالوگ محصولات'],
            ['settings', 'تنظیمات'],
            ['test', 'تست گفتگو'],
            ['logs', 'مکالمات اخیر'],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`focus-ring -mb-px border-b-2 px-4 py-2 text-sm ${
              tab === value ? 'border-seal font-bold text-seal' : 'border-transparent text-ink/60 hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'products' && <ProductsTab botId={id} />}
      {tab === 'settings' && <SettingsTab bot={bot} onSaved={refresh} />}
      {tab === 'test' && <TestTab botId={id} />}
      {tab === 'logs' && <LogsTab botId={id} />}
    </Layout>
  );
}

// ============================================================================
function ProductsTab({ botId }: { botId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState({ name: '', price: '', stock: '0', description: '' });

  async function refresh() {
    setProducts(await api.listProducts(botId));
  }

  useEffect(() => {
    refresh();
  }, [botId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name) return;
    await api.upsertProduct(botId, {
      name: draft.name,
      price: draft.price ? Number(draft.price) : null,
      stock: Number(draft.stock) || 0,
      description: draft.description || null,
    });
    setDraft({ name: '', price: '', stock: '0', description: '' });
    refresh();
  }

  async function handleDelete(productId: string) {
    await api.deleteProduct(botId, productId);
    refresh();
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-6 grid gap-3 rounded-lg border border-line bg-white/60 p-4 sm:grid-cols-5">
        <input
          placeholder="نام محصول"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          placeholder="قیمت (تومان)"
          type="number"
          value={draft.price}
          onChange={(e) => setDraft({ ...draft, price: e.target.value })}
          className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm"
        />
        <input
          placeholder="موجودی"
          type="number"
          value={draft.stock}
          onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
          className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm"
        />
        <button className="focus-ring rounded-md bg-moss px-3 py-2 text-sm font-bold text-white hover:opacity-90">
          افزودن
        </button>
        <input
          placeholder="توضیح کوتاه (اختیاری)"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm sm:col-span-5"
        />
      </form>

      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full font-mono text-sm">
          <thead className="bg-line/30 text-ink/70">
            <tr>
              <th className="p-3 text-right">نام</th>
              <th className="p-3 text-right">قیمت</th>
              <th className="p-3 text-right">موجودی</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.price != null ? `${p.price.toLocaleString('fa-IR')} ${p.currency}` : '—'}</td>
                <td className="p-3">{p.stock > 0 ? p.stock : 'ناموجود'}</td>
                <td className="p-3 text-left">
                  <button onClick={() => handleDelete(p.id)} className="focus-ring text-seal hover:underline">
                    حذف
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-ink/50">
                  هنوز محصولی ثبت نشده است.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
function SettingsTab({ bot, onSaved }: { bot: Bot; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: bot.name,
    business_description: bot.business_description || '',
    tone: bot.tone,
    fallback_message: bot.fallback_message,
    telegram_token: '',
    ai_api_key: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const payload: Record<string, unknown> = {
      name: form.name,
      business_description: form.business_description,
      tone: form.tone,
      fallback_message: form.fallback_message,
    };
    if (form.telegram_token) payload.telegram_token = form.telegram_token;
    if (form.ai_api_key) payload.ai_api_key = form.ai_api_key;

    await api.updateBot(bot.id, payload);
    setSaving(false);
    setSaved(true);
    onSaved();
  }

  return (
    <form onSubmit={handleSave} className="max-w-xl space-y-4 rounded-lg border border-line bg-white/60 p-6">
      <div>
        <label className="mb-1 block text-sm text-ink/70">نام کسب‌وکار</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-ink/70">توضیح کسب‌وکار</label>
        <textarea
          rows={3}
          value={form.business_description}
          onChange={(e) => setForm({ ...form, business_description: e.target.value })}
          className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-ink/70">لحن پاسخ‌گویی</label>
        <input
          value={form.tone}
          onChange={(e) => setForm({ ...form, tone: e.target.value })}
          className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-ink/70">پیام هنگام ندانستن پاسخ</label>
        <input
          value={form.fallback_message}
          onChange={(e) => setForm({ ...form, fallback_message: e.target.value })}
          className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
        />
      </div>
      <hr className="border-line" />
      <div>
        <label className="mb-1 block text-sm text-ink/70">جایگزینی توکن بات تلگرام (اختیاری)</label>
        <input
          value={form.telegram_token}
          onChange={(e) => setForm({ ...form, telegram_token: e.target.value })}
          placeholder="خالی بگذارید تا بدون تغییر بماند"
          className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm font-mono"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-ink/70">جایگزینی کلید API هوش مصنوعی (اختیاری)</label>
        <input
          value={form.ai_api_key}
          onChange={(e) => setForm({ ...form, ai_api_key: e.target.value })}
          placeholder="خالی بگذارید تا بدون تغییر بماند"
          className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm font-mono"
        />
      </div>

      <button
        disabled={saving}
        className="focus-ring rounded-md bg-seal px-5 py-2 text-sm font-bold text-white hover:bg-seal-dark disabled:opacity-60"
      >
        {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
      </button>
      {saved && <span className="mr-3 text-sm text-moss">ذخیره شد ✓</span>}
    </form>
  );
}

// ============================================================================
function TestTab({ botId }: { botId: string }) {
  const [message, setMessage] = useState('این کتاب رو دارید؟');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleTest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setReply('');
    try {
      const res = await api.testBot(botId, message);
      setReply(res.reply);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl rounded-lg border border-line bg-white/60 p-6">
      <p className="mb-4 text-sm text-ink/60">
        یک پیام آزمایشی بفرستید تا ببینید بات با تنظیمات و کاتالوگ فعلی چه پاسخی می‌دهد — بدون نیاز به تلگرام.
      </p>
      <form onSubmit={handleTest} className="flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="focus-ring flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm"
        />
        <button
          disabled={loading}
          className="focus-ring rounded-md bg-moss px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'در حال پرسیدن...' : 'ارسال'}
        </button>
      </form>
      {error && <p className="mt-4 text-sm text-seal">{error}</p>}
      {reply && (
        <div className="mt-4 rounded-md border border-line bg-paper p-4 text-sm">
          <span className="mb-1 block font-bold text-ink/70">پاسخ بات:</span>
          {reply}
        </div>
      )}
    </div>
  );
}

// ============================================================================
function LogsTab({ botId }: { botId: string }) {
  const [logs, setLogs] = useState<{ telegram_chat_id: string; role: string; content: string; created_at: string }[]>(
    []
  );

  useEffect(() => {
    api.conversations(botId).then(setLogs);
  }, [botId]);

  if (logs.length === 0) {
    return <p className="text-ink/60">هنوز مکالمه‌ای در تلگرام ثبت نشده است.</p>;
  }

  return (
    <div className="space-y-2">
      {logs.map((l, i) => (
        <div
          key={i}
          className={`rounded-md border border-line p-3 text-sm ${l.role === 'user' ? 'bg-white/60' : 'bg-paper'}`}
        >
          <div className="mb-1 flex justify-between font-mono text-xs text-ink/40">
            <span>{l.role === 'user' ? 'مشتری' : 'بات'} · چت {l.telegram_chat_id}</span>
            <span>{l.created_at}</span>
          </div>
          {l.content}
        </div>
      ))}
    </div>
  );
}
