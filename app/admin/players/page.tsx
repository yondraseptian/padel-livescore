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
      <div className="min-h-screen bg-[#fefefe] flex flex-col items-center justify-center text-[#282c90]/50">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#48c4c4]" />
        <p>Memuat data pemain...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fefefe] text-[#282c90]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#48c4c4]/20 bg-[#fefefe]/95 backdrop-blur supports-[backdrop-filter]:bg-[#fefefe]/90">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Activity className="w-6 h-6 text-[#48c4c4] shrink-0" />
            <span className="font-bold hidden sm:inline text-[#282c90]">Admin Panel</span>
          </Link>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-4 mr-4">
              <Link href="/admin/dashboard" className="text-sm font-medium text-[#282c90]/50 hover:text-[#282c90] transition-colors">
                Matches
              </Link>
              <Link href="/admin/tournaments" className="text-sm font-medium text-[#282c90]/50 hover:text-[#282c90] transition-colors">
                Tournaments
              </Link>
              <span className="text-sm font-bold text-[#48c4c4] underline underline-offset-4">
                Players
              </span>
            </nav>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2 border-[#48c4c4]/30 text-[#282c90] hover:bg-[#48c4c4]/10"
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
            <h1 className="text-3xl font-bold text-[#282c90] mb-2">Manajemen Pemain</h1>
            <p className="text-[#282c90]/50">
              Kelola data pemain yang terdaftar di sistem
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#282c90]/30" />
            <Input
              placeholder="Cari nama pemain..."
              className="pl-10 bg-white border-[#48c4c4]/30 text-[#282c90] placeholder:text-[#282c90]/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Card className="bg-white border-[#48c4c4]/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#282c90] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#48c4c4]" />
              Daftar Pemain
            </CardTitle>
            <CardDescription className="text-[#282c90]/40">
              Menampilkan {filteredPlayers.length} pemain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-[#48c4c4]/20 overflow-hidden">
              <Table>
                <TableHeader className="bg-[#282c90]/5">
                  <TableRow className="border-[#48c4c4]/20">
                    <TableHead className="text-[#282c90]/60">Nama</TableHead>
                    <TableHead className="text-[#282c90]/60">ID Pemain</TableHead>
                    <TableHead className="text-[#282c90]/60">Terdaftar Pada</TableHead>
                    <TableHead className="text-right text-[#282c90]/60">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-[#282c90]/30">
                        Tidak ada pemain ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlayers.map((player) => (
                      <TableRow key={player.id} className="border-[#48c4c4]/10 hover:bg-[#282c90]/5 transition-colors">
                        <TableCell className="font-medium text-[#282c90]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#282c90]/10 flex items-center justify-center text-xs font-bold text-[#48c4c4] border border-[#48c4c4]/20">
                              {player.name.charAt(0)}
                            </div>
                            {player.name}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-[#282c90]/40">
                          {player.id}
                        </TableCell>
                        <TableCell className="text-[#282c90]/60 text-sm">
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
                                className="text-[#282c90]/30 hover:text-red-500 hover:bg-red-50"
                                disabled={deletingId === player.id}
                              >
                                {deletingId === player.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white border-[#48c4c4]/20 text-[#282c90]">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-[#282c90]">Hapus Pemain?</AlertDialogTitle>
                                <AlertDialogDescription className="text-[#282c90]/60">
                                  Tindakan ini tidak dapat dibatalkan. Pemain <strong>{player.name}</strong> akan dihapus secara permanen dari sistem.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-white border-[#48c4c4]/30 text-[#282c90] hover:bg-[#282c90]/5">Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeletePlayer(player.id)}
                                  className="bg-red-500 hover:bg-red-600 text-white"
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
        <div className="mt-8 p-4 bg-[#48c4c4]/10 border border-[#48c4c4]/30 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-[#48c4c4] shrink-0" />
          <div className="text-sm">
            <p className="font-bold text-[#282c90] mb-1">Perhatian</p>
            <p className="text-[#282c90]/60 leading-relaxed">
              Anda tidak dapat menghapus pemain yang sedang terdaftar dalam turnamen aktif atau memiliki riwayat pertandingan. 
              Untuk menghapus pemain tersebut, Anda harus menghapus data pendaftaran atau pertandingan terkait terlebih dahulu.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
