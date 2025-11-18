// PUT /api/merchant/products/[id] - Update product
// DELETE /api/merchant/products/[id] - Delete product
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

    // Verify product ownership
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.merchantId !== merchant.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updateData: any = {};

    // Only update provided fields
    const allowedFields = [
      'name',
      'description',
      'price',
      'compareAtPrice',
      'category',
      'images',
      'stock',
      'sku',
      'variants',
      'shippingWeight',
      'allowAffiliate',
      'affiliateRate',
      'tags',
      'status',
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Calculate discount percentage if compareAtPrice is updated
    if (updateData.price !== undefined || updateData.compareAtPrice !== undefined) {
      const newPrice = updateData.price || product.price;
      const newCompareAt = updateData.compareAtPrice || product.compareAtPrice;

      if (newCompareAt && newCompareAt > newPrice) {
        updateData.discountPercent = Math.round(
          ((newCompareAt - newPrice) / newCompareAt) * 100
        );
      } else {
        updateData.discountPercent = null;
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Verify product ownership
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.merchantId !== merchant.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Soft delete by setting status to INACTIVE
    await prisma.product.update({
      where: { id: params.id },
      data: { status: 'INACTIVE' },
    });

    // Update merchant product count
    await prisma.merchantAccount.update({
      where: { id: merchant.id },
      data: {
        totalProducts: { decrement: 1 },
      },
    });

    return NextResponse.json({
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
