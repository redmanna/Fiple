// POST /api/marketplace/cart - Add to cart
// GET /api/marketplace/cart - Get cart
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { addToCart, getCart } from '@/lib/marketplace';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { productId, quantity = 1, selectedVariant } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (quantity < 1 || quantity > 100) {
      return NextResponse.json(
        { error: 'Quantity must be between 1 and 100' },
        { status: 400 }
      );
    }

    const cartItem = await addToCart(
      session.user.id,
      productId,
      quantity,
      selectedVariant
    );

    return NextResponse.json({
      message: 'Item added to cart',
      cartItem,
    });
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add to cart' },
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

    const cart = await getCart(session.user.id);

    if (!cart) {
      return NextResponse.json({
        items: [],
        subtotal: 0,
        totalItems: 0,
      });
    }

    return NextResponse.json({ cart });
  } catch (error: any) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const cart = await prisma.shoppingCart.findUnique({
      where: { userId: session.user.id },
    });

    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    await prisma.cartItem.delete({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    return NextResponse.json({ message: 'Item removed from cart' });
  } catch (error: any) {
    console.error('Error removing from cart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove from cart' },
      { status: 500 }
    );
  }
}
