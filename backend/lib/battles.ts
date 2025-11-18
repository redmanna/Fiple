// Fiple Live Battle System
import prisma from './prisma';

/**
 * Create battle
 */
export async function createBattle(
  host1Id: string,
  data: {
    battleType: string;
    inviteType: string;
    duration: number;
    host2Id?: string;
    streamId?: string;
  }
) {
  const host1 = await prisma.user.findUnique({
    where: { id: host1Id },
    select: { username: true, displayName: true },
  });

  if (!host1) {
    throw new Error('Host not found');
  }

  let host2Name = undefined;
  if (data.host2Id) {
    const host2 = await prisma.user.findUnique({
      where: { id: data.host2Id },
      select: { displayName: true },
    });
    host2Name = host2?.displayName;
  }

  return prisma.liveBattle.create({
    data: {
      host1Id,
      host1Name: host1.displayName || host1.username,
      host2Id: data.host2Id,
      host2Name,
      battleType: data.battleType as any,
      inviteType: data.inviteType as any,
      duration: data.duration,
      streamId: data.streamId,
    },
  });
}

/**
 * Send battle invitation
 */
export async function sendBattleInvitation(
  battleId: string,
  senderId: string,
  recipientId: string,
  message?: string
) {
  // Verify battle exists and sender is a participant
  const battle = await prisma.liveBattle.findUnique({
    where: { id: battleId },
  });

  if (!battle) {
    throw new Error('Battle not found');
  }

  if (battle.host1Id !== senderId && battle.host2Id !== senderId) {
    throw new Error('Only battle participants can send invitations');
  }

  // Check if already invited
  const existing = await prisma.battleInvitation.findUnique({
    where: {
      battleId_recipientId: {
        battleId,
        recipientId,
      },
    },
  });

  if (existing) {
    throw new Error('Already invited');
  }

  return prisma.battleInvitation.create({
    data: {
      battleId,
      senderId,
      recipientId,
      message,
    },
  });
}

/**
 * Respond to battle invitation
 */
export async function respondToBattleInvitation(
  invitationId: string,
  recipientId: string,
  accept: boolean
) {
  const invitation = await prisma.battleInvitation.findUnique({
    where: { id: invitationId },
    include: { battle: true },
  });

  if (!invitation) {
    throw new Error('Invitation not found');
  }

  if (invitation.recipientId !== recipientId) {
    throw new Error('Unauthorized');
  }

  if (invitation.status !== 'PENDING') {
    throw new Error('Invitation already responded to');
  }

  await prisma.battleInvitation.update({
    where: { id: invitationId },
    data: {
      status: accept ? 'ACCEPTED' : 'DECLINED',
      respondedAt: new Date(),
    },
  });

  if (accept) {
    // Add to battle as host2
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { displayName: true, username: true },
    });

    await prisma.liveBattle.update({
      where: { id: invitation.battleId },
      data: {
        host2Id: recipientId,
        host2Name: recipient?.displayName || recipient?.username,
      },
    });
  }

  return invitation;
}

/**
 * Start battle
 */
export async function startBattle(battleId: string, hostId: string) {
  const battle = await prisma.liveBattle.findUnique({
    where: { id: battleId },
  });

  if (!battle) {
    throw new Error('Battle not found');
  }

  if (battle.host1Id !== hostId && battle.host2Id !== hostId) {
    throw new Error('Unauthorized');
  }

  if (!battle.host2Id) {
    throw new Error('Waiting for opponent to join');
  }

  if (battle.status !== 'PENDING') {
    throw new Error('Battle already started');
  }

  return prisma.liveBattle.update({
    where: { id: battleId },
    data: {
      status: 'LIVE',
      startedAt: new Date(),
    },
  });
}

/**
 * Send gift in battle
 */
export async function sendBattleGift(
  battleId: string,
  senderId: string,
  recipientSide: 'host1' | 'host2',
  giftType: string,
  quantity: number = 1
) {
  const battle = await prisma.liveBattle.findUnique({
    where: { id: battleId },
  });

  if (!battle || battle.status !== 'LIVE') {
    throw new Error('Battle is not live');
  }

  // Gift pricing (same as live stream)
  const giftPrices: Record<string, number> = {
    ROSE: 50,
    HEART: 100,
    STAR: 200,
    DIAMOND: 500,
    CROWN: 1000,
    ROCKET: 2000,
    FERRARI: 5000,
    MANSION: 10000,
  };

  const amount = (giftPrices[giftType] || 0) * quantity;

  // Create gift record
  const gift = await prisma.battleGift.create({
    data: {
      battleId,
      senderId,
      recipientSide,
      giftType,
      amount,
      quantity,
    },
  });

  // Update battle scores
  const updateData: any = {
    prizePool: { increment: amount },
  };

  if (recipientSide === 'host1') {
    updateData.host1Score = { increment: amount };
    updateData.host1Gifts = { increment: quantity };
  } else {
    updateData.host2Score = { increment: amount };
    updateData.host2Gifts = { increment: quantity };
  }

  await prisma.liveBattle.update({
    where: { id: battleId },
    data: updateData,
  });

  return gift;
}

/**
 * Vote in battle (for talent showdowns)
 */
export async function voteBattle(
  battleId: string,
  voterId: string,
  votedFor: 'host1' | 'host2'
) {
  const battle = await prisma.liveBattle.findUnique({
    where: { id: battleId },
  });

  if (!battle || battle.status !== 'LIVE') {
    throw new Error('Battle is not live');
  }

  // Check if already voted
  const existing = await prisma.battleVote.findUnique({
    where: {
      battleId_voterId: {
        battleId,
        voterId,
      },
    },
  });

  if (existing) {
    // Update vote
    await prisma.battleVote.update({
      where: { id: existing.id },
      data: { votedFor },
    });

    // Recalculate votes
    await recalculateBattleVotes(battleId);
  } else {
    // New vote
    await prisma.battleVote.create({
      data: {
        battleId,
        voterId,
        votedFor,
      },
    });

    // Update battle vote counts
    const updateData: any = {};
    if (votedFor === 'host1') {
      updateData.host1Votes = { increment: 1 };
    } else {
      updateData.host2Votes = { increment: 1 };
    }

    await prisma.liveBattle.update({
      where: { id: battleId },
      data: updateData,
    });
  }
}

async function recalculateBattleVotes(battleId: string) {
  const votes = await prisma.battleVote.findMany({
    where: { battleId },
  });

  const host1Votes = votes.filter(v => v.votedFor === 'host1').length;
  const host2Votes = votes.filter(v => v.votedFor === 'host2').length;

  await prisma.liveBattle.update({
    where: { id: battleId },
    data: {
      host1Votes,
      host2Votes,
    },
  });
}

/**
 * End battle and calculate winner
 */
export async function endBattle(battleId: string, hostId: string) {
  const battle = await prisma.liveBattle.findUnique({
    where: { id: battleId },
  });

  if (!battle) {
    throw new Error('Battle not found');
  }

  if (battle.host1Id !== hostId && battle.host2Id !== hostId) {
    throw new Error('Unauthorized');
  }

  if (battle.status !== 'LIVE') {
    throw new Error('Battle is not live');
  }

  // Determine winner based on battle type
  let winnerId: string;
  let winnerScore: number;

  if (battle.battleType === 'GIFT_WAR') {
    // Highest gifts wins
    if (battle.host1Score > battle.host2Score) {
      winnerId = battle.host1Id;
      winnerScore = battle.host1Score;
    } else {
      winnerId = battle.host2Id!;
      winnerScore = battle.host2Score;
    }
  } else if (battle.battleType === 'TALENT_SHOWDOWN') {
    // Most votes wins
    if (battle.host1Votes > battle.host2Votes) {
      winnerId = battle.host1Id;
      winnerScore = battle.host1Votes;
    } else {
      winnerId = battle.host2Id!;
      winnerScore = battle.host2Votes;
    }
  } else {
    // Default: highest score wins
    if (battle.host1Score > battle.host2Score) {
      winnerId = battle.host1Id;
      winnerScore = battle.host1Score;
    } else {
      winnerId = battle.host2Id!;
      winnerScore = battle.host2Score;
    }
  }

  // Calculate prizes (60% winner, 30% runner-up, 10% platform)
  const winnerPrize = battle.prizePool * 0.6;
  const runnerUpPrize = battle.prizePool * 0.3;
  const platformFee = battle.prizePool * 0.1;

  const runnerId = winnerId === battle.host1Id ? battle.host2Id! : battle.host1Id;

  // Award prizes
  await prisma.wallet.update({
    where: { userId: winnerId },
    data: {
      balanceNGN: { increment: winnerPrize },
      totalEarned: { increment: winnerPrize },
    },
  });

  await prisma.wallet.update({
    where: { userId: runnerId },
    data: {
      balanceNGN: { increment: runnerUpPrize },
      totalEarned: { increment: runnerUpPrize },
    },
  });

  // Update battle
  const updatedBattle = await prisma.liveBattle.update({
    where: { id: battleId },
    data: {
      status: 'COMPLETED',
      endedAt: new Date(),
      winnerId,
      winnerPrize,
    },
  });

  // Award winner badge
  await prisma.userBadge.create({
    data: {
      userId: winnerId,
      badgeType: 'TOP_GIFTER_GOLD' as any, // Reuse badge type
      earnedFor: `Won ${battle.battleType} battle`,
    },
  });

  return updatedBattle;
}

/**
 * Get battle leaderboard
 */
export async function getBattleLeaderboard(battleId: string) {
  const battle = await prisma.liveBattle.findUnique({
    where: { id: battleId },
  });

  if (!battle) {
    throw new Error('Battle not found');
  }

  const [host1, host2] = await Promise.all([
    prisma.user.findUnique({
      where: { id: battle.host1Id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
      },
    }),
    battle.host2Id
      ? prisma.user.findUnique({
          where: { id: battle.host2Id },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        })
      : null,
  ]);

  return {
    battle,
    leaderboard: [
      {
        ...host1,
        score: battle.host1Score,
        gifts: battle.host1Gifts,
        votes: battle.host1Votes,
        side: 'host1',
      },
      host2
        ? {
            ...host2,
            score: battle.host2Score,
            gifts: battle.host2Gifts,
            votes: battle.host2Votes,
            side: 'host2',
          }
        : null,
    ].filter(Boolean),
  };
}
