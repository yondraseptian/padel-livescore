import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';

export const revalidate = 120; // Revalidate every 2 minutes

export async function GET(request: NextRequest) {
  try {
    const { data: allTournamentPlayers, error } = await supabaseServer
      .from('tournament_players')
      .select(`
        points, matches_played, matches_won, matches_lost, games_won, games_lost,
        player:players (id, name, avatar_url)
      `);

    if (error) {
      throw error;
    }

    // Aggregate stats by player ID
    const playerStats: Record<string, any> = {};

    (allTournamentPlayers || []).forEach((tp: any) => {
      const playerId = tp.player?.id;
      if (!playerId) return;

      if (!playerStats[playerId]) {
        playerStats[playerId] = {
          id: playerId,
          name: tp.player.name,
          avatar_url: tp.player.avatar_url,
          total_points: 0,
          total_matches_played: 0,
          total_matches_won: 0,
          total_matches_lost: 0,
          total_games_won: 0,
          total_games_lost: 0,
          tournaments_played: 0,
        };
      }

      playerStats[playerId].total_points += tp.points || 0;
      playerStats[playerId].total_matches_played += tp.matches_played || 0;
      playerStats[playerId].total_matches_won += tp.matches_won || 0;
      playerStats[playerId].total_matches_lost += tp.matches_lost || 0;
      playerStats[playerId].total_games_won += tp.games_won || 0;
      playerStats[playerId].total_games_lost += tp.games_lost || 0;
      playerStats[playerId].tournaments_played += 1;
    });

    const globalStandings = Object.values(playerStats).sort((a: any, b: any) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      const diffB = (b.total_games_won || 0) - (b.total_games_lost || 0);
      const diffA = (a.total_games_won || 0) - (a.total_games_lost || 0);
      if (diffB !== diffA) return diffB - diffA;
      return b.total_matches_won - a.total_matches_won;
    });

    return NextResponse.json(globalStandings);
  } catch (error: any) {
    console.error('Error fetching global standings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global standings' },
      { status: 500 }
    );
  }
}
