import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';
import { cookies } from 'next/headers';

async function isAdmin(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  return !!token;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};
    if (body.team1_player1_id !== undefined) updateData.team1_player1_id = body.team1_player1_id;
    if (body.team1_player2_id !== undefined) updateData.team1_player2_id = body.team1_player2_id;
    if (body.team2_player1_id !== undefined) updateData.team2_player1_id = body.team2_player1_id;
    if (body.team2_player2_id !== undefined) updateData.team2_player2_id = body.team2_player2_id;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No data to update' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('matches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating match players:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
