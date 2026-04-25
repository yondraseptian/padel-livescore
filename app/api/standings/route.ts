import { NextRequest, NextResponse } from 'next/server';
import { getStandings } from '@/lib/match-service';

export const revalidate = 120; // Revalidate every 2 minutes

export async function GET(request: NextRequest) {
  try {
    const standings = await getStandings();
    return NextResponse.json(standings);
  } catch (error) {
    console.error('Error fetching standings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch standings' },
      { status: 500 }
    );
  }
}
