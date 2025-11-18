// Fiple Shared Types
// Used across backend API and mobile app

// ============================================================================
// USER TYPES
// ============================================================================

export enum UserRole {
  ADMIN = 'ADMIN',
  APPROVER = 'APPROVER',
  CREATOR = 'CREATOR',
  VIEWER = 'VIEWER',
  USER = 'USER',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;

  campusId?: string;
  campusName?: string;

  role: UserRole;
  accountStatus: AccountStatus;
  verificationStatus: VerificationStatus;

  followersCount: number;
  followingCount: number;
  postsCount: number;
  totalLikes: number;
  totalShares: number;

  currentTier?: string;
  lowDataMode: boolean;
  darkMode: boolean;

  createdAt: Date;
}

// ============================================================================
// CONTENT TYPES
// ============================================================================

export enum ContentType {
  POST = 'POST',
  REEL = 'REEL',
  STORY = 'STORY',
  SKILL_POST = 'SKILL_POST',
}

export enum ContentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  FLAGGED = 'FLAGGED',
  REMOVED = 'REMOVED',
}

export interface Post {
  id: string;
  userId: string;
  user?: User;
  contentType: ContentType;
  status: ContentStatus;

  caption?: string;
  mediaUrls: string[];
  mediaTypes: string[];
  thumbnailUrl?: string;

  tags: string[];
  hashtags: string[];

  campusHubId?: string;
  campusHub?: CampusHub;

  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  tipsCount: number;

  isLiked?: boolean; // Client-side only

  createdAt: Date;
  publishedAt?: Date;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user?: User;
  content: string;
  likesCount: number;
  repliesCount: number;
  createdAt: Date;
}

// ============================================================================
// REWARD TYPES
// ============================================================================

export enum RewardType {
  MILESTONE_TIER_1 = 'MILESTONE_TIER_1',
  MILESTONE_TIER_2 = 'MILESTONE_TIER_2',
  MILESTONE_TIER_3 = 'MILESTONE_TIER_3',
  MILESTONE_TIER_4 = 'MILESTONE_TIER_4',
  MILESTONE_TIER_5 = 'MILESTONE_TIER_5',
  WEEKLY_TOP_CREATOR = 'WEEKLY_TOP_CREATOR',
  REFERRAL_BONUS = 'REFERRAL_BONUS',
  SPECIAL_EVENT = 'SPECIAL_EVENT',
}

export enum RewardStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  APPROVED = 'APPROVED',
  DISBURSED = 'DISBURSED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface Reward {
  id: string;
  userId: string;
  type: RewardType;
  status: RewardStatus;
  amount: number;
  currency: string;
  description: string;
  createdAt: Date;
  disbursedAt?: Date;
}

export interface MilestoneCriteria {
  tier: string;
  followers: number;
  likes: number;
  shares: number;
  reward: number;
}

export const MILESTONE_TIERS: MilestoneCriteria[] = [
  { tier: 'Freshman', followers: 1000, likes: 10000, shares: 1000, reward: 50000 },
  { tier: 'Sophomore', followers: 5000, likes: 50000, shares: 5000, reward: 150000 },
  { tier: 'Junior', followers: 15000, likes: 150000, shares: 15000, reward: 300000 },
  { tier: 'Senior', followers: 50000, likes: 500000, shares: 50000, reward: 500000 },
  { tier: 'Alumnus', followers: 100000, likes: 1000000, shares: 100000, reward: 1000000 },
];

// ============================================================================
// WALLET & TRANSACTION TYPES
// ============================================================================

export enum TransactionType {
  MILESTONE_REWARD = 'MILESTONE_REWARD',
  WEEKLY_REWARD = 'WEEKLY_REWARD',
  TIP_RECEIVED = 'TIP_RECEIVED',
  TIP_SENT = 'TIP_SENT',
  SKILL_PAYMENT_RECEIVED = 'SKILL_PAYMENT_RECEIVED',
  SKILL_PAYMENT_SENT = 'SKILL_PAYMENT_SENT',
  WITHDRAWAL = 'WITHDRAWAL',
  DEPOSIT = 'DEPOSIT',
  POINTS_PURCHASE = 'POINTS_PURCHASE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface Wallet {
  id: string;
  userId: string;
  balanceNGN: number;
  balanceUSD: number;
  fipplePoints: number;
  totalEarned: number;
  totalWithdrawn: number;
  bankName?: string;
  accountNumber?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  description: string;
  reference: string;
  createdAt: Date;
}

// ============================================================================
// CAMPUS HUB TYPES
// ============================================================================

export interface CampusHub {
  id: string;
  name: string;
  shortName?: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  state: string;
  city: string;
  isVerified: boolean;
  studentCount: number;
  postsCount: number;
  createdAt: Date;
}

// ============================================================================
// SKILL EXCHANGE TYPES
// ============================================================================

export enum SkillCategory {
  GRAPHICS_DESIGN = 'GRAPHICS_DESIGN',
  TUTORING = 'TUTORING',
  WRITING = 'WRITING',
  PROGRAMMING = 'PROGRAMMING',
  VIDEO_EDITING = 'VIDEO_EDITING',
  PHOTOGRAPHY = 'PHOTOGRAPHY',
  MUSIC_PRODUCTION = 'MUSIC_PRODUCTION',
  FASHION_DESIGN = 'FASHION_DESIGN',
  EVENT_PLANNING = 'EVENT_PLANNING',
  SOCIAL_MEDIA_MANAGEMENT = 'SOCIAL_MEDIA_MANAGEMENT',
  OTHER = 'OTHER',
}

export interface SkillListing {
  id: string;
  userId: string;
  user?: User;
  title: string;
  description: string;
  category: SkillCategory;
  priceMin: number;
  priceMax?: number;
  currency: string;
  deliveryTime: string;
  portfolio: string[];
  viewsCount: number;
  ordersCount: number;
  rating?: number;
  createdAt: Date;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

export interface SkillOrder {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  description: string;
  agreedPrice: number;
  status: OrderStatus;
  createdAt: Date;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export enum NotificationType {
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  NEW_LIKE = 'NEW_LIKE',
  NEW_COMMENT = 'NEW_COMMENT',
  NEW_SHARE = 'NEW_SHARE',
  NEW_TIP = 'NEW_TIP',
  MILESTONE_ACHIEVED = 'MILESTONE_ACHIEVED',
  REWARD_DISBURSED = 'REWARD_DISBURSED',
  SKILL_ORDER = 'SKILL_ORDER',
  MENTION = 'MENTION',
  CAMPUS_HUB_UPDATE = 'CAMPUS_HUB_UPDATE',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  displayName: string;
  campusId?: string;
  dateOfBirth?: string;
}

export interface CreatePostRequest {
  contentType: ContentType;
  caption?: string;
  mediaUrls?: string[];
  mediaTypes?: string[];
  tags?: string[];
  hashtags?: string[];
  campusHubId?: string;
  expiresAt?: Date; // For stories
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  campusId?: string;
  lowDataMode?: boolean;
  darkMode?: boolean;
}

export interface TipRequest {
  postId: string;
  amount: number;
  message?: string;
}

export interface WithdrawalRequest {
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

// ============================================================================
// FEED ALGORITHM TYPES
// ============================================================================

export interface FeedParams {
  page?: number;
  pageSize?: number;
  contentType?: ContentType;
  campusHubId?: string;
  userId?: string; // For user-specific feeds
  sortBy?: 'recent' | 'trending' | 'top';
}

export interface PostScore {
  postId: string;
  recencyScore: number;
  culturalScore: number;
  engagementScore: number;
  totalScore: number;
}

// ============================================================================
// LEADERBOARD TYPES
// ============================================================================

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  user: User;
  engagementScore: number;
  newFollowers: number;
  totalViews: number;
  totalComments: number;
  prizeAmount?: number;
}

export interface WeeklyLeaderboard {
  weekNumber: number;
  year: number;
  entries: LeaderboardEntry[];
  totalPrizePool: number;
}

// ============================================================================
// ADMIN & ANALYTICS TYPES
// ============================================================================

export interface SystemAnalytics {
  totalUsers: number;
  activeUsers: number; // DAU
  totalPosts: number;
  totalTransactions: number;
  totalRevenue: number;
  newUsersToday: number;
  newUsersThisWeek: number;
}

export interface UserMetrics {
  userId: string;
  postsCount: number;
  followersGrowth: number;
  engagementRate: number;
  totalEarnings: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SERVER_ERROR = 'SERVER_ERROR',
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: any;
}
