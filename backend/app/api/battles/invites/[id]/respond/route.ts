// POST /api/battles/invites/[id]/respond - Accept or decline battle invitation
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { respondToBattleInvitation } from '@/lib/battles';

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
    const { accept } = body;

    if (typeof accept !== 'boolean') {
      return NextResponse.json(
        { error: 'Accept must be a boolean' },
        { status: 400 }
      );
    }

    const invitation = await respondToBattleInvitation(
      params.id,
      session.user.id,
      accept
    );

    return NextResponse.json({
      message: accept ? 'Invitation accepted' : 'Invitation declined',
      invitation,
    });
  } catch (error: any) {
    console.error('Error responding to invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to respond to invitation' },
      { status: 500 }
    );
  }
}
