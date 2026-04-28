import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';
import { cookies } from 'next/headers';
import { calculateMatchState, getMatchScores } from '@/lib/match-service';

async function isAdmin(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  return !!token;
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { matchId, team1Games, team2Games, team1Points, team2Points } = await request.json();
    
    // Manual override: we insert a record into match_scores that "represents" the current state
    // Note: This is a bit simplified. In a real app, we might want to clear old scores or add an "override" flag.
    // For now, we'll just insert/update the first game of the current set.
    
    const { data: match } = await supabaseServer
      .from('matches')
      .select('*, tournament:tournament_id(*)')
      .eq('id', matchId)
      .single();

    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

    // Insert a "Summary" score or update the latest one
    // Here we'll just insert a score for Set 1, Game 1 as a placeholder if it's the only way to store it
    // Better: use the current set number
    const setNumber = 1; 
    const gameNumber = 1;

    const { error: upsertError } = await supabaseServer
      .from('match_scores')
      .upsert({
        match_id: matchId,
        set_number: setNumber,
        game_number: gameNumber,
        team1_points: team1Points || team1Games, // Fallback logic
        team2_points: team2Points || team2Games,
        updated_at: new Date().toISOString()
      }, { onConflict: 'match_id, set_number, game_number' });

    if (upsertError) throw upsertError;

    const scores = await getMatchScores(matchId);
    const matchState = calculateMatchState(scores, match.tournament);

    return NextResponse.json({ matchState });
  } catch (error: any) {
    console.error('Manual score update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
