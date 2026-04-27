'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Activity, Plus, Trophy, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useAdmin } from '@/hooks/use-admin';
import type { Tournament } from '@/lib/db';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminTournamentsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAdmin();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [gameType, setGameType] = useState('tournament'); // 'tournament' | 'mabar'
  const [format, setFormat] = useState('americano'); // 'americano' | 'team_americano' | 'mexicano' | 'team_mexicano' | 'knockout' | 'group_stage'
  const [tournamentDate, setTournamentDate] = useState('');
  const [numberOfCourts, setNumberOfCourts] = useState<number>(1);
  const [scoringType, setScoringType] = useState('normal'); // 'point' | 'normal'
  const [pointPerMatch, setPointPerMatch] = useState('32');
  const [normalScoringRule, setNormalScoringRule] = useState('first_to_4');
  const [players, setPlayers] = useState<string[]>(['', '', '', '']); // Start with 4 empty player slots
  const [knockoutSetting, setKnockoutSetting] = useState('8'); // default 8 teams
  const [groups, setGroups] = useState<{name: string, teams: string[]}[]>([
    { name: 'Group A', teams: ['', '', ''] },
    { name: 'Group B', teams: ['', '', ''] }
  ]);

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;

    fetchTournaments();
  }, [isAuthenticated, authLoading]);

  const fetchTournaments = async () => {
    try {
      const res = await fetch('/api/admin/tournaments');
      const data = await res.json();
      setTournaments(data);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
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

  const handleAddPlayerInput = () => {
    setPlayers([...players, '']);
  };

  const handleRemovePlayerInput = (index: number) => {
    const newPlayers = [...players];
    newPlayers.splice(index, 1);
    setPlayers(newPlayers);
  };

  const handlePlayerNameChange = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  };

  // Group Handlers
  const handleAddGroup = () => {
    const nextLetter = String.fromCharCode(65 + groups.length); // A, B, C...
    setGroups([...groups, { name: `Group ${nextLetter}`, teams: ['', '', ''] }]);
  };

  const handleRemoveGroup = (index: number) => {
    const newGroups = [...groups];
    newGroups.splice(index, 1);
    setGroups(newGroups);
  };

  const handleGroupNameChange = (index: number, value: string) => {
    const newGroups = [...groups];
    newGroups[index].name = value;
    setGroups(newGroups);
  };

  const handleAddTeamToGroup = (groupIndex: number) => {
    const newGroups = [...groups];
    newGroups[groupIndex].teams.push('');
    setGroups(newGroups);
  };

  const handleRemoveTeamFromGroup = (groupIndex: number, teamIndex: number) => {
    const newGroups = [...groups];
    newGroups[groupIndex].teams.splice(teamIndex, 1);
    setGroups(newGroups);
  };

  const handleGroupTeamNameChange = (groupIndex: number, teamIndex: number, value: string) => {
    const newGroups = [...groups];
    newGroups[groupIndex].teams[teamIndex] = value;
    setGroups(newGroups);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    // Filter out empty player names
    const validPlayers = players.filter(p => p.trim() !== '');

    try {
      const res = await fetch('/api/admin/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          gameType,
          format,
          knockoutSetting: format === 'knockout' ? parseInt(knockoutSetting) : null,
          groups: format === 'group_stage' ? groups.map(g => ({
            name: g.name,
            teams: g.teams.filter(t => t.trim() !== '')
          })).filter(g => g.teams.length >= 3) : null,
          tournamentDate,
          numberOfCourts,
          scoringType,
          pointPerMatch: scoringType === 'point' ? parseInt(pointPerMatch) : null,
          normalScoringRule: scoringType === 'normal' ? normalScoringRule : null,
          players: format === 'group_stage' ? [] : validPlayers
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create tournament');
      }

      // Reset form
      setName('');
      setPlayers(['', '', '', '']);
      setIsCreateOpen(false);
      await fetchTournaments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Activity className="w-6 h-6 text-primary shrink-0" />
            <span className="font-bold hidden sm:inline">Padel LiveScore</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/admin/dashboard" className="text-xs sm:text-sm font-medium hover:text-primary transition-colors">
              Matches
            </Link>
            <span className="text-xs sm:text-sm text-primary font-medium">Tournaments</span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 ml-2 sm:ml-4 px-2 sm:px-3">
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tournaments & Mabar</h1>
            <p className="text-muted-foreground">
              Manage your padel tournaments and matches
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Create Match / Tournament
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>New Event</DialogTitle>
                  <DialogDescription>Setup your tournament or mabar event details.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-6 pt-4">
                  {/* General Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gameType">Game Type</Label>
                      <select 
                        id="gameType"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={gameType}
                        onChange={(e) => setGameType(e.target.value)}
                        required
                      >
                        <option value="tournament">Tournament</option>
                        <option value="mabar">Mabar (Main Bareng)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Event Name</Label>
                      <Input 
                        id="name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="e.g. Sunday Mabar" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="format">Match Type</Label>
                      <select 
                        id="format"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                        required
                      >
                        <option value="americano">Americano</option>
                        <option value="team_americano">Team Americano</option>
                        <option value="mexicano">Mexicano</option>
                        <option value="team_mexicano">Team Mexicano</option>
                        <option value="knockout">Knockout</option>
                        <option value="group_stage">Group Stage</option>
                      </select>
                    </div>

                    {format === 'knockout' ? (
                      <div className="space-y-2">
                        <Label htmlFor="knockoutSetting">Knockout Setting</Label>
                        <select 
                          id="knockoutSetting"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={knockoutSetting}
                          onChange={(e) => setKnockoutSetting(e.target.value)}
                          required
                        >
                          <option value="4">4 Teams (Semi Final)</option>
                          <option value="8">8 Teams (Quarter Final)</option>
                          <option value="16">16 Teams</option>
                          <option value="32">32 Teams</option>
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="tournamentDate">Date</Label>
                        <Input 
                          id="tournamentDate" 
                          type="date"
                          value={tournamentDate} 
                          onChange={(e) => setTournamentDate(e.target.value)} 
                          required 
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="numberOfCourts">Number of Courts</Label>
                      <Input 
                        id="numberOfCourts" 
                        type="number"
                        min={1}
                        value={numberOfCourts} 
                        onChange={(e) => setNumberOfCourts(parseInt(e.target.value) || 1)} 
                        required 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scoringType">Scoring Type</Label>
                      <select 
                        id="scoringType"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={scoringType}
                        onChange={(e) => setScoringType(e.target.value)}
                        required
                      >
                        <option value="normal">Normal Scoring</option>
                        <option value="point">Point Scoring</option>
                      </select>
                    </div>
                  </div>

                  {format === 'knockout' && (
                    <div className="space-y-2">
                      <Label htmlFor="tournamentDate">Date</Label>
                      <Input 
                        id="tournamentDate" 
                        type="date"
                        value={tournamentDate} 
                        onChange={(e) => setTournamentDate(e.target.value)} 
                        required 
                      />
                    </div>
                  )}

                  {scoringType === 'point' ? (
                    <div className="space-y-2">
                      <Label htmlFor="pointPerMatch">Point per match</Label>
                      <select 
                        id="pointPerMatch"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={pointPerMatch}
                        onChange={(e) => setPointPerMatch(e.target.value)}
                        required
                      >
                        <option value="16">16 Points</option>
                        <option value="21">21 Points</option>
                        <option value="24">24 Points</option>
                        <option value="32">32 Points</option>
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="normalScoringRule">Target Score</Label>
                      <select 
                        id="normalScoringRule"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={normalScoringRule}
                        onChange={(e) => setNormalScoringRule(e.target.value)}
                        required
                      >
                        <option value="first_to_3">First to 3</option>
                        <option value="first_to_4">First to 4</option>
                        <option value="first_to_5">First to 5</option>
                        <option value="first_to_6">First to 6</option>
                        <option value="first_to_7">First to 7</option>
                        <option value="total_of_3">Total of 3</option>
                        <option value="total_of_4">Total of 4</option>
                        <option value="total_of_5">Total of 5</option>
                        <option value="total_of_6">Total of 6</option>
                        <option value="total_of_7">Total of 7</option>
                      </select>
                    </div>
                  )}

                  <hr className="border-border" />
                  
                  {/* Participants Section */}
                  {format === 'group_stage' ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <Label className="text-base">Groups Configuration</Label>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddGroup}>
                          <Plus className="w-4 h-4 mr-2" /> Add Group
                        </Button>
                      </div>
                      <div className="space-y-6">
                        {groups.map((group, groupIndex) => (
                          <div key={groupIndex} className="p-4 border rounded-lg bg-muted/30 space-y-4">
                            <div className="flex items-center justify-between">
                              <Input 
                                className="font-bold w-48 h-8"
                                value={group.name}
                                onChange={(e) => handleGroupNameChange(groupIndex, e.target.value)}
                                placeholder={`Group ${groupIndex + 1}`}
                              />
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="text-destructive h-8 px-2"
                                onClick={() => handleRemoveGroup(groupIndex)}
                              >
                                <X className="w-4 h-4 mr-1" /> Remove Group
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {group.teams.map((teamName, teamIndex) => (
                                <div key={teamIndex} className="flex items-center gap-2">
                                  <Input 
                                    value={teamName} 
                                    onChange={(e) => handleGroupTeamNameChange(groupIndex, teamIndex, e.target.value)} 
                                    placeholder={`Team ${teamIndex + 1}`} 
                                  />
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-10 w-10 text-muted-foreground hover:text-destructive shrink-0"
                                    onClick={() => handleRemoveTeamFromGroup(groupIndex, teamIndex)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button 
                                type="button" 
                                variant="ghost" 
                                className="border border-dashed h-10 gap-2 text-muted-foreground hover:text-primary"
                                onClick={() => handleAddTeamToGroup(groupIndex)}
                              >
                                <Plus className="w-4 h-4" /> Add Team
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-base">
                          {format === 'knockout' ? 'Teams' : 'Players'} ({players.filter(p => p.trim() !== '').length})
                        </Label>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddPlayerInput}>
                          <Plus className="w-4 h-4 mr-2" /> Add {format === 'knockout' ? 'Team' : 'Player'} Slot
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {players.map((playerName, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input 
                              value={playerName} 
                              onChange={(e) => handlePlayerNameChange(index, e.target.value)} 
                              placeholder={`${format === 'knockout' ? 'Team' : 'Player'} ${index + 1}`} 
                            />
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => handleRemovePlayerInput(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={creating || !name}>
                    {creating ? 'Creating...' : 'Create Event'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {tournaments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No tournaments or mabar created yet
                </p>
                <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
                  Create First Event
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <Link key={tournament.id} href={`/admin/tournaments/${tournament.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <CardTitle className="text-xl line-clamp-1">{tournament.name}</CardTitle>
                        <CardDescription className="capitalize">
                          {tournament.format?.replace('_', ' ')}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tournament.status === 'draft' ? 'bg-secondary text-secondary-foreground' :
                        tournament.status === 'ongoing' ? 'bg-primary/20 text-primary' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {tournament.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(tournament.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
