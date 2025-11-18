// POST /api/merchant/products - Add product
// GET /api/merchant/products - Get merchant products
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createProduct } from '@/lib/marketplace';
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

    const merchant = await prisma.merchantAccount.findUnique({
      where: { userId: session.user.id },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant account not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      name,
      description,
      price,
      compareAtPrice,
      category,
      images,
      stock,
      sku,
      variants,
      shippingWeight,
      allowAffiliate = true,
      affiliateRate = 10,
      tags,
    } = body;

    if (!name || !description || !price || !category || !images || images.length === 0) {
      return NextResponse.json(
        { error: 'Name, description, price, category, and at least one image are required' },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      );
    }

    if (stock !== undefined && stock < 0) {
      return NextResponse.json(
        { error: 'Stock must be a positive number' },
        { status: 400 }
      );
    }

    const product = await createProduct(merchant.id, {
      name,
      description,
      price,
      compareAtPrice,
      category,
      images,
      stock: stock || 0,
      sku,
      variants,
      shippingWeight,
      allowAffiliate,
      affiliateRate,
      tags,
    });

    return NextResponse.json({
      message: 'Product created successfully',
      product,
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
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

    const merchant = await prisma.merchantAccount.findUnique({
      where: { userId: session.user.id },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant account not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      merchantId: merchant.id,
    };

    if (status) {
      where.status = status;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
