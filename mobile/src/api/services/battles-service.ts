import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Types
export interface Battle {
  id: string;
  type: 'gift_war' | 'talent_showdown';
  status: 'waiting' | 'live' | 'completed';
  host1: {
    id: string;
    username: string;
    avatar: string;
    totalGifts: number;
  };
  host2: {
    id: string;
    username: string;
    avatar: string;
    totalGifts: number;
  };
  prizePool: number;
  duration: number;
  startTime?: string;
  endTime?: string;
  viewers: number;
  createdAt: string;
}

export interface BattleLeaderboard {
  host1Supporters: LeaderboardEntry[];
  host2Supporters: LeaderboardEntry[];
  host1Total: number;
  host2Total: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar: string;
  amount: number;
}

export interface BattleResults {
  battleId: string;
  winner: 'host1' | 'host2' | 'tie';
  host1: {
    id: string;
    username: string;
    totalGifts: number;
    prize: number;
  };
  host2: {
    id: string;
    username: string;
    totalGifts: number;
    prize: number;
  };
  prizeDistribution: {
    winner: number;
    runnerUp: number;
    topSupporter: number;
  };
  topSupporter?: {
    userId: string;
    username: string;
    amount: number;
  };
  statistics: {
    totalViewers: number;
    totalGifts: number;
    duration: number;
  };
}

export interface Gift {
  id: string;
  name: string;
  icon: string;
  value: number;
  animation?: string;
}

export interface BattleInvite {
  id: string;
  battleId: string;
  senderId: string;
  senderUsername: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

// Helper function to get auth token
async function getAuthToken(): Promise<string | null> {
  return await AsyncStorage.getItem('auth_token');
}

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An error occurred',
    }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

// Battle Services
export const battleService = {
  // Create Battle
  async createBattle(data: {
    type: 'gift_war' | 'talent_showdown';
    opponentId?: string;
    prizeAmount: number;
    duration: number;
  }): Promise<{ battle: Battle }> {
    return apiRequest('/api/battles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get Available Battles
  async getAvailableBattles(): Promise<{ battles: Battle[] }> {
    return apiRequest('/api/battles?status=waiting');
  },

  // Get Live Battles
  async getLiveBattles(): Promise<{ battles: Battle[] }> {
    return apiRequest('/api/battles?status=live');
  },

  // Get Battle Details
  async getBattleDetails(battleId: string): Promise<{ battle: Battle }> {
    return apiRequest(`/api/battles/${battleId}`);
  },

  // Join Battle
  async joinBattle(
    battleId: string,
    side: 'host1' | 'host2'
  ): Promise<{ success: boolean; battle: Battle }> {
    return apiRequest(`/api/battles/${battleId}/join`, {
      method: 'POST',
      body: JSON.stringify({ side }),
    });
  },

  // Start Battle
  async startBattle(battleId: string): Promise<{ success: boolean }> {
    return apiRequest(`/api/battles/${battleId}/start`, {
      method: 'POST',
    });
  },

  // Send Gift in Battle
  async sendGift(
    battleId: string,
    data: {
      recipientSide: 'host1' | 'host2';
      giftType: string;
      quantity: number;
    }
  ): Promise<{ success: boolean; leaderboard: BattleLeaderboard }> {
    return apiRequest(`/api/battles/${battleId}/gift`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Vote in Talent Showdown
  async vote(
    battleId: string,
    side: 'host1' | 'host2'
  ): Promise<{ success: boolean; votes: { host1: number; host2: number } }> {
    return apiRequest(`/api/battles/${battleId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ side }),
    });
  },

  // Get Battle Leaderboard
  async getLeaderboard(battleId: string): Promise<BattleLeaderboard> {
    return apiRequest(`/api/battles/${battleId}/leaderboard`);
  },

  // Get Battle Results
  async getBattleResults(battleId: string): Promise<BattleResults> {
    return apiRequest(`/api/battles/${battleId}/results`);
  },

  // End Battle (Host only)
  async endBattle(battleId: string): Promise<{ success: boolean }> {
    return apiRequest(`/api/battles/${battleId}/end`, {
      method: 'POST',
    });
  },

  // Leave Battle
  async leaveBattle(battleId: string): Promise<{ success: boolean }> {
    return apiRequest(`/api/battles/${battleId}/leave`, {
      method: 'POST',
    });
  },

  // Get Available Gifts
  async getAvailableGifts(): Promise<{ gifts: Gift[] }> {
    return apiRequest('/api/battles/gifts');
  },

  // Send Battle Invite
  async sendInvite(
    battleId: string,
    userId: string
  ): Promise<{ invite: BattleInvite }> {
    return apiRequest('/api/battles/invites', {
      method: 'POST',
      body: JSON.stringify({ battleId, userId }),
    });
  },

  // Get Battle Invites
  async getInvites(): Promise<{ invites: BattleInvite[] }> {
    return apiRequest('/api/battles/invites');
  },

  // Respond to Battle Invite
  async respondToInvite(
    inviteId: string,
    accept: boolean
  ): Promise<{ success: boolean; battle?: Battle }> {
    return apiRequest(`/api/battles/invites/${inviteId}`, {
      method: 'PUT',
      body: JSON.stringify({ accept }),
    });
  },

  // Get User Battle History
  async getBattleHistory(): Promise<{ battles: Battle[] }> {
    return apiRequest('/api/battles/history');
  },

  // Get User Battle Stats
  async getBattleStats(): Promise<{
    totalBattles: number;
    wins: number;
    losses: number;
    totalEarnings: number;
    winRate: number;
  }> {
    return apiRequest('/api/battles/stats');
  },
};
