'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  LogOut, 
  Activity, 
  Users, 
  Trash2, 
  Search, 
  Loader2, 
  AlertCircle,
  Trophy
} from 'lucide-react';
import Link from 'next/link';
import { useAdmin } from '@/hooks/use-admin';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminPlayersPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAdmin();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;

    fetchPlayers();
  }, [isAuthenticated, authLoading]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/players');
      const data = await res.json();
      if (res.ok) {
        setPlayers(data);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    try {
      setDeletingId(id);
      const res = await fetch(`/api/admin/players?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to delete player');
        return;
      }

      setPlayers(players.filter(p => p.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      alert('An error occurred while deleting the player');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-amber-500" />
        <p>Memuat data pemain...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Activity className="w-6 h-6 text-amber-500 shrink-0" />
            <span className="font-bold hidden sm:inline text-white">Admin Panel</span>
          </Link>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-4 mr-4">
              <Link href="/admin/dashboard" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                Matches
              </Link>
              <Link href="/admin/tournaments" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                Tournaments
              </Link>
              <span className="text-sm font-bold text-amber-500 underline underline-offset-4">
                Players
              </span>
            </nav>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Manajemen Pemain</h1>
            <p className="text-slate-400">
              Kelola data pemain yang terdaftar di sistem
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Cari nama pemain..."
              className="pl-10 bg-slate-900 border-slate-800 text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              Daftar Pemain
            </CardTitle>
            <CardDescription className="text-slate-500">
              Menampilkan {filteredPlayers.length} pemain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-800/50">
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">Nama</TableHead>
                    <TableHead className="text-slate-400">ID Pemain</TableHead>
                    <TableHead className="text-slate-400">Terdaftar Pada</TableHead>
                    <TableHead className="text-right text-slate-400">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                        Tidak ada pemain ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlayers.map((player) => (
                      <TableRow key={player.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                        <TableCell className="font-medium text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-amber-500 border border-slate-700">
                              {player.name.charAt(0)}
                            </div>
                            {player.name}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">
                          {player.id}
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {new Date(player.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-500 hover:text-red-500 hover:bg-red-500/10"
                                disabled={deletingId === player.id}
                              >
                                {deletingId === player.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-200">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Hapus Pemain?</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400">
                                  Tindakan ini tidak dapat dibatalkan. Pemain <strong>{player.name}</strong> akan dihapus secara permanen dari sistem.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeletePlayer(player.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Warning Section */}
        <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="text-sm">
            <p className="font-bold text-amber-500 mb-1">Perhatian</p>
            <p className="text-slate-400 leading-relaxed">
              Anda tidak dapat menghapus pemain yang sedang terdaftar dalam turnamen aktif atau memiliki riwayat pertandingan. 
              Untuk menghapus pemain tersebut, Anda harus menghapus data pendaftaran atau pertandingan terkait terlebih dahulu.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
