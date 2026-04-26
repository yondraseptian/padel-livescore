import { NextRequest, NextResponse } from 'next/server';
import { createMatch } from '@/lib/admin-service';
import { cookies } from 'next/headers';

// Middleware to check admin authentication
async function isAdmin(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  return !!token;
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { team1Id, team2Id, scheduledAt } = body;

    if (!team1Id || !team2Id || !scheduledAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (team1Id === team2Id) {
      return NextResponse.json({ error: 'Team 1 and Team 2 must be different' }, { status: 400 });
    }

    const match = await createMatch(team1Id, team2Id, scheduledAt);
    return NextResponse.json(match);
  } catch (error: any) {
    console.error('Error creating match:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
