import { NextRequest, NextResponse } from 'next/server';
import { getUpcomingMatches } from '@/lib/match-service';

export const revalidate = 60; // Revalidate every 60 seconds for SSR

export async function GET(request: NextRequest) {
  try {
    const matches = await getUpcomingMatches(10);
    return NextResponse.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}
