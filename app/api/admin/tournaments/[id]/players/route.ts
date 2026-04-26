import { NextRequest, NextResponse } from 'next/server';
import { addPlayersToTournament } from '@/lib/tournament-service';
import { cookies } from 'next/headers';

async function isAdmin(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  return !!token;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { playerIds } = await request.json();

    if (!playerIds || !Array.isArray(playerIds)) {
      return NextResponse.json({ error: 'Missing or invalid playerIds' }, { status: 400 });
    }

    await addPlayersToTournament(id, playerIds);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error adding players to tournament:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
