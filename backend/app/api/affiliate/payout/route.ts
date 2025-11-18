// POST /api/affiliate/payout - Request affiliate payout (minimum ₦1,000)
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { payoutAffiliateEarnings } from '@/lib/affiliate';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    const result = await payoutAffiliateEarnings(session.user.id, amount);

    return NextResponse.json({
      message: 'Payout processed successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('Error processing payout:', error);

    // Return specific error for minimum payout
    if (error.message.includes('Minimum payout')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to process payout' },
      { status: 500 }
    );
  }
}
