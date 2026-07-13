import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await api.logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-paper/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-lg font-bold text-ink">
            دفتر ربات‌های پشتیبانی
          </Link>
          <button
            onClick={handleLogout}
            className="focus-ring rounded-md px-3 py-1.5 text-sm text-ink/60 transition hover:text-seal"
          >
            خروج
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
