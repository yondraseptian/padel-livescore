'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScoreInput } from '@/components/score-input';
import { AlertCircle, LogOut, Activity, Plus } from 'lucide-react';
import Link from 'next/link';
import { useAdmin } from '@/hooks/use-admin';
import type { Match, Team } from '@/lib/db';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAdmin();
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Modal states
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isCreateMatchOpen, setIsCreateMatchOpen] = useState(false);
  
  // Create Team form state
  const [teamName, setTeamName] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [teamError, setTeamError] = useState('');

  // Create Match form state
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [matchError, setMatchError] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      return;
    }

    // Fetch matches and teams
    const fetchData = async () => {
      try {
        const [matchesRes, teamsRes] = await Promise.all([
          fetch('/api/matches'),
          fetch('/api/admin/teams')
        ]);
        
        const matchesData = await matchesRes.json();
        const teamsData = await teamsRes.json();
        
        setMatches(matchesData);
        setTeams(teamsData);

        if (matchesData.length > 0) {
          setSelectedMatch(matchesData[0]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, authLoading]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleRefreshMatches = async () => {
    try {
      const res = await fetch('/api/matches');
      const data = await res.json();
      setMatches(data);
    } catch (error) {
      console.error('Error refreshing matches:', error);
    }
  };

  const handleRefreshTeams = async () => {
    try {
      const res = await fetch('/api/admin/teams');
      const data = await res.json();
      setTeams(data);
    } catch (error) {
      console.error('Error refreshing teams:', error);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTeam(true);
    setTeamError('');

    try {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName, logoUrl: teamLogo }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create team');
      }

      setTeamName('');
      setTeamLogo('');
      setIsCreateTeamOpen(false);
      await handleRefreshTeams();
    } catch (err: any) {
      setTeamError(err.message);
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingMatch(true);
    setMatchError('');

    if (team1Id === team2Id) {
      setMatchError('Team 1 and Team 2 must be different');
      setCreatingMatch(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team1Id, team2Id, scheduledAt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create match');
      }

      setTeam1Id('');
      setTeam2Id('');
      setScheduledAt('');
      setIsCreateMatchOpen(false);
      await handleRefreshMatches();
    } catch (err: any) {
      setMatchError(err.message);
    } finally {
      setCreatingMatch(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via middleware
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Activity className="w-6 h-6 text-primary" />
            <span className="font-bold">Padel LiveScore</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Referee Dashboard</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Match Score Management</h1>
            <p className="text-muted-foreground">
              Select a match and enter the scores
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" /> Add Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                  <DialogDescription>Add a new team to the database. Team names must be unique.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTeam} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamName">Team Name</Label>
                    <Input 
                      id="teamName" 
                      value={teamName} 
                      onChange={(e) => setTeamName(e.target.value)} 
                      placeholder="Enter team name" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teamLogo">Logo URL (Optional)</Label>
                    <Input 
                      id="teamLogo" 
                      value={teamLogo} 
                      onChange={(e) => setTeamLogo(e.target.value)} 
                      placeholder="https://example.com/logo.png" 
                    />
                  </div>
                  {teamError && <p className="text-sm text-red-500">{teamError}</p>}
                  <Button type="submit" className="w-full" disabled={creatingTeam || !teamName}>
                    {creatingTeam ? 'Creating...' : 'Create Team'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateMatchOpen} onOpenChange={setIsCreateMatchOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Create Match
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule New Match</DialogTitle>
                  <DialogDescription>Create a new match between two existing teams.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateMatch} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Team 1</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={team1Id}
                      onChange={(e) => setTeam1Id(e.target.value)}
                      required
                    >
                      <option value="">Select Team 1</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Team 2</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={team2Id}
                      onChange={(e) => setTeam2Id(e.target.value)}
                      required
                    >
                      <option value="">Select Team 2</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduledAt">Scheduled Time</Label>
                    <Input 
                      id="scheduledAt" 
                      type="datetime-local" 
                      value={scheduledAt} 
                      onChange={(e) => setScheduledAt(e.target.value)} 
                      required 
                    />
                  </div>
                  {matchError && <p className="text-sm text-red-500">{matchError}</p>}
                  <Button type="submit" className="w-full" disabled={creatingMatch || !team1Id || !team2Id || !scheduledAt}>
                    {creatingMatch ? 'Scheduling...' : 'Schedule Match'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {matches.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No matches available
                </p>
                <Button
                  variant="outline"
                  onClick={handleRefreshMatches}
                >
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Match Selection */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Matches</CardTitle>
                  <CardDescription>
                    {matches.length} match{matches.length !== 1 ? 'es' : ''} available
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {matches.map((match) => (
                    <button
                      key={match.id}
                      onClick={() => setSelectedMatch(match)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedMatch?.id === match.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      <div className="text-sm font-medium mb-1 text-balance">
                        {match.team1?.name || 'Team 1'} vs{' '}
                        {match.team2?.name || 'Team 2'}
                      </div>
                      <div className="text-xs opacity-75">
                        {new Date(match.scheduled_at).toLocaleString('id-ID')}
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Score Input */}
            <div className="lg:col-span-3">
              {selectedMatch ? (
                <ScoreInput
                  match={selectedMatch}
                  onScoreUpdate={handleRefreshMatches}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center py-8">
                      Select a match to start entering scores
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
