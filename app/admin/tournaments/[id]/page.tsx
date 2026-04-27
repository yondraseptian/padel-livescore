'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ArrowLeft, Plus, Users, Play, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useAdmin } from '@/hooks/use-admin';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { use } from 'react';

export default function TournamentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { isAuthenticated, loading: authLoading } = useAdmin();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);

  // Modals
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [isGenerateRoundOpen, setIsGenerateRoundOpen] = useState(false);
  const [roundScheduledAt, setRoundScheduledAt] = useState('');

  // Edit Player Modals
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [editedPlayerName, setEditedPlayerName] = useState('');
  const [savingPlayer, setSavingPlayer] = useState(false);

  // Edit Match Players Modals
  const [editingMatch, setEditingMatch] = useState<any>(null);
  const [matchPlayer1, setMatchPlayer1] = useState('');
  const [matchPlayer2, setMatchPlayer2] = useState('');
  const [matchPlayer3, setMatchPlayer3] = useState('');
  const [matchPlayer4, setMatchPlayer4] = useState('');
  const [savingMatchPlayers, setSavingMatchPlayers] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;

    fetchData();
    fetchPlayers();
  }, [isAuthenticated, authLoading, id]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/admin/tournaments/${id}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error fetching tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayers = async () => {
    try {
      const res = await fetch('/api/admin/players');
      const json = await res.json();
      setAvailablePlayers(json);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const handleAddPlayers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlayers.length === 0) return;

    try {
      await fetch(`/api/admin/tournaments/${id}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerIds: selectedPlayers }),
      });
      setIsAddPlayerOpen(false);
      setSelectedPlayers([]);
      await fetchData();
    } catch (error) {
      console.error('Failed to add players', error);
    }
  };

  const handleGenerateRound = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!roundScheduledAt) return;

    setGenerating(true);
    try {
      // Find latest round
      const rounds = data.matches.map((m: any) => m.round_number || 0);
      const nextRound = rounds.length > 0 ? Math.max(...rounds) + 1 : 1;

      await fetch(`/api/admin/tournaments/${id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundNumber: nextRound, scheduledAt: roundScheduledAt }),
      });
      setIsGenerateRoundOpen(false);
      setRoundScheduledAt('');
      await fetchData();
    } catch (error) {
      console.error('Failed to generate round', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleFinishTournament = async () => {
    if (!confirm('Apakah Anda yakin ingin menyelesaikan turnamen ini? Pertandingan akan disembunyikan dari halaman utama.')) return;
    
    setFinishing(true);
    try {
      await fetch(`/api/admin/tournaments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to finish tournament', error);
    } finally {
      setFinishing(false);
    }
  };

  const handleEditPlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer || !editedPlayerName.trim()) return;

    setSavingPlayer(true);
    try {
      await fetch(`/api/admin/players/${editingPlayer.player_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedPlayerName }),
      });
      setEditingPlayer(null);
      setEditedPlayerName('');
      await fetchData();
      await fetchPlayers();
    } catch (error) {
      console.error('Failed to edit player', error);
    } finally {
      setSavingPlayer(false);
    }
  };

  const openEditMatchPlayers = (match: any) => {
    setEditingMatch(match);
    setMatchPlayer1(match.team1_player1_id || '');
    setMatchPlayer2(match.team1_player2_id || '');
    setMatchPlayer3(match.team2_player1_id || '');
    setMatchPlayer4(match.team2_player2_id || '');
  };

  const handleEditMatchPlayersSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;

    setSavingMatchPlayers(true);
    try {
      await fetch(`/api/admin/matches/${editingMatch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team1_player1_id: matchPlayer1,
          team1_player2_id: matchPlayer2,
          team2_player1_id: matchPlayer3,
          team2_player2_id: matchPlayer4,
        }),
      });
      setEditingMatch(null);
      await fetchData();
    } catch (error) {
      console.error('Failed to edit match players', error);
    } finally {
      setSavingMatchPlayers(false);
    }
  };

  if (authLoading || loading) return <div className="p-8 text-center">Loading...</div>;
  if (!isAuthenticated || !data) return null;

  const { tournament, players, matches } = data;

  const isIndividualFormat = ['americano', 'mexicano', 'team_americano', 'team_mexicano'].includes(tournament.format);

  // Filter out players already in the tournament
  const enrolledIds = new Set(players.map((p: any) => p.player_id));
  const unrolledPlayers = availablePlayers.filter(p => !enrolledIds.has(p.id));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin/tournaments" className="flex items-center gap-2 hover:opacity-80">
            <ArrowLeft className="w-5 h-5 shrink-0" />
            <span className="font-bold hidden sm:inline">Back</span>
          </Link>
          <div className="font-semibold text-base sm:text-lg truncate px-2 text-center">{tournament.name}</div>
          <div className="w-5 sm:w-16 shrink-0" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold capitalize mb-2">{tournament.format} Tournament</h1>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Status: <strong className="uppercase">{tournament.status}</strong></span>
              <span>Players: <strong>{players.length}</strong></span>
            </div>
          </div>
          <div className="flex gap-2">
            {tournament.status !== 'completed' && (
              <Button 
                variant="outline" 
                className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                onClick={handleFinishTournament} 
                disabled={finishing}
              >
                {finishing ? 'Loading...' : 'Selesai Tournament'}
              </Button>
            )}
            {isIndividualFormat && tournament.status !== 'completed' && (
              <Dialog open={isGenerateRoundOpen} onOpenChange={setIsGenerateRoundOpen}>
                <DialogTrigger asChild>
                  <Button disabled={generating || players.length < 4 || players.length % 4 !== 0}>
                    <Play className="w-4 h-4 mr-2" />
                    {generating ? 'Generating...' : 'Generate Next Round'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate Round</DialogTitle>
                    <DialogDescription>Pilih jadwal untuk babak pertandingan selanjutnya.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleGenerateRound} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="roundScheduledAt">Waktu Pertandingan</Label>
                      <Input 
                        id="roundScheduledAt" 
                        type="datetime-local" 
                        value={roundScheduledAt} 
                        onChange={(e) => setRoundScheduledAt(e.target.value)} 
                        required 
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={generating || !roundScheduledAt}>
                      {generating ? 'Memproses...' : 'Buat Pertandingan'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                {players.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No players enrolled yet.</p>
                ) : (
                  <div className="space-y-2 mt-4">
                    {/* Sort by points descending */}
                    {[...players].sort((a, b) => b.points - a.points).map((tp: any, index) => (
                      <div key={tp.id} className="flex items-center justify-between p-2 rounded border bg-card">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-muted-foreground w-4">{index + 1}</span>
                          <span className="font-medium">{tp.player?.name}</span>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-bold text-primary">{tp.points} pts</div>
                            <div className="text-xs text-muted-foreground">{tp.matches_played} M</div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingPlayer(tp);
                              setEditedPlayerName(tp.player?.name || '');
                            }}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Matches</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/dashboard">Pergi ke Matches</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {matches.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No matches generated yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matches.map((match: any) => (
                      <div key={match.id} className="p-4 border rounded-lg bg-card flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground min-w-[80px]">
                          Round {match.round_number}
                        </div>
                        <div className="flex-1 flex flex-col sm:flex-row items-center gap-4 w-full">
                          <div className="flex-1 text-center sm:text-right font-semibold">
                            {match.team1_player1?.name} - {match.team1_player2?.name}
                          </div>
                          <div className="text-muted-foreground text-xs px-2 py-1 bg-muted rounded">VS</div>
                          <div className="flex-1 text-center sm:text-left font-semibold">
                            {match.team2_player1?.name} - {match.team2_player2?.name}
                          </div>
                        </div>
                        <div className="text-right min-w-[100px] flex items-center justify-end gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            match.status === 'scheduled' ? 'bg-secondary' :
                            match.status === 'live' ? 'bg-red-500/10 text-red-500' :
                            'bg-primary/20 text-primary'
                          }`}>
                            {match.status}
                          </span>
                          {match.status !== 'completed' && isIndividualFormat && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => openEditMatchPlayers(match)}
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Player Dialog */}
        <Dialog open={!!editingPlayer} onOpenChange={(open) => !open && setEditingPlayer(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Player</DialogTitle>
              <DialogDescription>Update the name of the player.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditPlayerSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="playerName">Player Name</Label>
                <Input 
                  id="playerName" 
                  value={editedPlayerName} 
                  onChange={(e) => setEditedPlayerName(e.target.value)} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full" disabled={savingPlayer || !editedPlayerName.trim()}>
                {savingPlayer ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Match Players Dialog */}
        <Dialog open={!!editingMatch} onOpenChange={(open) => !open && setEditingMatch(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ganti Pemain Pertandingan</DialogTitle>
              <DialogDescription>Ganti pemain untuk pertandingan ini jika ada yang berhalangan hadir.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditMatchPlayersSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tim 1 - Pemain 1</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={matchPlayer1}
                    onChange={(e) => setMatchPlayer1(e.target.value)}
                    required
                  >
                    <option value="" disabled>Pilih Pemain</option>
                    {players.map((p: any) => (
                      <option key={p.player.id} value={p.player.id}>{p.player.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Tim 1 - Pemain 2</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={matchPlayer2}
                    onChange={(e) => setMatchPlayer2(e.target.value)}
                    required
                  >
                    <option value="" disabled>Pilih Pemain</option>
                    {players.map((p: any) => (
                      <option key={p.player.id} value={p.player.id}>{p.player.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Tim 2 - Pemain 1</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={matchPlayer3}
                    onChange={(e) => setMatchPlayer3(e.target.value)}
                    required
                  >
                    <option value="" disabled>Pilih Pemain</option>
                    {players.map((p: any) => (
                      <option key={p.player.id} value={p.player.id}>{p.player.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Tim 2 - Pemain 2</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={matchPlayer4}
                    onChange={(e) => setMatchPlayer4(e.target.value)}
                    required
                  >
                    <option value="" disabled>Pilih Pemain</option>
                    {players.map((p: any) => (
                      <option key={p.player.id} value={p.player.id}>{p.player.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={savingMatchPlayers}>
                {savingMatchPlayers ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
