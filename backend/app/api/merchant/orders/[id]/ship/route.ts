// PUT /api/merchant/orders/[id]/ship - Update shipping status
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateOrderStatus } from '@/lib/marketplace';
import prisma from '@/lib/prisma';

export async function PUT(
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

    const merchant = await prisma.merchantAccount.findUnique({
      where: { userId: session.user.id },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant account not found' },
        { status: 404 }
      );
    }

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

    if (order.merchantId !== merchant.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { status, trackingNumber } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    if (status === 'SHIPPED' && !trackingNumber) {
      return NextResponse.json(
        { error: 'Tracking number is required for shipped status' },
        { status: 400 }
      );
    }

    const updatedOrder = await updateOrderStatus(
      params.id,
      status,
      trackingNumber
    );

    return NextResponse.json({
      message: 'Order status updated successfully',
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}
