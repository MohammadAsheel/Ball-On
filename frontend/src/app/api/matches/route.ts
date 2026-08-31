import { NextRequest, NextResponse } from 'next/server';
import { BigBallSportsClient } from '@bigballsdata/sdk';

const apiKey =
  process.env.BIGBALLSDATA_API_KEY ||
  process.env.NEXT_PUBLIC_BIGBALLSDATA_API_KEY ||
  'bbs_live_00000VmNNihAMTZrBtg9eeFAhmhOfglQbOiRePZHVs3yDk21';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get('league') || undefined;
  const status = (searchParams.get('status') as any) || undefined;
  const limit = parseInt(searchParams.get('limit') || '30', 10);
  const date = searchParams.get('date') || undefined;

  try {
    const client = new BigBallSportsClient(apiKey);

    // If 'all' or no specific league is given, query the main football leagues
    if (!league || league === 'all') {
      const topLeagues = ['epl', 'laliga', 'seriea', 'bundesliga', 'ligue1', 'ucl'];
      const responses = await Promise.all(
        topLeagues.map((l) =>
          client.matches
            .list({
              sport: 'football',
              league: l,
              status: status,
              date: date,
              limit: Math.max(5, Math.floor(limit / topLeagues.length)),
            })
            .then((res) =>
              (res.data || []).map((m: any) => ({
                ...m,
                league: m?.league || l.toUpperCase(),
              }))
            )
            .catch(() => [])
        )
      );

      const allMatches: any[] = responses.flat();
      // Sort by kickoff time descending/ascending
      allMatches.sort(
        (a: any, b: any) =>
          new Date(a?.kickoff_utc || 0).getTime() - new Date(b?.kickoff_utc || 0).getTime()
      );

      return NextResponse.json({
        count: allMatches.length,
        filter: { league: 'all', status, limit, date },
        data: allMatches,
      });
    }

    // Specific league
    const res = await client.matches.list({
      sport: 'football',
      league: league.toLowerCase(),
      status: status,
      date: date,
      limit: limit,
    });

    const normalizedMatches = (res.data || []).map((m: any) => ({
      ...m,
      league: m?.league || league.toUpperCase(),
    }));

    return NextResponse.json({
      count: normalizedMatches.length,
      filter: { league, status, limit, date },
      data: normalizedMatches,
      meta: res.meta,
    });
  } catch (error: any) {
    console.error('BigBallSports API Error:', error);
    return NextResponse.json(
      {
        count: 0,
        error: error.message || 'Failed to fetch matches from BigBallSports',
        data: [],
      },
      { status: 500 }
    );
  }
}
