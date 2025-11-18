// GET /api/help/articles/search - Search help documentation
import { NextRequest, NextResponse } from 'next/server';
import { searchHelpArticles } from '@/lib/help';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const tier = searchParams.get('tier');
    const category = searchParams.get('category');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const articles = await searchHelpArticles(
      query,
      tier || undefined,
      category || undefined
    );

    return NextResponse.json({
      articles,
      query,
      count: articles.length,
    });
  } catch (error: any) {
    console.error('Error searching articles:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search articles' },
      { status: 500 }
    );
  }
}
