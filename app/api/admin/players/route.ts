import { NextRequest, NextResponse } from 'next/server';
import { createPlayer, getPlayers } from '@/lib/tournament-service';
import { cookies } from 'next/headers';

async function isAdmin(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  return !!token;
}

export async function GET(request: NextRequest) {
  try {
    const players = await getPlayers();
    return NextResponse.json(players);
  } catch (error: any) {
    console.error('Error fetching players:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const player = await createPlayer(name);
    return NextResponse.json(player);
  } catch (error: any) {
    console.error('Error creating player:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
