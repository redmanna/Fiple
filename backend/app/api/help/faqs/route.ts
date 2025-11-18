// GET /api/help/faqs - Get FAQs
import { NextRequest, NextResponse } from 'next/server';
import { getFAQs, incrementFAQView } from '@/lib/help';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const tier = searchParams.get('tier');

    const faqs = await getFAQs(
      category || undefined,
      tier || undefined
    );

    // Group FAQs by category
    const groupedFAQs: Record<string, any[]> = {};
    faqs.forEach(faq => {
      if (!groupedFAQs[faq.category]) {
        groupedFAQs[faq.category] = [];
      }
      groupedFAQs[faq.category].push(faq);
    });

    return NextResponse.json({
      faqs,
      groupedFAQs,
      count: faqs.length,
    });
  } catch (error: any) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}
