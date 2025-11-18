# Fiple Deployment Guide

Complete step-by-step guide for deploying Fiple to iOS, Android, and Web.

## 🎯 Quick Start (5 Minutes)

### 1. Backend Setup

```bash
# Install dependencies
cd backend
npm install

# Setup database
cp .env.example .env
# Edit .env with your database URL

# Run migrations
npx prisma generate
npx prisma migrate deploy

# Start backend
npm run dev
```

Backend will run on `http://localhost:3000`

### 2. Mobile App Setup

```bash
# Install dependencies
cd mobile
npm install

# Start Expo development server
npx expo start
```

Press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web browser

## 📱 iOS Deployment (Mac Required)

### Prerequisites
- Mac with macOS 12+
- Xcode 14+ installed from App Store
- Apple Developer Account ($99/year)
- EAS CLI: `npm install -g eas-cli`

### Step 1: Configure iOS Bundle ID

Edit `mobile/app.json`:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.fiple"
    }
  }
}
```

### Step 2: Login to EAS

```bash
cd mobile
eas login
```

### Step 3: Configure EAS Project

```bash
eas init
```

This creates/links your Expo project.

### Step 4: Build iOS App

```bash
# Build for App Store
eas build --platform ios --profile production

# Or build for TestFlight testing
eas build --platform ios --profile preview
```

Wait 10-20 minutes for build to complete. You'll get a download link.

### Step 5: Submit to App Store

```bash
eas submit --platform ios
```

You'll need:
- Apple ID
- App-specific password
- App Store Connect app created

**Alternative: Manual Xcode Deployment**

```bash
# Generate native iOS project
npx expo prebuild --platform ios

# Open in Xcode
open ios/mobile.xcworkspace

# In Xcode:
# 1. Select your team in Signing & Capabilities
# 2. Archive the app (Product > Archive)
# 3. Distribute to App Store
```

## 🤖 Android Deployment

### Prerequisites
- Android Studio installed
- Google Play Developer Account ($25 one-time)
- Java JDK 11+

### Method 1: EAS Build (Recommended)

#### Step 1: Configure Android Package

Edit `mobile/app.json`:
```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.fiple",
      "versionCode": 1
    }
  }
}
```

#### Step 2: Build Android App Bundle

```bash
cd mobile

# Build for Play Store (AAB format)
eas build --platform android --profile production

# Or build APK for direct install
eas build --platform android --profile preview
```

#### Step 3: Submit to Play Store

```bash
eas submit --platform android
```

You'll need:
- Google Play Console access
- Service account JSON key

### Method 2: Android Studio Build (As Requested)

This method lets you build and deploy directly from Android Studio.

#### Step 1: Generate Android Project

```bash
cd mobile

# Generate native Android code
npx expo prebuild --platform android
```

This creates an `android/` folder with full Android project.

#### Step 2: Open in Android Studio

1. Launch Android Studio
2. **File > Open**
3. Navigate to `Fiple/mobile/android`
4. Click **OK**
5. Wait for Gradle sync (can take 5-10 minutes first time)

#### Step 3: Configure Signing

1. In Android Studio, go to **Build > Generate Signed Bundle / APK**
2. Select **Android App Bundle** (for Play Store) or **APK**
3. Click **Create new keystore**:
   - Location: `mobile/android/app/release.keystore`
   - Password: (create a strong password)
   - Alias: `fiple-release`
   - Validity: 25+ years

**Save these credentials!** You'll need them for all future builds.

#### Step 4: Configure build.gradle

Edit `mobile/android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            if (project.hasProperty('FIPLE_UPLOAD_STORE_FILE')) {
                storeFile file(FIPLE_UPLOAD_STORE_FILE)
                storePassword FIPLE_UPLOAD_STORE_PASSWORD
                keyAlias FIPLE_UPLOAD_KEY_ALIAS
                keyPassword FIPLE_UPLOAD_KEY_PASSWORD
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

Create `mobile/android/gradle.properties`:
```properties
FIPLE_UPLOAD_STORE_FILE=./app/release.keystore
FIPLE_UPLOAD_STORE_PASSWORD=your_password
FIPLE_UPLOAD_KEY_ALIAS=fiple-release
FIPLE_UPLOAD_KEY_PASSWORD=your_password
```

**Important:** Add to `.gitignore`:
```
android/gradle.properties
android/app/release.keystore
```

#### Step 5: Build APK/AAB in Android Studio

1. **Build > Generate Signed Bundle / APK**
2. Select **Android App Bundle** (for Play Store)
3. Choose existing keystore (the one you just created)
4. Enter passwords
5. Select **release** build variant
6. Click **Finish**

Build will be in `mobile/android/app/release/`:
- `app-release.aab` (for Play Store)
- or `app-release.apk` (for direct install)

#### Step 6: Upload to Google Play Console

1. Go to [play.google.com/console](https://play.google.com/console)
2. Create new app
3. Complete store listing:
   - App name: **Fiple**
   - Short description: "Connect. Create. Hustle."
   - Full description: (copy from README)
   - Screenshots: Upload 2-8 screenshots
   - Icon: 512x512 PNG
   - Feature graphic: 1024x500 PNG

4. **Production > Create new release**
5. Upload `app-release.aab`
6. Fill out release notes
7. **Review and rollout**

### Testing APK on Device

```bash
# Install on connected device
cd mobile/android
./gradlew installRelease

# Or drag APK onto device/emulator
```

## 🌐 Web Deployment

### Build for Web

```bash
cd mobile
npx expo export:web
```

This creates `web-build/` folder with static files.

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd mobile/web-build
vercel deploy --prod
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd mobile/web-build
netlify deploy --prod
```

### Deploy to Firebase Hosting

```bash
firebase init hosting
firebase deploy
```

## 🖥️ Backend Deployment

### Option 1: Vercel (Recommended)

```bash
cd backend
npm install -g vercel
vercel deploy --prod
```

Set environment variables in Vercel dashboard.

### Option 2: Railway

1. Go to [railway.app](https://railway.app)
2. New Project > Deploy from GitHub
3. Select `Fiple` repository
4. Set root directory to `backend`
5. Add environment variables
6. Deploy

### Option 3: DigitalOcean

```bash
# Create droplet (Ubuntu 22.04)
# SSH into droplet

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repo
git clone https://github.com/yourorg/Fiple.git
cd Fiple/backend

# Install dependencies
npm install

# Setup environment
nano .env
# Paste your environment variables

# Generate Prisma
npx prisma generate
npx prisma migrate deploy

# Build
npm run build

# Start with PM2
pm2 start npm --name "fiple-api" -- start
pm2 save
pm2 startup
```

### Option 4: AWS EC2

Similar to DigitalOcean, but with AWS-specific setup.

## 🗄️ Database Setup

### Supabase (Recommended)

1. Create account at [supabase.com](https://supabase.com)
2. New Project > Choose region
3. Copy connection string
4. Update `DATABASE_URL` in backend `.env`
5. Run migrations:
```bash
cd backend
npx prisma migrate deploy
```

### Self-Hosted PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql

# Create database
sudo -u postgres createdb fiple

# Create user
sudo -u postgres createuser fiple_user -P

# Grant permissions
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE fiple TO fiple_user;

# Connection string
DATABASE_URL="postgresql://fiple_user:password@localhost:5432/fiple"
```

## 🔧 Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://..."

# JWT
JWT_SECRET="random-64-character-string"
JWT_EXPIRES_IN="7d"

# API URLs
NEXT_PUBLIC_API_URL="https://your-api.vercel.app"
NEXT_PUBLIC_APP_URL="https://your-app.com"

# Paystack (Nigerian payments)
PAYSTACK_SECRET_KEY="sk_live_..."
PAYSTACK_PUBLIC_KEY="pk_live_..."

# Stripe (International payments)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLIC_KEY="pk_live_..."

# Reward Settings
WEEKLY_REWARD_POOL_NGN="1000000"
MIN_ACTIVE_USERS_FOR_POOL="100000"

TIER_1_REWARD="50000"
TIER_2_REWARD="150000"
TIER_3_REWARD="300000"
TIER_4_REWARD="500000"
TIER_5_REWARD="1000000"

# Email (SendGrid)
SENDGRID_API_KEY="SG...."
EMAIL_FROM="noreply@fiple.com"

# SMS (Africa's Talking)
AFRICAS_TALKING_API_KEY="..."
AFRICAS_TALKING_USERNAME="..."

# Environment
NODE_ENV="production"
```

### Mobile (Update API URL)

Edit `mobile/src/api/client.ts`:

```typescript
const API_URL = 'https://your-backend.vercel.app/api';
```

## 📊 Post-Deployment

### 1. Test Payment Flows

```bash
# Use test keys initially
PAYSTACK_SECRET_KEY="sk_test_..."
```

Test:
- Milestone reward payout
- Withdrawal request
- Points purchase

### 2. Setup Cron Jobs

For weekly rewards and feed scoring:

**Vercel cron:**
Create `backend/vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-rewards",
      "schedule": "0 0 * * 1"
    },
    {
      "path": "/api/cron/update-scores",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

### 3. Enable Monitoring

- Set up Sentry for error tracking
- Add Google Analytics
- Monitor database performance
- Set up uptime monitoring (UptimeRobot)

### 4. Security

- [ ] Change all default secrets
- [ ] Enable CORS properly
- [ ] Set up rate limiting
- [ ] Enable database backups
- [ ] Review authentication flows

## 🚨 Troubleshooting

### Build Errors

**"Could not find Prisma Client"**
```bash
npx prisma generate
```

**"Gradle build failed"**
```bash
cd mobile/android
./gradlew clean
./gradlew build
```

**"Metro bundler error"**
```bash
cd mobile
rm -rf node_modules
npm install
npx expo start -c
```

### Deployment Issues

**API not connecting:**
- Check CORS settings
- Verify environment variables
- Check network logs in mobile app

**Database connection failed:**
- Verify DATABASE_URL
- Check database is running
- Test connection string

## 📞 Support

If you encounter issues:
1. Check error logs
2. Review environment variables
3. Test in development mode
4. Check network connectivity
5. Verify all services are running

---

**Next:** See [README.md](README.md) for full feature documentation.
