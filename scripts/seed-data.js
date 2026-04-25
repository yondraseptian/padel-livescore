import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedData() {
  try {
    console.log('Starting data seeding...');

    // Check if teams exist
    const { count: teamCount } = await supabase
      .from('teams')
      .select('*', { count: 'exact' });

    if ((teamCount || 0) > 0) {
      console.log('Teams already exist, skipping seed data');
      process.exit(0);
    }

    // Insert teams
    console.log('Creating teams...');
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .insert([
        { name: 'Team A', logo_url: 'https://via.placeholder.com/100?text=Team+A' },
        { name: 'Team B', logo_url: 'https://via.placeholder.com/100?text=Team+B' },
        { name: 'Team C', logo_url: 'https://via.placeholder.com/100?text=Team+C' },
        { name: 'Team D', logo_url: 'https://via.placeholder.com/100?text=Team+D' },
      ])
      .select();

    if (teamsError) {
      console.error('Error inserting teams:', teamsError);
      process.exit(1);
    }

    console.log(`✓ Created ${teams.length} teams`);

    // Create standings for each team
    console.log('Creating standings...');
    const { error: standingsError } = await supabase
      .from('standings')
      .insert(
        teams.map((team) => ({
          team_id: team.id,
          matches_played: 0,
          matches_won: 0,
          matches_lost: 0,
          games_won: 0,
          games_lost: 0,
          sets_won: 0,
          sets_lost: 0,
        }))
      );

    if (standingsError) {
      console.error('Error creating standings:', standingsError);
      process.exit(1);
    }

    console.log('✓ Created standings for all teams');

    // Create sample matches
    console.log('Creating sample matches...');
    const now = new Date();
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .insert([
        {
          team1_id: teams[0].id,
          team2_id: teams[1].id,
          scheduled_at: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          status: 'scheduled',
        },
        {
          team1_id: teams[2].id,
          team2_id: teams[3].id,
          scheduled_at: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
          status: 'scheduled',
        },
        {
          team1_id: teams[0].id,
          team2_id: teams[2].id,
          scheduled_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
          status: 'live',
        },
      ])
      .select();

    if (matchesError) {
      console.error('Error creating matches:', matchesError);
      process.exit(1);
    }

    console.log(`✓ Created ${matches.length} sample matches`);

    console.log('\n✓ Seed data created successfully!');
    console.log('\nTeams created:');
    teams.forEach((team, i) => {
      console.log(`  ${i + 1}. ${team.name}`);
    });

    console.log('\nMatches created:');
    matches.forEach((match, i) => {
      const team1 = teams.find((t) => t.id === match.team1_id);
      const team2 = teams.find((t) => t.id === match.team2_id);
      console.log(
        `  ${i + 1}. ${team1?.name} vs ${team2?.name} (${match.status})`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedData();
