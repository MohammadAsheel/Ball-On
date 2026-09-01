import { NextRequest, NextResponse } from 'next/server';

const BBS_API_KEY =
  process.env.BIGBALLSDATA_API_KEY ||
  process.env.NEXT_PUBLIC_BIGBALLSDATA_API_KEY ||
  'bbs_live_00000VmNNihAMTZrBtg9eeFAhmhOfglQbOiRePZHVs3yDk21';

const BASE_URL = 'https://api.bigballsdata.com/v1/matches';
const VALID_STATUSES = new Set(['scheduled', 'live', 'finished', 'postponed', 'cancelled']);

async function fetchLeagueMatches(
  league: string,
  status?: string,
  limit?: number,
  date?: string
): Promise<any[]> {
  const url = new URL(BASE_URL);
  url.searchParams.set('sport', 'football');
  url.searchParams.set('league', league.toLowerCase());

  if (status && VALID_STATUSES.has(status.toLowerCase())) {
    url.searchParams.set('status', status.toLowerCase());
  }
  if (limit !== undefined && limit > 0) {
    url.searchParams.set('limit', String(limit));
  }
  if (date) {
    url.searchParams.set('date', date);
  }

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'x-api-key': BBS_API_KEY,
        accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn(`BigBallSports fetch error for ${league}: HTTP ${res.status}`);
      return [];
    }

    const json = await res.json();
    return (json.data || []).map((m: any) => ({
      ...m,
      league: m?.league || league.toUpperCase(),
    }));
  } catch (err: any) {
    console.warn(`BigBallSports request failed for ${league}:`, err.message);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawLeague = searchParams.get('league')?.toLowerCase().trim();
  const league = rawLeague && rawLeague !== 'all' ? rawLeague : undefined;

  const rawStatus = searchParams.get('status')?.toLowerCase().trim();
  const status = rawStatus && VALID_STATUSES.has(rawStatus) ? rawStatus : undefined;

  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '36', 10)));
  const date = searchParams.get('date') || undefined;

  try {
    // If 'all' or no specific league is given, query the main football leagues in parallel
    if (!league) {
      const topLeagues = ['epl', 'laliga', 'seriea', 'bundesliga', 'ligue1', 'ucl'];
      const perLeagueLimit = Math.max(6, Math.floor(limit / topLeagues.length));

      const responses = await Promise.all(
        topLeagues.map((l) => fetchLeagueMatches(l, status, perLeagueLimit, date))
      );

      const allMatches = responses.flat();

      // Sort by kickoff time
      allMatches.sort(
        (a: any, b: any) =>
          new Date(a?.kickoff_utc || 0).getTime() - new Date(b?.kickoff_utc || 0).getTime()
      );

      return NextResponse.json({
        count: allMatches.length,
        filter: { league: 'all', status: status || 'all', limit, date },
        data: allMatches,
        meta: { source: 'api.bigballsdata.com', cached: false },
      });
    }

    // Specific league
    const matches = await fetchLeagueMatches(league, status, limit, date);

    return NextResponse.json({
      count: matches.length,
      filter: { league, status: status || 'all', limit, date },
      data: matches,
      meta: { source: 'api.bigballsdata.com', cached: false },
    });
  } catch (error: any) {
    console.error('BigBallSports route error:', error);
    return NextResponse.json(
      {
        count: 0,
        filter: { league: league || 'all', status: status || 'all', limit, date },
        data: [],
        error: error.message || 'Failed to fetch matches',
      },
      { status: 200 }
    );
  }
}
