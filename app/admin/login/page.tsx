import { Metadata } from 'next';
import Link from 'next/link';
import { AdminLoginForm } from '@/components/admin-login-form';
import { Activity } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin Login - Padel LiveScore',
  description: 'Login to the admin dashboard to manage match scores',
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="mb-12 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
          <Activity className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">Padel LiveScore</h1>
        </Link>
        <h2 className="text-3xl font-bold">Referee Dashboard</h2>
        <p className="text-muted-foreground mt-2">Login to enter match scores</p>
      </div>

      {/* Login Form */}
      <AdminLoginForm />

      {/* Footer */}
      <footer className="mt-12 text-center text-muted-foreground text-sm">
        <p>
          <Link href="/" className="text-primary hover:underline">
            Back to home
          </Link>
        </p>
      </footer>
    </div>
  );
}
