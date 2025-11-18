// POST /api/battles/create - Create battle
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createBattle } from '@/lib/battles';

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
    const { battleType, inviteType, duration, host2Id, streamId } = body;

    if (!battleType || !inviteType) {
      return NextResponse.json(
        { error: 'Battle type and invite type are required' },
        { status: 400 }
      );
    }

    const validBattleTypes = ['PK_BATTLE', 'TEAM_BATTLE', 'GIFT_WAR', 'TALENT_SHOWDOWN'];
    if (!validBattleTypes.includes(battleType)) {
      return NextResponse.json(
        { error: 'Invalid battle type' },
        { status: 400 }
      );
    }

    const validInviteTypes = ['PRIVATE', 'FOLLOWERS', 'OPEN'];
    if (!validInviteTypes.includes(inviteType)) {
      return NextResponse.json(
        { error: 'Invalid invite type' },
        { status: 400 }
      );
    }

    if (!duration || duration < 60 || duration > 3600) {
      return NextResponse.json(
        { error: 'Duration must be between 60 and 3600 seconds' },
        { status: 400 }
      );
    }

    const battle = await createBattle(session.user.id, {
      battleType,
      inviteType,
      duration,
      host2Id,
      streamId,
    });

    return NextResponse.json({
      message: 'Battle created successfully',
      battle,
    });
  } catch (error: any) {
    console.error('Error creating battle:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create battle' },
      { status: 500 }
    );
  }
}
