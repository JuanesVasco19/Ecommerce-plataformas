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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-stone-200"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#9333ea] animate-spin"></div>
          </div>
          <p className="text-sm text-stone-500 font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
