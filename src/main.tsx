import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import ErrorBoundary from '@/components/ErrorBoundary';
import App from './App.tsx';
import AdminApp from './admin/AdminApp.tsx';
import './index.css';

const CLERK_KEY =
  (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string) ||
  'pk_test_YmlnLWxpemFyZC01NTMyLmNsZXJrLmFjY291bnRzLmRldiQ';

function Root() {
  const [isAdmin, setIsAdmin] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname.startsWith('/admin') : false
  );

  useEffect(() => {
    const checkPath = () => {
      setIsAdmin(window.location.pathname.startsWith('/admin'));
    };
    window.addEventListener('popstate', checkPath);
    return () => window.removeEventListener('popstate', checkPath);
  }, []);

  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      {isAdmin ? <AdminApp /> : <App />}
    </ClerkProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="Krisha Dry Fruits">
      <Root />
    </ErrorBoundary>
  </StrictMode>
);
