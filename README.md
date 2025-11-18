# Fiple: The Future of African Social

**Connect. Create. Hustle.**

A mobile-first social media platform built for Nigerian students and young community with a cash reward system for creators.

## 🚀 Project Structure

```
Fiple/
├── backend/          # Next.js API Backend
│   ├── app/api/     # API Routes
│   ├── lib/         # Utilities, Auth, Rewards Logic
│   └── prisma/      # Database Schema
├── mobile/          # React Native (Expo) App
│   ├── src/
│   │   ├── api/     # API Client & Services
│   │   ├── screens/ # App Screens
│   │   ├── store/   # State Management (Zustand)
│   │   └── components/
│   ├── app.json     # Expo Configuration
│   └── eas.json     # Build Configuration
└── shared/          # Shared Types (Backend & Mobile)
    └── types/
```

## 🎯 Key Features Implemented

### Core Platform Features
- ✅ **Authentication System** - Login/Register with JWT
- ✅ **Feed Algorithm** - Cultural relevance scoring (50% Recency, 30% Cultural, 20% Engagement)
- ✅ **Content Management** - Posts, Reels, Stories
- ✅ **Social Features** - Like, Comment, Share, Follow
- ✅ **Wallet System** - Track earnings and points
- ✅ **Reward Milestone Tracking** - Automatic tier detection and payouts

### Reward System (Core to Fiple)
- ✅ **5 Milestone Tiers** - Freshman to Alumnus (₦50k to ₦1M)
- ✅ **Automatic Milestone Detection** - Triggers on follower/like/share milestones
- ✅ **Weekly Top Creator Leaderboard** - ₦1M prize pool split among top 3
- ✅ **Transaction Ledger** - Full audit trail of all rewards

### Mobile App
- ✅ **Cross-Platform** - iOS, Android, and Web from single codebase
- ✅ **Bottom Tab Navigation** - Home, Rewards, Create, Wallet, Profile
- ✅ **Real-time Feed** - Pull-to-refresh, infinite scroll
- ✅ **Milestone Progress Tracking** - Visual progress bars for next tier

## 📱 Mobile App Deployment

### Prerequisites
- Node.js 18+ installed
- Expo CLI installed (`npm install -g expo-cli`)
- **For iOS:** Mac with Xcode 14+
- **For Android:** Android Studio with SDK 33+
- EAS CLI installed (`npm install -g eas-cli`)

### Setup Mobile App

```bash
cd mobile
npm install
```

### Run on Simulator/Emulator

```bash
# iOS Simulator (Mac only)
npm run ios

# Android Emulator
npm run android

# Web Browser
npm run web

# Development with Expo Go app
npx expo start
```

### Building for Production

#### 1. Configure EAS Build

```bash
cd mobile
eas login
eas init
```

Update `eas.json` with your project settings.

#### 2. Build for iOS (App Store)

```bash
# Generate iOS build
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

**iOS Requirements:**
- Apple Developer Account ($99/year)
- Xcode installed on Mac
- Update `app.json`:
  - Set `bundleIdentifier` (e.g., `com.yourcompany.fiple`)
  - Add App Store credentials in `eas.json`

#### 3. Build for Android (Play Store)

```bash
# Generate Android App Bundle
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

**Android Requirements:**
- Google Play Developer Account ($25 one-time)
- Update `app.json`:
  - Set `package` name (e.g., `com.yourcompany.fiple`)
  - Update `versionCode`
- Create service account key for Play Store submission

#### 4. Build for Web

```bash
cd mobile
npx expo export:web
```

Deploy the `web-build` folder to any static hosting (Vercel, Netlify, etc.)

### Android Studio Deployment (As Requested)

To build and deploy using Android Studio:

1. **Generate Native Android Project:**
```bash
cd mobile
npx expo prebuild --platform android
```

2. **Open in Android Studio:**
   - Open `android/` folder in Android Studio
   - Wait for Gradle sync
   - Configure signing in `android/app/build.gradle`

3. **Build APK/Bundle:**
   - Build > Generate Signed Bundle / APK
   - Choose "Android App Bundle" for Play Store
   - Or choose "APK" for direct distribution

4. **Upload to Play Store:**
   - Open Play Console
   - Create new app
   - Upload the `.aab` file
   - Complete store listing
   - Submit for review

## 🖥️ Backend Deployment

### Prerequisites
- PostgreSQL database (Supabase recommended)
- Node.js 18+
- Prisma CLI

### Setup Backend

```bash
cd backend
npm install
```

### Configure Environment

Create `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/fiple"

# JWT
JWT_SECRET="your-secret-key"

# Payment Gateways
PAYSTACK_SECRET_KEY="sk_live_xxx"
PAYSTACK_PUBLIC_KEY="pk_live_xxx"

# Reward Pool Settings
WEEKLY_REWARD_POOL_NGN="1000000"
MIN_ACTIVE_USERS_FOR_POOL="100000"

# Milestone Rewards (NGN)
TIER_1_REWARD="50000"
TIER_2_REWARD="150000"
TIER_3_REWARD="300000"
TIER_4_REWARD="500000"
TIER_5_REWARD="1000000"
```

### Database Setup

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed
```

### Run Backend

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Deploy Backend

**Recommended Platforms:**

1. **Vercel** (Easiest):
```bash
cd backend
vercel deploy --prod
```

2. **Railway/Render:**
   - Connect GitHub repo
   - Set environment variables
   - Deploy automatically

3. **AWS/DigitalOcean:**
   - Set up Node.js server
   - Install dependencies
   - Run with PM2: `pm2 start npm --name "fiple-api" -- start`

## 🗄️ Database (PostgreSQL)

### Recommended: Supabase

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy connection string to `DATABASE_URL`
4. Run Prisma migrations
5. Enable Row Level Security (RLS) for production

### Self-Hosted PostgreSQL

```bash
# Install PostgreSQL
# Create database
createdb fiple

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/fiple"
```

## 🔄 Cron Jobs (Important!)

The reward system needs scheduled jobs:

### Weekly Leaderboard Calculation

Add cron job to run every Monday at midnight:

```bash
# In backend/lib/rewards.ts
import { calculateWeeklyLeaderboard } from './lib/rewards';

// Run weekly
calculateWeeklyLeaderboard();
```

**Setup with Vercel Cron:**
```json
{
  "crons": [{
    "path": "/api/cron/weekly-rewards",
    "schedule": "0 0 * * 1"
  }]
}
```

### Post Score Updates

Run every 15 minutes:

```bash
import { updateAllPostScores } from './lib/feed-algorithm';
updateAllPostScores();
```

## 💰 Payment Integration

### Paystack (Nigerian Payments)

1. Sign up at [paystack.com](https://paystack.com)
2. Get API keys from Dashboard
3. Add to `.env`:
```env
PAYSTACK_SECRET_KEY="sk_live_xxx"
PAYSTACK_PUBLIC_KEY="pk_live_xxx"
```

4. Set up webhooks for payment confirmation
5. Update withdrawal logic in `backend/app/api/wallet/withdraw/route.ts`

### Stripe (International)

Similar setup for international payments.

## 🎨 Customization

### Brand Colors

Update in:
- `mobile/app.json` - Splash/icon background
- Mobile screens - `#6366f1` (Indigo 500)
- Backend - No changes needed

### App Icons & Splash Screen

1. Design 1024x1024 icon
2. Replace `mobile/assets/icon.png`
3. Replace `mobile/assets/splash-icon.png`
4. Run: `npx expo prebuild`

## 🧪 Testing

### Backend API
```bash
cd backend
npm test
```

### Mobile App
```bash
cd mobile
npm test
```

### Manual Testing
- Test on iOS Simulator
- Test on Android Emulator
- Test on real devices
- Test payment flows in sandbox mode

## 📊 Monitoring

### Error Tracking
Add Sentry:
```bash
npm install @sentry/react-native
```

### Analytics
Add to mobile app:
- Google Analytics
- Mixpanel
- Firebase Analytics

## 🔐 Security Checklist

- [ ] Change all default secrets in `.env`
- [ ] Enable HTTPS on backend
- [ ] Set up rate limiting
- [ ] Enable Prisma Row-Level Security
- [ ] Validate all user inputs
- [ ] Test payment flows
- [ ] Set up backup strategy for database

## 📞 Support

For issues or questions:
- Check documentation
- Review code comments
- Test in development mode first

## 📝 Next Steps

After deployment:

1. **Content Moderation** - Add admin panel for flagged content
2. **Push Notifications** - Implement with Expo Notifications
3. **Campus Hub Verification** - Build verification flow
4. **Skill Exchange Marketplace** - Complete order fulfillment
5. **Analytics Dashboard** - Build admin analytics

## 🎉 Launch Checklist

- [ ] Backend deployed and running
- [ ] Database migrated
- [ ] iOS app submitted to App Store
- [ ] Android app submitted to Play Store
- [ ] Web version deployed
- [ ] Payment gateways configured
- [ ] Cron jobs set up
- [ ] Monitoring enabled
- [ ] Security review completed
- [ ] Legal terms updated (Privacy Policy, Terms of Service)

---

**Built with:** Next.js, React Native (Expo), PostgreSQL, Prisma, TypeScript

**License:** Proprietary

**Version:** 1.0.0
