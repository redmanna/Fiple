// POST /api/marketplace/reviews - Create review
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createProductReview } from '@/lib/marketplace';

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
    const { productId, orderId, rating, title, review, images } = body;

    if (!productId || !orderId || !rating) {
      return NextResponse.json(
        { error: 'Product ID, Order ID, and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const productReview = await createProductReview(
      session.user.id,
      productId,
      orderId,
      {
        rating,
        title,
        review,
        images,
      }
    );

    return NextResponse.json({
      message: 'Review created successfully',
      review: productReview,
    });
  } catch (error: any) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create review' },
      { status: 500 }
    );
  }
}
