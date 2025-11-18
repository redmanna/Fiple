// POST /api/marketplace/orders/[id]/pay - Process payment
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processOrderPayment } from '@/lib/marketplace';
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
    const { paymentMethod = 'wallet', paymentRef } = body;

    // Verify order ownership
    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (order.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Order already paid' },
        { status: 400 }
      );
    }

    // Process payment from wallet
    if (paymentMethod === 'wallet') {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: session.user.id },
      });

      if (!wallet || wallet.balanceNGN < order.total) {
        return NextResponse.json(
          { error: 'Insufficient wallet balance' },
          { status: 400 }
        );
      }

      // Deduct from wallet
      await prisma.wallet.update({
        where: { userId: session.user.id },
        data: {
          balanceNGN: { decrement: order.total },
        },
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId: session.user.id,
          type: 'WITHDRAWAL' as any,
          status: 'COMPLETED' as any,
          amount: order.total,
          netAmount: order.total,
          description: `Payment for order ${order.orderNumber}`,
          reference: order.paymentRef,
          completedAt: new Date(),
        },
      });
    }

    // Process order payment (updates stock, merchant metrics, affiliate earnings)
    const updatedOrder = await processOrderPayment(params.id, {
      paymentMethod,
      paymentRef: paymentRef || order.paymentRef,
    });

    return NextResponse.json({
      message: 'Payment processed successfully',
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process payment' },
      { status: 500 }
    );
  }
}
