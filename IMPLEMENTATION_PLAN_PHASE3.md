# FIPLE ADVANCED FEATURES IMPLEMENTATION PLAN
## Project Manager & Developer Review - Phase 3

---

## 📋 EXECUTIVE SUMMARY

This document outlines the implementation of critical marketplace, gaming, and content quality features to make Fiple a complete social commerce platform.

---

## 🎯 PHASE 1: FLEXIBLE CREATOR SUBSCRIPTIONS

### Current State
- Fixed 3-tier pricing: BASIC (₦500), PREMIUM (₦1K), VIP (₦2K)

### New Implementation
**Custom Subscription Pricing:**
- Creators set their own monthly pricing
- Minimum thresholds maintained:
  - BASIC: ₦300 minimum
  - PREMIUM: ₦800 minimum
  - VIP: ₦1,500 minimum
- Maximum: ₦10,000/month per tier
- Benefits customizable by creator

**Database Changes:**
```prisma
model CreatorSubscriptionSettings {
  id              String   @id @default(uuid())
  hostId          String   @unique

  // Custom pricing
  basicPrice      Float?   @default(500)
  premiumPrice    Float?   @default(1000)
  vipPrice        Float?   @default(2000)

  // Custom benefits (JSON)
  basicBenefits   Json?
  premiumBenefits Json?
  vipBenefits     Json?

  isEnabled       Boolean  @default(false)
}
```

---

## 🎮 PHASE 2: GAMING & BATTLES SYSTEM

### Battle Types
1. **PK Battles** (Player vs Player)
2. **Team Battles** (Team vs Team)
3. **Gift Wars** (Highest gifts wins)

### Features
**Battle Creation:**
- Host creates battle room
- Invite specific users or open invite
- Set battle duration (5, 10, 15 minutes)
- Set battle type and rules

**Battle Mechanics:**
- Split screen live streams
- Real-time gift counter
- Viewer voting system
- Live leaderboard
- Winner announcement with rewards

**Invitation System:**
- Private invite (by username)
- Challenge followers
- Open battle (anyone can join)
- Accept/Decline mechanics

**Battle Rewards:**
- Winner gets 60% of total gifts
- Runner-up gets 30%
- Platform keeps 10%
- Winner badge and XP boost

**Database Schema:**
```prisma
enum BattleType {
  PK_BATTLE
  TEAM_BATTLE
  GIFT_WAR
  TALENT_SHOWDOWN
}

enum BattleStatus {
  PENDING
  LIVE
  COMPLETED
  CANCELLED
}

model LiveBattle {
  id              String       @id @default(uuid())
  streamId        String
  battleType      BattleType
  status          BattleStatus @default(PENDING)

  // Participants
  host1Id         String
  host2Id         String?

  // Settings
  duration        Int          // minutes
  inviteType      String       // private, followers, open

  // Scores
  host1Score      Float        @default(0)
  host2Score      Float        @default(0)
  host1Gifts      Int          @default(0)
  host2Gifts      Int          @default(0)

  // Winner
  winnerId        String?
  prizePool       Float        @default(0)

  startedAt       DateTime?
  endedAt         DateTime?
  createdAt       DateTime     @default(now())
}
```

---

## 🛒 PHASE 3: FIPLE MARKETPLACE

### Core Marketplace Features

**Product Management:**
- Product listings with images, videos, specs
- Pricing, discounts, promo codes
- Inventory management
- Shipping fee calculation by location
- Multiple shipping options

**Shopping Experience:**
- Browse categories
- Search and filters
- Product details page
- Shopping cart
- Wishlist
- Order tracking
- Reviews and ratings

**Checkout Process:**
- Cart summary with discounts
- Shipping address
- Shipping method selection
- Payment integration (Paystack/Stripe)
- Order confirmation

**Database Schema:**
```prisma
model MerchantAccount {
  id              String   @id @default(uuid())
  userId          String   @unique

  // Business info
  businessName    String
  businessType    String   // Individual, LLC, Corporation
  businessEmail   String
  businessPhone   String

  // Verification
  isVerified      Boolean  @default(false)
  verificationDocs String[]

  // Bank details
  bankName        String?
  accountNumber   String?
  accountName     String?

  // Settings
  returnPolicy    String?  @db.Text
  shippingPolicy  String?  @db.Text

  // Metrics
  totalProducts   Int      @default(0)
  totalSales      Float    @default(0)
  totalOrders     Int      @default(0)
  rating          Float?
  reviewsCount    Int      @default(0)

  createdAt       DateTime @default(now())
}

model Product {
  id              String   @id @default(uuid())
  merchantId      String

  // Basic info
  name            String
  description     String   @db.Text
  category        String
  subcategory     String?
  brand           String?

  // Pricing
  price           Float
  compareAtPrice  Float?   // Original price for discount
  discountPercent Float?

  // Inventory
  stock           Int      @default(0)
  sku             String?  @unique

  // Media
  images          String[]
  videoUrl        String?

  // Specifications
  specifications  Json?

  // Shipping
  weight          Float?   // kg
  dimensions      Json?    // {length, width, height}
  shipsFrom       String?  // State/city

  // Promotion
  isFeatured      Boolean  @default(false)
  allowAffiliate  Boolean  @default(true)
  affiliateRate   Float    @default(10) // percentage

  // Status
  isActive        Boolean  @default(true)

  // Metrics
  viewsCount      Int      @default(0)
  salesCount      Int      @default(0)
  rating          Float?
  reviewsCount    Int      @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model ShoppingCart {
  id              String   @id @default(uuid())
  userId          String

  items           CartItem[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId])
}

model CartItem {
  id              String       @id @default(uuid())
  cartId          String
  productId       String
  quantity        Int          @default(1)

  cart            ShoppingCart @relation(fields: [cartId], references: [id])
  product         Product      @relation(fields: [productId], references: [id])
}

model Order {
  id              String       @id @default(uuid())
  orderNumber     String       @unique
  userId          String
  merchantId      String

  // Items
  items           Json         // Product details snapshot

  // Pricing
  subtotal        Float
  discount        Float        @default(0)
  shippingFee     Float
  tax             Float        @default(0)
  total           Float

  // Shipping
  shippingAddress Json
  shippingMethod  String
  trackingNumber  String?

  // Payment
  paymentMethod   String
  paymentRef      String       @unique
  paymentStatus   String       @default("PENDING")

  // Status
  status          OrderStatus  @default(PENDING)

  // Affiliate
  affiliateId     String?      // Content creator who referred
  affiliateEarning Float?

  // Dates
  paidAt          DateTime?
  shippedAt       DateTime?
  deliveredAt     DateTime?
  createdAt       DateTime     @default(now())
}

enum OrderStatus {
  PENDING
  PAID
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}
```

---

## 👥 PHASE 4: AFFILIATE/MARKETING SYSTEM

### Content Creator as Marketers

**Requirements:**
- Minimum 2,500 followers to qualify
- Apply to merchant's affiliate program
- Get approved by merchant

**Commission System:**
- Merchant sets commission rate (5%-30%)
- Creator promotes products during live streams
- Unique affiliate links and codes
- Track sales and earnings

**Live Stream Integration:**
- Product showcase overlay during live
- "Shop Now" button linked to product
- Real-time sales notifications
- Commission tracking dashboard

**Database Schema:**
```prisma
model AffiliateProgram {
  id              String   @id @default(uuid())
  merchantId      String

  // Settings
  isActive        Boolean  @default(true)
  commissionRate  Float    @default(10) // percentage
  minFollowers    Int      @default(2500)

  // Requirements
  requirements    String?  @db.Text
  termsConditions String?  @db.Text

  createdAt       DateTime @default(now())
}

model AffiliatePartnership {
  id              String   @id @default(uuid())
  creatorId       String
  merchantId      String

  // Status
  status          String   @default("PENDING") // PENDING, APPROVED, REJECTED, SUSPENDED

  // Performance
  totalSales      Float    @default(0)
  totalEarnings   Float    @default(0)
  totalOrders     Int      @default(0)

  // Affiliate link
  affiliateCode   String   @unique

  createdAt       DateTime @default(now())
  approvedAt      DateTime?

  @@unique([creatorId, merchantId])
}

model LiveProductShowcase {
  id              String   @id @default(uuid())
  streamId        String
  productId       String
  creatorId       String

  // Tracking
  views           Int      @default(0)
  clicks          Int      @default(0)
  sales           Int      @default(0)
  revenue         Float    @default(0)
  earnings        Float    @default(0)

  createdAt       DateTime @default(now())
}
```

---

## 🔍 PHASE 5: CONTENT ORIGINALITY DETECTION

### Detection Methods

**1. Watermark Detection (Image/Video)**
- AI-powered logo detection
- Known platform watermark database (TikTok, Instagram, YouTube, etc.)
- Automatic flagging

**2. Audio Fingerprinting**
- Detect copyrighted music
- Platform-specific audio signatures

**3. Duplicate Content Detection**
- Hash-based comparison
- Flag reposts and screen recordings

**4. Live Stream Monitoring**
- Real-time detection during live streams
- Auto-mute or warning for competing platform mentions
- Keyword blacklist: "TikTok", "Instagram Live", "YouTube", etc.

**Implementation:**
```prisma
model ContentOriginality {
  id              String   @id @default(uuid())
  contentId       String   // Post or Stream ID
  contentType     String   // POST, STREAM

  // Analysis
  hasWatermark    Boolean  @default(false)
  watermarkSource String?  // tiktok, instagram, youtube
  hasCopyrighted  Boolean  @default(false)
  copyrightSource String?

  // Duplicate detection
  isDuplicate     Boolean  @default(false)
  originalId      String?

  // Score (0-100, higher is more original)
  originalityScore Float   @default(100)

  // Actions
  isFlagged       Boolean  @default(false)
  isRestricted    Boolean  @default(false)
  restrictionType String?  // FYP_SUPPRESSED, HIDDEN, REMOVED

  analyzedAt      DateTime @default(now())
}

model PlatformMention {
  id              String   @id @default(uuid())
  streamId        String
  userId          String

  // Detection
  mentionedPlatform String // tiktok, instagram, youtube
  mentionContext    String // what was said
  timestamp         Int    // seconds into stream

  // Action
  warningIssued   Boolean  @default(false)
  viewersLost     Int      @default(0)

  createdAt       DateTime @default(now())
}
```

**Restrictions:**
- Posts with watermarks: Suppress from FYP
- Unoriginal content: Lower feed ranking
- Live streams: Warning system (3 strikes → stream muted)
- Competing platform mentions: Viewer count reduced temporarily

---

## 📚 PHASE 6: HELP & DOCUMENTATION SYSTEM

### Documentation Structure

**1. User Guides**
- Getting Started
- Creating Content
- Earning Money
- Safety & Privacy

**2. Content Creator Guide**
- Going Live
- Building Audience
- Monetization Strategies
- Affiliate Marketing
- Battle Guide

**3. Merchant Guide**
- Setting Up Shop
- Product Listings
- Order Management
- Affiliate Program Setup
- Analytics Dashboard

**4. Admin Dashboard**
- Platform Management
- Content Moderation
- User Management
- Financial Reports

**Database Schema:**
```prisma
model HelpArticle {
  id              String   @id @default(uuid())
  category        String   // USER, CREATOR, MERCHANT, ADMIN
  subcategory     String?

  title           String
  content         String   @db.Text

  // SEO
  slug            String   @unique
  keywords        String[]

  // Media
  coverImage      String?
  videoUrl        String?

  // Metadata
  viewsCount      Int      @default(0)
  helpfulCount    Int      @default(0)

  // Status
  isPublished     Boolean  @default(true)
  publishedAt     DateTime?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model SupportTicket {
  id              String   @id @default(uuid())
  ticketNumber    String   @unique
  userId          String
  userType        String   // USER, CREATOR, MERCHANT

  category        String
  subject         String
  description     String   @db.Text

  status          String   @default("OPEN")
  priority        String   @default("MEDIUM")

  assignedTo      String?

  createdAt       DateTime @default(now())
  resolvedAt      DateTime?
}
```

---

## 🚀 IMPLEMENTATION TIMELINE

### Week 1-2: Marketplace Foundation
- Merchant account system
- Product management
- Shopping cart and checkout

### Week 3-4: Affiliate System
- Creator qualification (2,500 followers)
- Affiliate partnerships
- Live stream product promotion
- Commission tracking

### Week 5-6: Gaming & Battles
- Battle system
- Invitation mechanics
- Prize distribution
- Battle analytics

### Week 7-8: Content Originality
- Watermark detection API integration
- Content analysis pipeline
- FYP suppression logic
- Live stream monitoring

### Week 9-10: Help & Support
- Documentation system
- Help center
- Support ticket system
- In-app guides

---

## 💰 REVENUE PROJECTIONS WITH NEW FEATURES

### Marketplace Revenue
- **Transaction Fee**: 5% per sale
- **At 100K users**: ₦50M monthly GMV → ₦2.5M platform fee
- **At 500K users**: ₦250M monthly GMV → ₦12.5M platform fee

### Battle System Revenue
- **Platform cut**: 10% of battle gifts
- **At 100K users**: ₦5M monthly from battles

### Flexible Subscriptions
- **Higher pricing flexibility** → 20% increase in subscription revenue
- **At 100K users**: ₦14.4M/month (up from ₦12M)

### Affiliate Commissions
- **Platform earns**: Small transaction fee (1-2%) on affiliate sales
- **At 100K users**: ₦1M monthly

**Total New Revenue: ₦21M/month at 100K users**

---

## ✅ SUCCESS METRICS

1. **Marketplace**
   - 500+ merchants in first 6 months
   - ₦10M GMV monthly by month 6
   - 80% order fulfillment rate

2. **Affiliate System**
   - 1,000+ qualified creators (2,500+ followers)
   - ₦5M affiliate sales monthly
   - 15% conversion rate

3. **Battles**
   - 100+ daily battles
   - 50K viewers per popular battle
   - 30% repeat battle participants

4. **Content Quality**
   - 90% original content on FYP
   - 50% reduction in watermarked content
   - 95% user satisfaction with content quality

---

## 🔒 COMPLIANCE & SAFETY

- **Age verification** for merchants
- **Product approval** process
- **Copyright protection** for creators
- **Payment security** (PCI compliance)
- **Data protection** (GDPR-compliant)

---

## 📊 IMPLEMENTATION PRIORITIES

**PRIORITY 1 (Critical):**
1. Marketplace infrastructure
2. Affiliate system
3. Content originality detection

**PRIORITY 2 (High):**
4. Flexible subscriptions
5. Help & documentation
6. Gaming & battles

**PRIORITY 3 (Medium):**
7. Advanced analytics
8. Enhanced seller tools
9. Battle tournaments

---

**END OF IMPLEMENTATION PLAN**
