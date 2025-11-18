// POST /api/help/tickets - Create support ticket
// GET /api/help/tickets - Get user's tickets
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupportTicket, getUserTickets } from '@/lib/help';

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
    const { category, priority = 'MEDIUM', subject, description, attachments } = body;

    if (!category || !subject || !description) {
      return NextResponse.json(
        { error: 'Category, subject, and description are required' },
        { status: 400 }
      );
    }

    const validCategories = ['GENERAL', 'TECHNICAL', 'BILLING', 'ACCOUNT', 'ABUSE', 'MERCHANT'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority' },
        { status: 400 }
      );
    }

    const ticket = await createSupportTicket(session.user.id, {
      category,
      priority,
      subject,
      description,
      attachments,
    });

    return NextResponse.json({
      message: 'Support ticket created successfully',
      ticket,
    });
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const tickets = await getUserTickets(session.user.id, status || undefined);

    return NextResponse.json({ tickets });
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}
