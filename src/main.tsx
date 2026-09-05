// Build cache-buster: forces Vite to actually recompile this entry (and
// re-read current env vars) instead of Vercel reusing a cached bundle that
// predates the Supabase/Groq environment variables being set.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './hooks/useAuth.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
