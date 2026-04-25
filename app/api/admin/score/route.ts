import { NextRequest, NextResponse } from 'next/server';
import { updateMatchScore, getMatchScores, calculateMatchState, updateMatchStatus, resetMatchScores } from '@/lib/match-service';
import { cookies } from 'next/headers';

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

    // Get updated match state
    const scores = await getMatchScores(matchId);
    const matchState = calculateMatchState(scores);

    // If match is not yet marked as live, update status
    await updateMatchStatus(matchId, 'live');

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

    const scores = await getMatchScores(matchId);
    const matchState = calculateMatchState(scores);

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
