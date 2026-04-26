import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';
import { cookies } from 'next/headers';

async function isAdmin(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  return !!token;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [tRes, tpRes, mRes] = await Promise.all([
      supabaseServer.from('tournaments').select('*').eq('id', id).single(),
      supabaseServer.from('tournament_players').select('*, player:players(*)').eq('tournament_id', id),
      supabaseServer.from('matches').select('*, team1_player1:players!matches_team1_player1_id_fkey(*), team1_player2:players!matches_team1_player2_id_fkey(*), team2_player1:players!matches_team2_player1_id_fkey(*), team2_player2:players!matches_team2_player2_id_fkey(*)').eq('tournament_id', id).order('round_number', { ascending: false }).order('created_at', { ascending: false })
    ]);

    if (tRes.error) throw tRes.error;

    return NextResponse.json({
      tournament: tRes.data,
      players: tpRes.data || [],
      matches: mRes.data || []
    });
  } catch (error: any) {
    console.error('Error fetching tournament details:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await supabaseServer
      .from('tournaments')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating tournament:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
