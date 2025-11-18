// PUT /api/admin/users/[id] - Update user (admin)
// DELETE /api/admin/users/[id] - Delete user (admin)
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../../../shared/types';

export const PUT = withAdmin(async (req: any, { params }: { params: { id: string } }) => {
  try {
    const userId = params.id;
    const body = await req.json();
    const { accountStatus, verificationStatus, role, reason } = body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return errorResponse('User not found', ErrorCode.NOT_FOUND, 404);
    }

    // Update user
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(accountStatus && { accountStatus }),
        ...(verificationStatus && { verificationStatus }),
        ...(role && { role }),
      },
    });

    // Log admin action
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'admin_user_update',
        entity: 'User',
        entityId: userId,
        changes: {
          accountStatus,
          verificationStatus,
          role,
          reason,
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Update user error:', error);
    return errorResponse('Failed to update user', ErrorCode.SERVER_ERROR, 500);
  }
});

export const DELETE = withAdmin(async (req: any, { params }: { params: { id: string } }) => {
  try {
    const userId = params.id;

    // Soft delete - mark as banned
    await prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: 'BANNED',
      },
    });

    // Log admin action
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'admin_user_delete',
        entity: 'User',
        entityId: userId,
        changes: {},
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return successResponse({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return errorResponse('Failed to delete user', ErrorCode.SERVER_ERROR, 500);
  }
});
