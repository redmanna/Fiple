// POST /api/affiliate/showcase - Add product to live stream showcase
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createLiveShowcase } from '@/lib/affiliate';

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
    const { streamId, productId } = body;

    if (!streamId || !productId) {
      return NextResponse.json(
        { error: 'Stream ID and Product ID are required' },
        { status: 400 }
      );
    }

    const showcase = await createLiveShowcase(
      streamId,
      productId,
      session.user.id
    );

    return NextResponse.json({
      message: 'Product added to live showcase',
      showcase,
    });
  } catch (error: any) {
    console.error('Error creating live showcase:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create live showcase' },
      { status: 500 }
    );
  }
}
