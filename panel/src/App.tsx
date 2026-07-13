import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { BotDetailPage } from './pages/BotDetailPage';
import { api } from './lib/api';

type AuthState = 'checking' | 'authed' | 'anon';

function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>('checking');

  useEffect(() => {
    api
      .listBots()
      .then(() => setState('authed'))
      .catch(() => setState('anon'));
  }, []);

  return state;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuthState();

  if (auth === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink/50">در حال بررسی ورود...</div>
    );
  }
  if (auth === 'anon') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bots/:id"
        element={
          <ProtectedRoute>
            <BotDetailPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
