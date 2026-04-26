import { NextRequest, NextResponse } from 'next/server';
import { updateMatchScore, getMatchScores, calculateMatchState, updateMatchStatus, resetMatchScores } from '@/lib/match-service';
import { cookies } from 'next/headers';
import { supabaseServer } from '@/lib/db';

// Middleware to check admin authentication
async function isAdmin(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  return !!token;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { matchId, setNumber, gameNumber, team1Points, team2Points } = body;

    if (!matchId || !setNumber || gameNumber === undefined || team1Points === undefined || team2Points === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update the score
    const score = await updateMatchScore(matchId, setNumber, gameNumber, team1Points, team2Points);

    if (!score) {
      return NextResponse.json(
        { error: 'Failed to update score' },
        { status: 500 }
      );
    }

    // Get match to fetch tournament config
    const { data: match } = await supabaseServer.from('matches').select('*, tournament:tournament_id(scoring_type, point_per_match, normal_scoring_rule)').eq('id', matchId).single();
    const tournamentConfig = match?.tournament || undefined;

    // Get updated match state
    const scores = await getMatchScores(matchId);
    const matchState = calculateMatchState(scores, tournamentConfig);

    // If match is not yet marked as live, update status
    await updateMatchStatus(matchId, 'live');

    if (matchState.matchComplete && matchState.winner) {
      const { data: match } = await supabaseServer.from('matches').select('*').eq('id', matchId).single();
      
      if (match) {
        // Update match status to completed
        const winnerId = matchState.winner === 'team1' ? match.team1_id : matchState.winner === 'team2' ? match.team2_id : null;
        await updateMatchStatus(matchId, 'completed', winnerId || undefined);

        if (match.tournament_id && match.match_type === 'individual') {
          // Update individual standings for Americano/Mexicano
          const { updateTournamentPlayerStandings } = await import('@/lib/match-service');
          
          let t1Score = matchState.team1Sets;
          let t2Score = matchState.team2Sets;
          
          if (matchState.isPointScoring) {
            t1Score = matchState.currentGame.team1Points;
            t2Score = matchState.currentGame.team2Points;
          } else {
            // Calculate total games won for standard tie-breakers
            t1Score = matchState.allSets.reduce((sum, s) => sum + s.team1Games, 0);
            t2Score = matchState.allSets.reduce((sum, s) => sum + s.team2Games, 0);
          }

          await updateTournamentPlayerStandings(
            match.tournament_id,
            match.team1_player1_id,
            match.team1_player2_id,
            match.team2_player1_id,
            match.team2_player2_id,
            matchState.winner as any,
            t1Score,
            t2Score
          );
        } else {
          // Update team standings
          const { updateStandings } = await import('@/lib/match-service');
          await updateStandings(
            match.team1_id,
            match.team2_id,
            matchState.winner,
            matchState.team1Sets,
            matchState.team2Sets
          );
        }
      }
    }

    // TODO: Broadcast via Socket.io to connected clients
    // io.to(`match:${matchId}`).emit('score-updated', { matchId, ...matchState });

    return NextResponse.json({
      score,
      matchState,
    });
  } catch (error) {
    console.error('Error updating score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json(
        { error: 'matchId is required' },
        { status: 400 }
      );
    }

    const { data: match } = await supabaseServer.from('matches').select('*, tournament:tournament_id(scoring_type, point_per_match, normal_scoring_rule)').eq('id', matchId).single();
    const tournamentConfig = match?.tournament || undefined;

    const scores = await getMatchScores(matchId);
    const matchState = calculateMatchState(scores, tournamentConfig);

    return NextResponse.json({
      scores,
      matchState,
    });
  } catch (error) {
    console.error('Error fetching scores:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json(
        { error: 'matchId is required' },
        { status: 400 }
      );
    }

    const success = await resetMatchScores(matchId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to reset match' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting match:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
