import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MatchCard } from '@/components/match-card';
import { Standings } from '@/components/standings';
import { getUpcomingMatches } from '@/lib/match-service';
import { Activity } from 'lucide-react';

export const revalidate = 60; // Revalidate every 60 seconds

export const metadata: Metadata = {
  title: 'Padel LiveScore - Real-time Match Updates',
  description: 'Watch live padel match scores, check standings, and upcoming matches. Real-time score updates for padel tennis tournaments.',
};

async function getMatchesData() {
  try {
    const matches = await getUpcomingMatches(10);
    return matches;
  } catch (error) {
    console.error('Error fetching matches:', error);
    return [];
  }
}

export default async function Home() {
  const matches = await getMatchesData();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Padel LiveScore</h1>
          </div>
          <nav className="flex gap-4">
            <Link href="/admin/login">
              <Button variant="outline" size="sm">
                Admin Panel
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4 text-balance">
              Live Padel Match Scores
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Watch real-time updates from ongoing matches and check the latest standings
            </p>
          </div>
        </section>

        {/* Live Matches Section */}
        <section className="mb-16">
          <div className="mb-8">
            <h3 className="text-2xl font-bold">Upcoming & Live Matches</h3>
            <p className="text-muted-foreground mt-2">
              {matches.length > 0
                ? `${matches.length} match${matches.length !== 1 ? 'es' : ''} scheduled`
                : 'No matches scheduled'}
            </p>
          </div>

          {matches.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No matches available at the moment</p>
              <p className="text-sm text-muted-foreground">Check back soon!</p>
            </div>
          )}
        </section>

        {/* Standings Section */}
        <section className="mb-16">
          <div className="mb-8">
            <h3 className="text-2xl font-bold">Tournament Standings</h3>
          </div>
          <Standings />
        </section>

        {/* Footer Info */}
        <section className="border-t border-border pt-12 text-center text-muted-foreground">
          <p className="mb-4">Padel LiveScore - Real-time tournament updates and standings</p>
          <p className="text-sm">
            Last updated:{' '}
            <span className="font-mono">
              {new Date().toLocaleTimeString('id-ID')}
            </span>
          </p>
        </section>
      </main>
    </div>
  );
}
