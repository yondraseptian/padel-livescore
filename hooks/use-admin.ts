import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useAdmin() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check');
        setIsAuthenticated(res.ok);

        if (!res.ok) {
          router.push('/admin/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  return { isAuthenticated, loading };
}
