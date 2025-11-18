// POST /api/merchant/account - Create merchant account
// GET /api/merchant/account - Get merchant account
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createMerchantAccount } from '@/lib/marketplace';
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

    const body = await req.json();
    const {
      businessName,
      businessType,
      businessEmail,
      businessPhone,
      businessAddress,
    } = body;

    if (!businessName || !businessType || !businessEmail || !businessPhone) {
      return NextResponse.json(
        { error: 'Business name, type, email, and phone are required' },
        { status: 400 }
      );
    }

    const merchant = await createMerchantAccount(session.user.id, {
      businessName,
      businessType,
      businessEmail,
      businessPhone,
      businessAddress,
    });

    return NextResponse.json({
      message: 'Merchant account created successfully',
      merchant,
    });
  } catch (error: any) {
    console.error('Error creating merchant account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create merchant account' },
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

    return NextResponse.json({ merchant });
  } catch (error: any) {
    console.error('Error fetching merchant account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch merchant account' },
      { status: 500 }
    );
  }
}
