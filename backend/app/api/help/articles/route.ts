// GET /api/help/articles - Browse help articles
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getHelpCategories } from '@/lib/help';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const tier = searchParams.get('tier'); // USER, CREATOR, MERCHANT, ADMIN
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      isPublished: true,
    };

    if (category) {
      where.category = category;
    }

    if (tier) {
      where.tier = tier;
    }

    const [articles, total, categories] = await Promise.all([
      prisma.helpArticle.findMany({
        where,
        orderBy: [
          { viewCount: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          tier: true,
          tags: true,
          viewCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.helpArticle.count({ where }),
      getHelpCategories(tier || undefined),
    ]);

    return NextResponse.json({
      articles,
      categories,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching help articles:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
