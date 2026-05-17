import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  children: ReactNode;
}

export default function AuthGuard({ children }: Props) {
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = '/admin/login';
      } else {
        setVerified(true);
      }
    });
  }, []);

  if (!verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex items-center gap-3 text-gray-500">
          <svg
            className="w-5 h-5 animate-spin text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm font-medium">Verificando sesión...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
