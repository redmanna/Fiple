// POST /api/battles/[id]/invite - Send battle invitation
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendBattleInvitation } from '@/lib/battles';

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
    const { recipientId, message } = body;

    if (!recipientId) {
      return NextResponse.json(
        { error: 'Recipient ID is required' },
        { status: 400 }
      );
    }

    const invitation = await sendBattleInvitation(
      params.id,
      session.user.id,
      recipientId,
      message
    );

    return NextResponse.json({
      message: 'Invitation sent successfully',
      invitation,
    });
  } catch (error: any) {
    console.error('Error sending battle invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
