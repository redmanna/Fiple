// POST /api/battles/[id]/end - End battle and calculate winner
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { endBattle } from '@/lib/battles';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const battle = await endBattle(params.id, session.user.id);

    return NextResponse.json({
      message: 'Battle ended successfully',
      battle,
    });
  } catch (error: any) {
    console.error('Error ending battle:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to end battle' },
      { status: 500 }
    );
  }
}
