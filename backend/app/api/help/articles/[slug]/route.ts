// GET /api/help/articles/[slug] - Get article details
import { NextRequest, NextResponse } from 'next/server';
import { getHelpArticle } from '@/lib/help';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const article = await getHelpArticle(params.slug);

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    if (!article.isPublished) {
      return NextResponse.json(
        { error: 'Article not available' },
        { status: 404 }
      );
    }

    return NextResponse.json({ article });
  } catch (error: any) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
