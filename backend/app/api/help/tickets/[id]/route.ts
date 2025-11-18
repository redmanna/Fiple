// GET /api/help/tickets/[id] - Get ticket details with messages
// POST /api/help/tickets/[id] - Add message to ticket
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTicketDetails, addTicketMessage } from '@/lib/help';

export async function GET(
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

    const ticketData = await getTicketDetails(params.id, session.user.id);

    return NextResponse.json(ticketData);
  } catch (error: any) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

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
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const ticketMessage = await addTicketMessage(
      params.id,
      session.user.id,
      message,
      false
    );

    return NextResponse.json({
      message: 'Message added successfully',
      ticketMessage,
    });
  } catch (error: any) {
    console.error('Error adding message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add message' },
      { status: 500 }
    );
  }
}
