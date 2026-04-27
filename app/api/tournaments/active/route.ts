import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(request: NextRequest) {
  try {
    const { data: tournaments, error } = await supabaseServer
      .from('tournaments')
      .select(`
        id, name, format, status,
        players:tournament_players (
          id, points, matches_played, matches_won, matches_lost, games_won, games_lost, group_name,
          player:players (id, name, avatar_url)
        ),
        matches:matches (
          id, round_number, status, winner_id,
          team1_player1:players!team1_player1_id (name),
          team1_player2:players!team1_player2_id (name),
          team2_player1:players!team2_player1_id (name),
          team2_player2:players!team2_player2_id (name)
        )
      `)
      .eq('status', 'ongoing')
      .in('format', ['americano', 'mexicano', 'team_americano', 'team_mexicano', 'knockout', 'group_stage'])
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Sort players by points for each tournament
    const sortedTournaments = (tournaments || []).map(t => {
      const sortedPlayers = [...(t.players || [])].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const diffB = (b.games_won || 0) - (b.games_lost || 0);
        const diffA = (a.games_won || 0) - (a.games_lost || 0);
        if (diffB !== diffA) return diffB - diffA;
        return (b.matches_won || 0) - (a.matches_won || 0);
      });
      return {
        ...t,
        players: sortedPlayers
      };
    });

    return NextResponse.json(sortedTournaments);
  } catch (error: any) {
    console.error('Error fetching active tournaments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
}
