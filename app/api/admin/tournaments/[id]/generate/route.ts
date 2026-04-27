import { NextRequest, NextResponse } from 'next/server';
import { 
  generateAmericanoRound,
  generateMexicanoRound, 
  generateTeamAmericanoRound, 
  generateTeamMexicanoRound,
  generateKnockoutRound,
  generateGroupStageRound,
  startTournament 
} from '@/lib/tournament-service';
import { supabaseServer } from '@/lib/db';
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

    const { roundNumber, scheduledAt } = await request.json();

    if (!roundNumber) {
      return NextResponse.json({ error: 'Missing roundNumber' }, { status: 400 });
    }

    // Get tournament format
    const { data: tournament, error: tError } = await supabaseServer
      .from('tournaments')
      .select('format, status')
      .eq('id', id)
      .single();

    if (tError) throw new Error(`Failed to fetch tournament: ${tError.message}`);

    if (tournament.status === 'draft') {
      await startTournament(id);
    }

    let matches;
    if (tournament.format === 'americano') {
      matches = await generateAmericanoRound(id, roundNumber, scheduledAt);
    } else if (tournament.format === 'team_americano') {
      matches = await generateTeamAmericanoRound(id, roundNumber, scheduledAt);
    } else if (tournament.format === 'mexicano') {
      matches = await generateMexicanoRound(id, roundNumber, scheduledAt);
    } else if (tournament.format === 'team_mexicano') {
      matches = await generateTeamMexicanoRound(id, roundNumber, scheduledAt);
    } else if (tournament.format === 'knockout') {
      matches = await generateKnockoutRound(id, roundNumber, scheduledAt);
    } else if (tournament.format === 'group_stage') {
      matches = await generateGroupStageRound(id, roundNumber, scheduledAt);
    } else {
      return NextResponse.json({ error: 'Generation not supported for this format yet' }, { status: 400 });
    }

    return NextResponse.json(matches);
  } catch (error: any) {
    console.error('Error generating round:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
