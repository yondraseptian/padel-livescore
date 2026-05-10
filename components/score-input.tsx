'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Settings, Trophy, Edit2 } from 'lucide-react';
import type { Match } from '@/lib/db';

interface ScoreInputProps {
  match: Match;
  onScoreUpdate?: () => void;
}

interface MatchState {
  team1Sets: number;
  team2Sets: number;
  currentSet: {
    team1Games: number;
    team2Games: number;
    isTiebreaker?: boolean;
  };
  matchComplete: boolean;
  isPointScoring?: boolean;
  winner?: 'team1' | 'team2' | 'draw';
  currentGame: {
    team1Points: number;
    team2Points: number;
  };
}

function getTennisScoreDisplay(teamPoints: number, oppPoints: number, isTiebreaker: boolean = false): string {
  if (isTiebreaker) {
    return teamPoints.toString();
  }
  
  if (teamPoints >= 3 && oppPoints >= 3) {
    if (teamPoints === oppPoints) return '40'; // Deuce
    if (teamPoints > oppPoints) return 'AD';
    return '40'; // Opponent has AD
  }

  const scoreMap = ['0', '15', '30', '40'];
  return scoreMap[teamPoints] || '40';
}

export function ScoreInput({ match, onScoreUpdate }: ScoreInputProps) {
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditingScore, setIsEditingScore] = useState(false);
  const [editT1Games, setEditT1Games] = useState(0);
  const [editT2Games, setEditT2Games] = useState(0);
  const [editT1Points, setEditT1Points] = useState(0);
  const [editT2Points, setEditT2Points] = useState(0);

  useEffect(() => {
    if (matchState) {
      setEditT1Games(matchState.currentSet.team1Games);
      setEditT2Games(matchState.currentSet.team2Games);
      setEditT1Points(matchState.currentGame.team1Points);
      setEditT2Points(matchState.currentGame.team2Points);
    }
  }, [matchState?.currentSet.team1Games, matchState?.currentSet.team2Games, matchState?.currentGame.team1Points, matchState?.currentGame.team2Points]);

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const res = await fetch(`/api/admin/score?matchId=${match.id}`);
        const data = await res.json();
        if (data.matchState) {
          setMatchState(data.matchState);
        } else {
          // Initialize new match
          setMatchState({
            team1Sets: 0,
            team2Sets: 0,
            currentSet: {
              team1Games: 0,
              team2Games: 0,
              isTiebreaker: false,
            },
            matchComplete: false,
            isPointScoring: false,
            currentGame: {
              team1Points: 0,
              team2Points: 0,
            }
          });
        }
      } catch (err) {
        setError('Failed to load match scores');
      } finally {
        setLoading(false);
      }
    };

    fetchScore();
  }, [match.id]);

  const updateScore = async (team1Points: number, team2Points: number) => {
    if (!matchState) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          setNumber: matchState.team1Sets + matchState.team2Sets + 1,
          gameNumber: matchState.currentSet.team1Games + matchState.currentSet.team2Games + 1,
          team1Points: team1Points,
          team2Points: team2Points,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update score');
        return;
      }

      if (data.matchState) {
        setMatchState(data.matchState);
        setSuccess('Score updated successfully');
        setTimeout(() => setSuccess(''), 3000);
        onScoreUpdate?.();
      }
    } catch (err) {
      setError('Error updating score');
    } finally {
      setSaving(false);
    }
  };

  const directWin = async (winner: 'team1' | 'team2') => {
    if (!matchState || !confirm(`Mark ${winner === 'team1' ? 'Team 1' : 'Team 2'} as direct winner?`)) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/score/direct-win', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id, winner }),
      });
      const data = await res.json();
      if (data.matchState) {
        setMatchState(data.matchState);
        setSuccess('Match completed successfully');
        onScoreUpdate?.();
      }
    } catch (err) {
      setError('Failed to process direct win');
    } finally {
      setSaving(false);
    }
  };

  const handleManualScoreUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/score/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          team1Sets: matchState?.team1Sets || 0,
          team2Sets: matchState?.team2Sets || 0,
          team1Games: editT1Games,
          team2Games: editT2Games,
          team1Points: editT1Points,
          team2Points: editT2Points,
        }),
      });
      const data = await res.json();
      if (data.matchState) {
        setMatchState(data.matchState);
        setIsEditingScore(false);
        setSuccess('Scores updated manually');
        onScoreUpdate?.();
      }
    } catch (err) {
      setError('Failed to update scores manually');
    } finally {
      setSaving(false);
    }
  };

  const resetMatch = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/admin/score?matchId=${match.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset match');
        return;
      }

      // Re-initialize state
      setMatchState({
        team1Sets: 0,
        team2Sets: 0,
        currentSet: {
          team1Games: 0,
          team2Games: 0,
          isTiebreaker: false,
        },
        matchComplete: false,
        currentGame: {
          team1Points: 0,
          team2Points: 0,
        }
      });
      setSuccess('Match reset successfully');
      setTimeout(() => setSuccess(''), 3000);
      onScoreUpdate?.();
    } catch (err) {
      setError('Error resetting match');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading match scores...</p>;
  }

  if (!matchState) {
    return <p className="text-muted-foreground">Unable to load match scores</p>;
  }

  const currentSetNum = matchState.team1Sets + matchState.team2Sets + 1;
  const currentGameNum = matchState.currentSet.team1Games + matchState.currentSet.team2Games + 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {match.match_type === 'individual' ? (
              <>
                {match.team1_player1?.name}{match.team1_player2?.name ? ` - ${match.team1_player2.name}` : ''}
                <span className="mx-2 text-muted-foreground font-normal">vs</span>
                {match.team2_player1?.name}{match.team2_player2?.name ? ` - ${match.team2_player2.name}` : ''}
              </>
            ) : (
              `${match.team1?.name} vs ${match.team2?.name}`
            )}
          </CardTitle>
          {match.tournament_id && (
            <Button variant="ghost" size="sm" asChild>
              <a href={`/admin/tournaments/${match.tournament_id}`}>
                <Settings className="w-4 h-4 mr-2" />
                Manage
              </a>
            </Button>
          )}
        </div>
        {!matchState.matchComplete && (
          <CardDescription>
            {matchState.isPointScoring ? 'Point Scoring' : `Current Sets: ${currentGameNum}`}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Sets Display (only if not point scoring) */}
        {!matchState.isPointScoring && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Sets Won</p>
              <p className="text-3xl font-bold">{matchState.currentSet.team1Games}</p>
              <p className="text-sm text-muted-foreground">
                {match.match_type === 'individual' 
                  ? `${match.team1_player1?.name}${match.team1_player2?.name ? ` - ${match.team1_player2.name}` : ''}` 
                  : match.team1?.name}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Sets Won</p>
              <p className="text-3xl font-bold">{matchState.currentSet.team2Games}</p>
              <p className="text-sm text-muted-foreground">
                {match.match_type === 'individual' 
                  ? `${match.team2_player1?.name}${match.team2_player2?.name ? ` - ${match.team2_player2.name}` : ''}` 
                  : match.team2?.name}
              </p>
            </div>
          </div>
        )}

        {/* Current Game Score Input */}
        <div className="border-t border-border pt-6">
          <p className="text-sm font-medium mb-4">Current Game Score</p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground mb-2">
                {match.match_type === 'individual' 
                  ? `${match.team1_player1?.name}${match.team1_player2?.name ? ` - ${match.team1_player2.name}` : ''}` 
                  : match.team1?.name}
              </p>
              <div className="flex flex-col items-center gap-2">
                <Button 
                  size="lg" 
                  className="w-full h-24 text-4xl font-bold rounded-2xl"
                  onClick={() => updateScore(matchState.currentGame.team1Points + 1, matchState.currentGame.team2Points)}
                  disabled={saving || matchState.matchComplete}
                >
                  {matchState.isPointScoring 
                    ? matchState.currentGame.team1Points 
                    : getTennisScoreDisplay(matchState.currentGame.team1Points, matchState.currentGame.team2Points, matchState.currentSet.isTiebreaker)}
                </Button>
                {!matchState.matchComplete && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-[10px] uppercase tracking-wider"
                    onClick={() => directWin('team1')}
                    disabled={saving}
                  >
                    <Trophy className="w-3 h-3 mr-1" /> Direct Win
                  </Button>
                )}
              </div>
            </div>
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground mb-2">
                {match.match_type === 'individual' 
                  ? `${match.team2_player1?.name}${match.team2_player2?.name ? ` - ${match.team2_player2.name}` : ''}` 
                  : match.team2?.name}
              </p>
              <div className="flex flex-col items-center gap-2">
                <Button 
                  size="lg" 
                  className="w-full h-24 text-4xl font-bold rounded-2xl"
                  onClick={() => updateScore(matchState.currentGame.team1Points, matchState.currentGame.team2Points + 1)}
                  disabled={saving || matchState.matchComplete}
                >
                  {matchState.isPointScoring 
                    ? matchState.currentGame.team2Points 
                    : getTennisScoreDisplay(matchState.currentGame.team2Points, matchState.currentGame.team1Points, matchState.currentSet.isTiebreaker)}
                </Button>
                {!matchState.matchComplete && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-[10px] uppercase tracking-wider"
                    onClick={() => directWin('team2')}
                    disabled={saving}
                  >
                    <Trophy className="w-3 h-3 mr-1" /> Direct Win
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Match Status */}
        {matchState.matchComplete && (
          <div className="border-t border-border pt-6">
            <Alert className="bg-primary/10 border-primary">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription className="font-medium text-lg">
                Match completed!{' '}
                {matchState.winner === 'draw' ? (
                  `It's a draw! ${matchState.isPointScoring 
                    ? `(${matchState.currentGame.team1Points} - ${matchState.currentGame.team2Points})` 
                    : `(${matchState.allSets[0]?.team1Games || 0} - ${matchState.allSets[0]?.team2Games || 0})`}`
                ) : (
                  <>
                    {(matchState.winner === 'team1' || (matchState.team1Sets > matchState.team2Sets))
                      ? (match.match_type === 'individual' 
                          ? `${match.team1_player1?.name}${match.team1_player2?.name ? ` & ${match.team1_player2.name}` : ''}` 
                          : match.team1?.name)
                      : (match.match_type === 'individual' 
                          ? `${match.team2_player1?.name}${match.team2_player2?.name ? ` & ${match.team2_player2.name}` : ''}` 
                          : match.team2?.name)}{' '}
                    wins! Score: {' '}
                    {matchState.isPointScoring 
                      ? `${matchState.currentGame.team1Points} - ${matchState.currentGame.team2Points}`
                      : (matchState.allSets.length === 1 
                          ? `${matchState.allSets[0].team1Games} - ${matchState.allSets[0].team2Games}` 
                          : `${matchState.team1Sets} - ${matchState.team2Sets}`)}
                  </>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Reset/Edit Section */}
        <div className="flex gap-2 pt-4 border-t border-border">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={resetMatch}
            disabled={saving}
          >
            Reset Match
          </Button>
          {!matchState.matchComplete && (
            <Button 
              variant="secondary" 
              className="flex-1" 
              onClick={() => setIsEditingScore(!isEditingScore)}
              disabled={saving}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Game Count
            </Button>
          )}
        </div>

        {isEditingScore && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
            <h3 className="font-bold text-sm">Manual Score Override</h3>
            <div className="grid grid-cols-2 gap-4">
              {!matchState.isPointScoring && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs">Team 1 Games</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded" 
                      value={editT1Games} 
                      onChange={e => setEditT1Games(parseInt(e.target.value) || 0)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs">Team 2 Games</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded" 
                      value={editT2Games} 
                      onChange={e => setEditT2Games(parseInt(e.target.value) || 0)} 
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <label className="text-xs">Team 1 Points</label>
                {matchState.isPointScoring || matchState.currentSet.isTiebreaker ? (
                  <input 
                    type="number" 
                    className="w-full p-2 border rounded" 
                    value={editT1Points} 
                    onChange={e => setEditT1Points(parseInt(e.target.value) || 0)} 
                  />
                ) : (
                  <select 
                    className="w-full p-2 border rounded"
                    value={editT1Points}
                    onChange={e => setEditT1Points(parseInt(e.target.value))}
                  >
                    <option value={0}>0</option>
                    <option value={1}>15</option>
                    <option value={2}>30</option>
                    <option value={3}>40</option>
                    <option value={4}>AD</option>
                  </select>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs">Team 2 Points</label>
                {matchState.isPointScoring || matchState.currentSet.isTiebreaker ? (
                  <input 
                    type="number" 
                    className="w-full p-2 border rounded" 
                    value={editT2Points} 
                    onChange={e => setEditT2Points(parseInt(e.target.value) || 0)} 
                  />
                ) : (
                  <select 
                    className="w-full p-2 border rounded"
                    value={editT2Points}
                    onChange={e => setEditT2Points(parseInt(e.target.value))}
                  >
                    <option value={0}>0</option>
                    <option value={1}>15</option>
                    <option value={2}>30</option>
                    <option value={3}>40</option>
                    <option value={4}>AD</option>
                  </select>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={handleManualScoreUpdate} disabled={saving}>Save Manual</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditingScore(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
