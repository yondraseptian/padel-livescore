'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';

interface StandingsData {
  team: {
    name: string;
    logo_url?: string;
  };
  matches_won: number;
  matches_lost: number;
  matches_played: number;
  sets_won: number;
  sets_lost: number;
}

export function Standings() {
  const [standings, setStandings] = useState<StandingsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const res = await fetch('/api/standings');
        const data = await res.json();
        setStandings(data);
      } catch (error) {
        console.error('Error fetching standings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
    // Refresh every 2 minutes
    const interval = setInterval(fetchStandings, 120000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Standings</CardTitle>
        <CardDescription>Team rankings and statistics</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading standings...</p>
        ) : standings.length === 0 ? (
          <p className="text-muted-foreground">No standings available</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Played</TableHead>
                <TableHead className="text-right">Won</TableHead>
                <TableHead className="text-right">Lost</TableHead>
                <TableHead className="text-right">Sets W-L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((standing, index) => (
                <TableRow key={standing.team.name}>
                  <TableCell className="font-bold text-primary">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {standing.team.logo_url && (
                        <img
                          src={standing.team.logo_url}
                          alt={standing.team.name}
                          className="w-6 h-6 rounded object-cover"
                        />
                      )}
                      <span className="font-medium">{standing.team.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {standing.matches_played}
                  </TableCell>
                  <TableCell className="text-right text-green-600 font-semibold">
                    {standing.matches_won}
                  </TableCell>
                  <TableCell className="text-right text-red-600 font-semibold">
                    {standing.matches_lost}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {standing.sets_won}-{standing.sets_lost}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
