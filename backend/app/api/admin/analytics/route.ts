// GET /api/admin/analytics - Get platform analytics
import { NextRequest } from 'next/server';
import { withAdmin, successResponse, errorResponse } from '@/lib/middleware';
import {
  getPlatformAnalytics,
  getUserGrowthAnalytics,
  getContentAnalytics,
  getFinancialAnalytics,
  getRewardAnalytics,
} from '@/lib/admin-analytics';
import { ErrorCode } from '@/../../../../../../shared/types';

export const GET = withAdmin(async (req: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const timeRange = (searchParams.get('timeRange') as '24h' | '7d' | '30d' | 'all') || '30d';
    const section = searchParams.get('section') || 'overview';

    let data: any;

    switch (section) {
      case 'overview':
        data = await getPlatformAnalytics(timeRange);
        break;

      case 'growth':
        const days = timeRange === '24h' ? 7 : timeRange === '7d' ? 7 : 30;
        data = await getUserGrowthAnalytics(days);
        break;

      case 'content':
        data = await getContentAnalytics();
        break;

      case 'financial':
        data = await getFinancialAnalytics(30);
        break;

      case 'rewards':
        data = await getRewardAnalytics();
        break;

      default:
        data = await getPlatformAnalytics(timeRange);
    }

    return successResponse(data);
  } catch (error) {
    console.error('Get analytics error:', error);
    return errorResponse('Failed to get analytics', ErrorCode.SERVER_ERROR, 500);
  }
});
