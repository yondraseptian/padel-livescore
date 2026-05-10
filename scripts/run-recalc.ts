import { supabaseServer } from '../lib/db';
import { recalculateIndividualStandings, recalculateTeamStandings } from '../lib/match-service';

async function main() {
  console.log('Fetching all tournaments...');
  const { data: tournaments, error } = await supabaseServer.from('tournaments').select('id, format');
  
  if (error) {
    console.error('Error fetching tournaments:', error);
    return;
  }

  console.log(`Found ${tournaments.length} tournaments to recalculate.`);

  for (const t of tournaments) {
    console.log(`Recalculating tournament ${t.id} (format: ${t.format})...`);
    if (t.format === 'americano' || t.format === 'mexicano') {
      await recalculateIndividualStandings(t.id);
    } else {
      await recalculateTeamStandings(t.id);
    }
  }

  console.log('Recalculation complete!');
  process.exit(0);
}

main();
