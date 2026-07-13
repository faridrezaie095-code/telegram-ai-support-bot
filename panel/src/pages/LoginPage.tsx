import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.login(password);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-line bg-white/60 p-8 shadow-sm"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-stamp border-2 border-seal font-display text-xs font-bold text-seal">
            ربات
          </div>
          <h1 className="font-display text-xl font-bold text-ink">ورود به دفتر مدیریت</h1>
          <p className="mt-1 text-sm text-ink/60">برای دسترسی به ربات‌های پشتیبانی خود وارد شوید</p>
        </div>

        <label className="mb-1 block text-sm text-ink/70">رمز عبور</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="focus-ring mb-4 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
          autoFocus
        />

        {error && <p className="mb-4 text-sm text-seal">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="focus-ring w-full rounded-md bg-seal py-2 text-sm font-bold text-white transition hover:bg-seal-dark disabled:opacity-60"
        >
          {loading ? 'در حال ورود...' : 'ورود'}
        </button>
      </form>
    </div>
  );
}
