// POST /api/battles/[id]/vote - Vote for winner (talent showdowns)
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { voteBattle } from '@/lib/battles';

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

    const body = await req.json();
    const { votedFor } = body;

    if (!votedFor) {
      return NextResponse.json(
        { error: 'VotedFor is required' },
        { status: 400 }
      );
    }

    if (!['host1', 'host2'].includes(votedFor)) {
      return NextResponse.json(
        { error: 'Invalid vote' },
        { status: 400 }
      );
    }

    await voteBattle(params.id, session.user.id, votedFor);

    return NextResponse.json({
      message: 'Vote recorded successfully',
    });
  } catch (error: any) {
    console.error('Error voting in battle:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to vote' },
      { status: 500 }
    );
  }
}
