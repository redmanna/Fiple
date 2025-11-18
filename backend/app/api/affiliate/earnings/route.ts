// GET /api/affiliate/earnings - Affiliate earnings dashboard
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAffiliateEarnings } from '@/lib/affiliate';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const earnings = await getAffiliateEarnings(session.user.id);

    return NextResponse.json(earnings);
  } catch (error: any) {
    console.error('Error fetching affiliate earnings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch earnings' },
      { status: 500 }
    );
  }
}
