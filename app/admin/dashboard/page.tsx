'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScoreInput } from '@/components/score-input';
import { AlertCircle, LogOut, Activity } from 'lucide-react';
import Link from 'next/link';
import { useAdmin } from '@/hooks/use-admin';
import type { Match } from '@/lib/db';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAdmin();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      return;
    }

    // Fetch matches
    const fetchMatches = async () => {
      try {
        const matchesRes = await fetch('/api/matches');
        const matchesData = await matchesRes.json();
        setMatches(matchesData);

        if (matchesData.length > 0) {
          setSelectedMatch(matchesData[0]);
        }
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Match Score Management</h1>
          <p className="text-muted-foreground">
            Select a match and enter the scores
          </p>
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
