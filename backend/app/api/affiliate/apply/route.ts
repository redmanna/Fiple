// POST /api/affiliate/apply - Apply for affiliate partnership (2,500+ followers required)
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { applyForAffiliate } from '@/lib/affiliate';

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
    const { merchantId, applicationNote } = body;

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    // applyForAffiliate will check the 2,500+ follower requirement
    const partnership = await applyForAffiliate(
      session.user.id,
      merchantId,
      applicationNote
    );

    return NextResponse.json({
      message: 'Application submitted successfully',
      partnership,
    });
  } catch (error: any) {
    console.error('Error applying for affiliate:', error);

    // Return specific error for follower requirement
    if (error.message.includes('2500 followers')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to apply for affiliate' },
      { status: 500 }
    );
  }
}
