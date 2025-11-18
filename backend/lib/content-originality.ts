// Content Originality Detection System
import prisma from './prisma';

// Competing platforms to monitor
const COMPETING_PLATFORMS = ['tiktok', 'instagram', 'youtube', 'snapchat', 'facebook'];

// Keywords that indicate platform mentions
const PLATFORM_KEYWORDS: Record<string, string[]> = {
  tiktok: ['tiktok', 'tik tok', '@tiktok', 'tiktoker'],
  instagram: ['instagram', 'insta', '@instagram', 'ig live', 'igram'],
  youtube: ['youtube', 'yt', '@youtube', 'youtuber'],
  snapchat: ['snapchat', 'snap', '@snapchat'],
  facebook: ['facebook', 'fb', '@facebook', 'fb live'],
};

/**
 * Analyze content for originality
 */
export async function analyzeContentOriginality(
  contentId: string,
  contentType: 'POST' | 'STORY' | 'REEL' | 'LIVESTREAM',
  userId: string,
  mediaUrls?: string[]
) {
  const analysis: any = {
    hasWatermark: false,
    hasCopyrighted: false,
    isDuplicate: false,
    platformMentions: [],
    originalityScore: 100,
  };

  // 1. Watermark Detection (simplified - in production use AI service)
  if (mediaUrls && mediaUrls.length > 0) {
    const watermarkResult = await detectWatermarks(mediaUrls);
    analysis.hasWatermark = watermarkResult.detected;
    analysis.watermarkSource = watermarkResult.source;
    analysis.watermarkConfidence = watermarkResult.confidence;

    if (analysis.hasWatermark) {
      analysis.originalityScore -= 30;
    }
  }

  // 2. Duplicate Detection (hash-based)
  const duplicateResult = await checkDuplicate(contentId, contentType, userId);
  analysis.isDuplicate = duplicateResult.isDuplicate;
  analysis.originalId = duplicateResult.originalId;

  if (analysis.isDuplicate) {
    analysis.originalityScore -= 50;
  }

  // 3. Copyright Detection (simplified)
  // In production, integrate with services like Audible Magic or YouTube Content ID

  // Create/update analysis record
  const record = await prisma.contentOriginality.upsert({
    where: {
      contentId_contentType: {
        contentId,
        contentType,
      },
    },
    create: {
      contentId,
      contentType,
      userId,
      ...analysis,
      analyzedAt: new Date(),
    },
    update: {
      ...analysis,
      analyzedAt: new Date(),
    },
  });

  // Apply restrictions based on score
  await applyRestrictions(record);

  return record;
}

/**
 * Detect watermarks in media (simplified - use AI service in production)
 */
async function detectWatermarks(
  mediaUrls: string[]
): Promise<{ detected: boolean; source?: string; confidence?: number }> {
  // In production, send to AI service for logo/watermark detection
  // For now, we'll do simple URL pattern matching

  for (const url of mediaUrls) {
    const urlLower = url.toLowerCase();

    if (urlLower.includes('tiktok')) {
      return { detected: true, source: 'tiktok', confidence: 95 };
    }
    if (urlLower.includes('instagram') || urlLower.includes('cdninstagram')) {
      return { detected: true, source: 'instagram', confidence: 95 };
    }
    if (urlLower.includes('youtube') || urlLower.includes('ytimg')) {
      return { detected: true, source: 'youtube', confidence: 95 };
    }
    if (urlLower.includes('snapchat')) {
      return { detected: true, source: 'snapchat', confidence: 95 };
    }
  }

  return { detected: false };
}

/**
 * Check for duplicate content
 */
async function checkDuplicate(
  contentId: string,
  contentType: string,
  userId: string
): Promise<{ isDuplicate: boolean; originalId?: string }> {
  // Simple duplicate check - in production use perceptual hashing
  // Check if user has posted identical content before

  let query: any;
  if (contentType === 'LIVESTREAM') {
    query = prisma.liveStream.findMany({
      where: {
        hostId: userId,
        id: { not: contentId },
      },
      take: 1,
    });
  } else {
    query = prisma.post.findMany({
      where: {
        userId,
        id: { not: contentId },
        contentType: contentType as any,
      },
      take: 1,
    });
  }

  const similar = await query;

  // Basic check - would need proper content comparison in production
  return {
    isDuplicate: false, // Simplified for now
    originalId: undefined,
  };
}

/**
 * Apply restrictions based on originality score
 */
async function applyRestrictions(analysis: any) {
  let restrictionType = null;
  let isFlagged = false;
  let isRestricted = false;

  if (analysis.originalityScore < 50) {
    // Very low score - hide content
    restrictionType = 'HIDDEN';
    isFlagged = true;
    isRestricted = true;
  } else if (analysis.originalityScore < 70) {
    // Low score - suppress from FYP
    restrictionType = 'FYP_SUPPRESSED';
    isRestricted = true;
  }

  if (restrictionType) {
    await prisma.contentOriginality.update({
      where: { id: analysis.id },
      data: {
        isFlagged,
        isRestricted,
        restrictionType,
        restrictionReason: `Originality score: ${analysis.originalityScore}`,
      },
    });

    // Update the actual content
    if (analysis.contentType === 'LIVESTREAM') {
      // For live streams, we handle differently
      if (restrictionType === 'HIDDEN') {
        await prisma.liveStream.update({
          where: { id: analysis.contentId },
          data: { status: 'CANCELLED' as any },
        });
      }
    } else {
      // For posts
      if (restrictionType === 'HIDDEN') {
        await prisma.post.update({
          where: { id: analysis.contentId },
          data: { status: 'FLAGGED' as any },
        });
      }
    }
  }
}

/**
 * Monitor live stream for platform mentions
 */
export async function monitorPlatformMentions(
  streamId: string,
  userId: string,
  username: string,
  message: string
) {
  const messageLower = message.toLowerCase();

  for (const [platform, keywords] of Object.entries(PLATFORM_KEYWORDS)) {
    for (const keyword of keywords) {
      if (messageLower.includes(keyword)) {
        // Record platform mention
        await prisma.platformMention.create({
          data: {
            streamId,
            userId,
            username,
            mentionedPlatform: platform,
            mentionContext: message,
            timestamp: 0, // Would be seconds into stream in production
            confidence: 90,
          },
        });

        // Issue warning
        await issuePlatformMentionWarning(streamId, userId, platform);

        return {
          detected: true,
          platform,
          warning: true,
        };
      }
    }
  }

  return { detected: false };
}

/**
 * Issue warning for platform mentions
 */
async function issuePlatformMentionWarning(streamId: string, userId: string, platform: string) {
  // Count mentions in this stream
  const mentionsCount = await prisma.platformMention.count({
    where: {
      streamId,
      userId,
    },
  });

  // 3-strike system
  if (mentionsCount >= 3) {
    // Mute stream
    await prisma.platformMention.updateMany({
      where: { streamId, userId },
      data: {
        streamMuted: true,
      },
    });

    // End stream if too many violations
    await prisma.liveStream.update({
      where: { id: streamId },
      data: { status: 'ENDED' as any },
    });
  } else {
    // Just issue warning
    await prisma.platformMention.updateMany({
      where: { streamId, userId },
      data: {
        warningIssued: true,
      },
    });

    // Temporarily reduce viewer count visibility (soft penalty)
    await prisma.platformMention.updateMany({
      where: { streamId, userId },
      data: {
        viewersImpact: 10, // Simulate 10 viewers leaving
      },
    });
  }
}

/**
 * Get content originality report
 */
export async function getOriginalityReport(userId: string, days: number = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const analyses = await prisma.contentOriginality.findMany({
    where: {
      userId,
      analyzedAt: { gte: startDate },
    },
    orderBy: { analyzedAt: 'desc' },
  });

  const flaggedCount = analyses.filter(a => a.isFlagged).length;
  const restrictedCount = analyses.filter(a => a.isRestricted).length;
  const averageScore =
    analyses.reduce((sum, a) => sum + a.originalityScore, 0) / analyses.length || 100;

  // Platform mentions
  const mentions = await prisma.platformMention.findMany({
    where: {
      userId,
      createdAt: { gte: startDate },
    },
  });

  const mentionsByPlatform: Record<string, number> = {};
  mentions.forEach(m => {
    mentionsByPlatform[m.mentionedPlatform] = (mentionsByPlatform[m.mentionedPlatform] || 0) + 1;
  });

  return {
    totalAnalyzed: analyses.length,
    flaggedCount,
    restrictedCount,
    averageOriginalityScore: averageScore,
    platformMentions: {
      total: mentions.length,
      byPlatform: mentionsByPlatform,
      warningsIssued: mentions.filter(m => m.warningIssued).length,
    },
    recentAnalyses: analyses.slice(0, 10),
  };
}

/**
 * Manual content review (for admins)
 */
export async function reviewFlaggedContent(
  contentId: string,
  contentType: string,
  reviewerId: string,
  decision: 'APPROVE' | 'REJECT' | 'KEEP_RESTRICTED'
) {
  const analysis = await prisma.contentOriginality.findUnique({
    where: {
      contentId_contentType: {
        contentId,
        contentType: contentType as any,
      },
    },
  });

  if (!analysis) {
    throw new Error('Analysis not found');
  }

  if (decision === 'APPROVE') {
    // Clear restrictions
    await prisma.contentOriginality.update({
      where: { id: analysis.id },
      data: {
        isFlagged: false,
        isRestricted: false,
        restrictionType: null,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });

    // Restore content
    if (contentType === 'LIVESTREAM') {
      await prisma.liveStream.update({
        where: { id: contentId },
        data: { status: 'LIVE' as any },
      });
    } else {
      await prisma.post.update({
        where: { id: contentId },
        data: { status: 'PUBLISHED' as any },
      });
    }
  } else if (decision === 'REJECT') {
    // Permanently remove
    await prisma.contentOriginality.update({
      where: { id: analysis.id },
      data: {
        restrictionType: 'REMOVED',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });

    if (contentType !== 'LIVESTREAM') {
      await prisma.post.update({
        where: { id: contentId },
        data: { status: 'REMOVED' as any },
      });
    }
  } else {
    // Keep current restrictions
    await prisma.contentOriginality.update({
      where: { id: analysis.id },
      data: {
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });
  }

  return { success: true, decision };
}
