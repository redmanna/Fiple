// POST /api/marketplace/checkout - Create order
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createOrder } from '@/lib/marketplace';

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
    const {
      shippingAddress,
      shippingMethod = 'standard',
      discountCode,
      affiliateCode,
    } = body;

    if (!shippingAddress) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    // Validate shipping address
    if (
      !shippingAddress.fullName ||
      !shippingAddress.phone ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.state
    ) {
      return NextResponse.json(
        { error: 'Incomplete shipping address' },
        { status: 400 }
      );
    }

    const orders = await createOrder(session.user.id, {
      shippingAddress,
      shippingMethod,
      discountCode,
      affiliateCode,
    });

    return NextResponse.json({
      message: 'Orders created successfully',
      orders,
      totalOrders: orders.length,
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
