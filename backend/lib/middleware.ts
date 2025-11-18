// Middleware Utilities
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromHeader, JWTPayload } from './auth';
import { ApiResponse, ErrorCode } from '@/../../shared/types';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Authentication middleware
 * Extracts and verifies JWT from Authorization header
 */
export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: AuthenticatedRequest): Promise<NextResponse> => {
    const authHeader = req.headers.get('authorization');
    const user = getUserFromHeader(authHeader);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          code: ErrorCode.UNAUTHORIZED,
        } as ApiResponse,
        { status: 401 }
      );
    }

    req.user = user;
    return handler(req);
  };
}

/**
 * Admin-only middleware
 */
export function withAdmin(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'APPROVER') {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Admin access required',
          code: ErrorCode.FORBIDDEN,
        } as ApiResponse,
        { status: 403 }
      );
    }

    return handler(req);
  });
}

/**
 * Error response helper
 */
export function errorResponse(
  message: string,
  code: ErrorCode = ErrorCode.SERVER_ERROR,
  status: number = 500
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
    } as ApiResponse,
    { status }
  );
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    } as ApiResponse<T>,
    { status }
  );
}

/**
 * Pagination helper
 */
export function getPaginationParams(url: URL) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
  const skip = (page - 1) * pageSize;

  return { page, pageSize, skip, take: pageSize };
}
