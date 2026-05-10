import { NextRequest, NextResponse } from 'next/server';
import { createTournament, getTournaments } from '@/lib/tournament-service';
import { cookies } from 'next/headers';

async function isAdmin(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  return !!token;
}

export async function GET(request: NextRequest) {
  try {
    const tournaments = await getTournaments();
    return NextResponse.json(tournaments);
  } catch (error: any) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      name, 
      format,
      gameType,
      tournamentDate,
      numberOfCourts,
      scoringType,
      pointPerMatch,
      normalScoringRule,
      players,
      knockoutSetting,
      groups,
      genderCategory
    } = await request.json();

    if (!name || !format) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const tournament = await createTournament(
      name, 
      format,
      gameType,
      tournamentDate,
      numberOfCourts,
      scoringType,
      pointPerMatch,
      normalScoringRule,
      players,
      knockoutSetting,
      groups,
      genderCategory
    );
    return NextResponse.json(tournament);
  } catch (error: any) {
    console.error('Error creating tournament:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
