import { NextRequest, NextResponse } from 'next/server';
import { createTeam, getTeams } from '@/lib/admin-service';
import { cookies } from 'next/headers';

// Middleware to check admin authentication
async function isAdmin(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  return !!token;
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teams = await getTeams();
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, logoUrl } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    const team = await createTeam(name.trim(), logoUrl?.trim());
    return NextResponse.json(team);
  } catch (error: any) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('already exists') ? 409 : 500 }
    );
  }
}
