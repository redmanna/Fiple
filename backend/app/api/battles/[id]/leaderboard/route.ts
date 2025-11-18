// GET /api/battles/[id]/leaderboard - Get real-time battle leaderboard
import { NextRequest, NextResponse } from 'next/server';
import { getBattleLeaderboard } from '@/lib/battles';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leaderboard = await getBattleLeaderboard(params.id);

    return NextResponse.json(leaderboard);
  } catch (error: any) {
    console.error('Error fetching battle leaderboard:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
