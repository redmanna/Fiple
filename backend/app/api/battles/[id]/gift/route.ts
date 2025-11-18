// POST /api/battles/[id]/gift - Send gift in battle
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendBattleGift } from '@/lib/battles';
import prisma from '@/lib/prisma';

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
    const { recipientSide, giftType, quantity = 1 } = body;

    if (!recipientSide || !giftType) {
      return NextResponse.json(
        { error: 'Recipient side and gift type are required' },
        { status: 400 }
      );
    }

    if (!['host1', 'host2'].includes(recipientSide)) {
      return NextResponse.json(
        { error: 'Invalid recipient side' },
        { status: 400 }
      );
    }

    const validGiftTypes = ['ROSE', 'HEART', 'STAR', 'DIAMOND', 'CROWN', 'ROCKET', 'FERRARI', 'MANSION'];
    if (!validGiftTypes.includes(giftType)) {
      return NextResponse.json(
        { error: 'Invalid gift type' },
        { status: 400 }
      );
    }

    if (quantity < 1 || quantity > 100) {
      return NextResponse.json(
        { error: 'Quantity must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Calculate total cost
    const giftPrices: Record<string, number> = {
      ROSE: 50,
      HEART: 100,
      STAR: 200,
      DIAMOND: 500,
      CROWN: 1000,
      ROCKET: 2000,
      FERRARI: 5000,
      MANSION: 10000,
    };

    const totalCost = giftPrices[giftType] * quantity;

    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet || wallet.balanceNGN < totalCost) {
      return NextResponse.json(
        { error: 'Insufficient wallet balance' },
        { status: 400 }
      );
    }

    // Deduct from wallet
    await prisma.wallet.update({
      where: { userId: session.user.id },
      data: {
        balanceNGN: { decrement: totalCost },
      },
    });

    // Send gift
    const gift = await sendBattleGift(
      params.id,
      session.user.id,
      recipientSide,
      giftType,
      quantity
    );

    return NextResponse.json({
      message: 'Gift sent successfully',
      gift,
    });
  } catch (error: any) {
    console.error('Error sending battle gift:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send gift' },
      { status: 500 }
    );
  }
}
