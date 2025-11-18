# FIPLE STAGING DEPLOYMENT GUIDE

## 📋 OVERVIEW

This guide provides step-by-step instructions for deploying the Fiple platform to a staging environment for testing before production launch.

**Components:**
- Backend API (Node.js/Express)
- Mobile App (React Native/Expo)
- Database (PostgreSQL)
- Redis Cache
- File Storage (AWS S3 or similar)

**Deployment Targets:**
- **Backend:** Staging server (VPS, AWS, or Heroku)
- **Mobile:** Expo EAS Build + TestFlight/Google Play Beta
- **Database:** Managed PostgreSQL (AWS RDS, Railway, etc.)

---

## 🎯 PRE-DEPLOYMENT CHECKLIST

### **1. Environment Preparation**
- [ ] Staging server provisioned (2GB+ RAM, 20GB+ storage)
- [ ] Domain/subdomain configured (api-staging.fiple.com)
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] Database created (PostgreSQL 14+)
- [ ] Redis instance provisioned
- [ ] S3 bucket created (or alternative storage)
- [ ] Email service configured (SendGrid, AWS SES)
- [ ] Payment gateway sandbox configured (Paystack test mode)

### **2. Accounts & Credentials**
- [ ] Expo account created
- [ ] Apple Developer account (for iOS TestFlight)
- [ ] Google Play Console account (for Android Beta)
- [ ] Cloud provider accounts (AWS, Railway, etc.)
- [ ] Third-party service accounts (SendGrid, Cloudinary, etc.)

### **3. Code Preparation**
- [ ] All features completed and merged
- [ ] Unit tests passing
- [ ] TypeScript compilation successful
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] Seed data prepared (test accounts)

---

## 🖥️ BACKEND DEPLOYMENT

### **STEP 1: Server Setup**

#### **Option A: VPS (Ubuntu 22.04)**

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 4. Install Redis
sudo apt install -y redis-server

# 5. Install Nginx (reverse proxy)
sudo apt install -y nginx

# 6. Install Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx

# 7. Install PM2 (process manager)
sudo npm install -g pm2

# 8. Create deployment user
sudo adduser fiple
sudo usermod -aG sudo fiple
```

#### **Option B: Railway (PaaS)**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Create new project
railway init

# 4. Add PostgreSQL service
railway add postgresql

# 5. Add Redis service
railway add redis
```

#### **Option C: Heroku (PaaS)**

```bash
# 1. Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# 2. Login
heroku login

# 3. Create app
heroku create fiple-staging

# 4. Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# 5. Add Redis addon
heroku addons:create heroku-redis:mini
```

---

### **STEP 2: Environment Variables**

Create `.env.staging` file in backend root:

```env
# App Configuration
NODE_ENV=staging
PORT=3000
APP_URL=https://api-staging.fiple.com
FRONTEND_URL=https://staging.fiple.com

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/fiple_staging
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis Cache
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=30d

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=fiple-staging-uploads

# OR Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Service (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@fiple.com
EMAIL_FROM_NAME=Fiple

# Payment Gateway (Paystack)
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key

# Push Notifications
FCM_SERVER_KEY=your_firebase_server_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
CORS_ORIGIN=https://staging.fiple.com,exp://192.168.*.*:*
BCRYPT_ROUNDS=10

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn
```

---

### **STEP 3: Database Setup**

```bash
# 1. Connect to PostgreSQL
psql -U postgres

# 2. Create database
CREATE DATABASE fiple_staging;

# 3. Create user
CREATE USER fiple_user WITH ENCRYPTED PASSWORD 'your_secure_password';

# 4. Grant privileges
GRANT ALL PRIVILEGES ON DATABASE fiple_staging TO fiple_user;

# 5. Exit psql
\q

# 6. Run migrations (from backend directory)
npm run migrate:staging

# 7. Seed test data
npm run seed:staging
```

---

### **STEP 4: Deploy Backend**

#### **Option A: VPS Deployment**

```bash
# 1. Clone repository on server
cd /home/fiple
git clone https://github.com/your-org/fiple.git
cd fiple/backend

# 2. Install dependencies
npm ci --production

# 3. Build TypeScript
npm run build

# 4. Copy environment file
cp .env.staging .env

# 5. Start with PM2
pm2 start dist/index.js --name fiple-api
pm2 save
pm2 startup

# 6. Configure Nginx reverse proxy
sudo nano /etc/nginx/sites-available/fiple-staging

# Nginx config:
server {
    listen 80;
    server_name api-staging.fiple.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 7. Enable site
sudo ln -s /etc/nginx/sites-available/fiple-staging /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 8. Setup SSL with Let's Encrypt
sudo certbot --nginx -d api-staging.fiple.com
```

#### **Option B: Railway Deployment**

```bash
# 1. Link to project
railway link

# 2. Set environment variables
railway variables set NODE_ENV=staging
# ... (set all other env vars)

# 3. Deploy
railway up
```

#### **Option C: Heroku Deployment**

```bash
# 1. Add buildpack
heroku buildpacks:add heroku/nodejs -a fiple-staging

# 2. Set environment variables
heroku config:set NODE_ENV=staging -a fiple-staging
# ... (set all other env vars)

# 3. Deploy
git push heroku main

# 4. Run migrations
heroku run npm run migrate:staging -a fiple-staging

# 5. Seed data
heroku run npm run seed:staging -a fiple-staging
```

---

### **STEP 5: Verify Backend Deployment**

```bash
# 1. Check health endpoint
curl https://api-staging.fiple.com/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-18T..."}

# 2. Test authentication
curl -X POST https://api-staging.fiple.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@fiple.com","password":"test123"}'

# Expected: JWT token in response

# 3. Check logs
pm2 logs fiple-api  # VPS
railway logs        # Railway
heroku logs --tail -a fiple-staging  # Heroku
```

---

## 📱 MOBILE APP DEPLOYMENT

### **STEP 1: Configure App for Staging**

Update `mobile/app.json`:

```json
{
  "expo": {
    "name": "Fiple (Staging)",
    "slug": "fiple-staging",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon-staging.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#10B981"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.fiple.staging",
      "buildNumber": "1.0.0",
      "infoPlist": {
        "NSCameraUsageDescription": "Fiple needs camera access for posts and streams",
        "NSMicrophoneUsageDescription": "Fiple needs microphone access for live streams",
        "NSPhotoLibraryUsageDescription": "Fiple needs photo access to upload images"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#10B981"
      },
      "package": "com.fiple.staging",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "RECORD_AUDIO",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "extra": {
      "eas": {
        "projectId": "your-expo-project-id"
      }
    }
  }
}
```

---

### **STEP 2: Configure Environment**

Create `mobile/.env.staging`:

```env
EXPO_PUBLIC_API_URL=https://api-staging.fiple.com
EXPO_PUBLIC_ENV=staging
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_key
```

---

### **STEP 3: Setup EAS Build**

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Configure EAS Build
eas build:configure

# 4. Create eas.json
```

Create `mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "staging": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api-staging.fiple.com",
        "EXPO_PUBLIC_ENV": "staging"
      },
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.fiple.com",
        "EXPO_PUBLIC_ENV": "production"
      }
    }
  },
  "submit": {
    "staging": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

---

### **STEP 4: Build for iOS (TestFlight)**

```bash
# 1. Ensure you have Apple Developer account
# 2. Create app in App Store Connect
# 3. Create identifiers and profiles

# 4. Build for iOS
eas build --platform ios --profile staging

# Wait for build to complete (10-20 minutes)

# 5. Submit to TestFlight
eas submit --platform ios --profile staging

# 6. Wait for Apple review (~24 hours)
# 7. Add testers in App Store Connect
# 8. Testers receive TestFlight invite
```

---

### **STEP 5: Build for Android (Google Play Beta)**

```bash
# 1. Create app in Google Play Console
# 2. Setup closed testing track

# 3. Create service account JSON
# - Go to Google Cloud Console
# - Create service account
# - Download JSON key
# - Save as mobile/google-service-account.json

# 4. Build for Android
eas build --platform android --profile staging

# Wait for build to complete (10-20 minutes)

# 5. Submit to Google Play Beta
eas submit --platform android --profile staging

# 6. Wait for Google review (~few hours)
# 7. Add tester emails in Play Console
# 8. Testers receive access link
```

---

### **STEP 6: Alternative - Direct APK Distribution**

If you want faster testing without app store review:

```bash
# 1. Build APK
eas build --platform android --profile staging

# 2. Download APK from Expo dashboard
# Or use direct link from build output

# 3. Distribute via:
# - Email
# - Cloud storage (Google Drive, Dropbox)
# - Firebase App Distribution
# - TestFlight alternatives (Diawi, InstallOnAir)

# Note: iOS requires TestFlight or enterprise certificate
```

---

### **STEP 7: Verify Mobile Deployment**

#### **iOS Testing (TestFlight)**
1. Install TestFlight app from App Store
2. Accept invite email
3. Install Fiple (Staging)
4. Login with test account
5. Verify all features work

#### **Android Testing (Play Beta)**
1. Accept invite email
2. Opt-in to beta testing
3. Install from Play Store
4. Login with test account
5. Verify all features work

#### **Direct APK Testing**
1. Enable "Install from Unknown Sources"
2. Download and install APK
3. Login with test account
4. Verify all features work

---

## 🧪 POST-DEPLOYMENT TESTING

### **Backend Health Checks**

```bash
# 1. Health endpoint
curl https://api-staging.fiple.com/health

# 2. Database connectivity
curl https://api-staging.fiple.com/api/health/db

# 3. Redis connectivity
curl https://api-staging.fiple.com/api/health/redis

# 4. S3/Storage connectivity
curl https://api-staging.fiple.com/api/health/storage

# 5. Email service
curl https://api-staging.fiple.com/api/health/email
```

---

### **Mobile App Smoke Tests**

Run these quick tests immediately after deployment:

1. **Authentication**
   - Register new account ✅
   - Login with test account ✅
   - Logout ✅

2. **Core Features**
   - View home feed ✅
   - Create post ✅
   - Search products ✅
   - Send message ✅

3. **Navigation**
   - All tabs accessible ✅
   - Deep links work ✅
   - Back navigation works ✅

4. **API Integration**
   - Data loads from staging API ✅
   - Images load from S3 ✅
   - Errors handled gracefully ✅

---

## 📊 MONITORING SETUP

### **1. Backend Monitoring**

#### **Application Monitoring (PM2)**
```bash
# Install PM2 Plus (optional, for web dashboard)
pm2 link your-secret-key your-public-key

# Monitor metrics
pm2 monit
```

#### **Error Tracking (Sentry)**
```bash
# Install Sentry SDK
npm install @sentry/node

# Configure in backend/src/app.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'staging',
});
```

#### **Logging**
```bash
# View logs
pm2 logs fiple-api --lines 100

# Or use log management service
# - Logtail
# - Papertrail
# - Datadog
```

---

### **2. Mobile App Monitoring**

#### **Expo Updates**
```bash
# Push OTA update without new build
eas update --branch staging --message "Bug fixes"
```

#### **Error Tracking**
```javascript
// Install Sentry for React Native
npm install @sentry/react-native

// Configure in mobile/App.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: 'staging',
});
```

---

## 🔐 SECURITY CHECKLIST

- [ ] Environment variables secured (not in git)
- [ ] SSL certificates valid
- [ ] Database uses strong password
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] JWT secrets are random and strong
- [ ] File uploads validated and sanitized
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize inputs)
- [ ] CSRF protection enabled
- [ ] Sensitive data encrypted at rest
- [ ] Secure headers configured (Helmet.js)
- [ ] Dependencies updated (npm audit)
- [ ] Staging not indexed by search engines

---

## 🚨 ROLLBACK PROCEDURE

### **Backend Rollback**

#### **VPS (PM2)**
```bash
# 1. Stop current version
pm2 stop fiple-api

# 2. Checkout previous version
cd /home/fiple/fiple
git checkout <previous-commit-hash>

# 3. Install dependencies
npm ci --production

# 4. Rebuild
npm run build

# 5. Restart
pm2 restart fiple-api
```

#### **Railway/Heroku**
```bash
# Railway
railway rollback

# Heroku
heroku rollback -a fiple-staging
```

---

### **Mobile App Rollback**

#### **Expo OTA Update**
```bash
# Revert to previous update
eas update --branch staging --message "Rollback" --republish
```

#### **TestFlight/Play Console**
- TestFlight: Cannot rollback, must submit new build
- Play Console: Can promote previous version from "Releases"

---

## 📝 DEPLOYMENT LOG TEMPLATE

```markdown
**Deployment Date:** 2025-11-18
**Deployed By:** [Your Name]
**Environment:** Staging

**Backend:**
- Commit: [git commit hash]
- Version: 1.0.0
- Server: api-staging.fiple.com
- Status: ✅ Deployed

**Mobile:**
- Build Number: 1.0.0 (1)
- iOS: ✅ TestFlight
- Android: ✅ Play Beta

**Database:**
- Migrations: ✅ Applied
- Seed Data: ✅ Loaded

**Tests:**
- Smoke Tests: ✅ Passed
- Health Checks: ✅ All OK

**Issues:**
- [List any issues encountered]

**Next Steps:**
- [ ] QA team notified
- [ ] Test accounts shared
- [ ] Begin E2E testing
```

---

## 🎯 STAGING ENVIRONMENT ACCESS

### **Test Accounts**

Create these test accounts with seed data:

```sql
-- General User
Email: user@test.fiple.com
Password: Test123!

-- Creator (5,000+ followers)
Email: creator@test.fiple.com
Password: Test123!

-- Merchant
Email: merchant@test.fiple.com
Password: Test123!

-- Affiliate
Email: affiliate@test.fiple.com
Password: Test123!

-- Admin
Email: admin@test.fiple.com
Password: Test123!

-- Business User
Email: business@test.fiple.com
Password: Test123!
```

---

### **API Access**

```
Base URL: https://api-staging.fiple.com
Documentation: https://api-staging.fiple.com/docs
Health: https://api-staging.fiple.com/health
```

---

### **Mobile App Access**

**iOS TestFlight:**
- Invite link: [Generated by TestFlight]
- Max testers: 10,000

**Android Play Beta:**
- Opt-in link: [Generated by Play Console]
- Max testers: Unlimited

---

## 📚 ADDITIONAL RESOURCES

- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [TestFlight Setup](https://developer.apple.com/testflight/)
- [Google Play Beta](https://support.google.com/googleplay/android-developer/answer/3131213)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Let's Encrypt SSL](https://letsencrypt.org/getting-started/)

---

## 🆘 TROUBLESHOOTING

### **Backend Won't Start**
```bash
# Check logs
pm2 logs fiple-api --err

# Common issues:
# - Port already in use: Change PORT in .env
# - Database connection: Check DATABASE_URL
# - Missing env vars: Verify .env file
# - Node version: Ensure Node 20.x
```

### **Mobile Build Fails**
```bash
# Check build logs in Expo dashboard
# Common issues:
# - Bundle identifier conflict
# - Invalid provisioning profile
# - Missing app.json configuration
# - expo-cli version mismatch
```

### **API Not Accessible**
```bash
# Check Nginx status
sudo systemctl status nginx

# Check firewall
sudo ufw status

# Check DNS
nslookup api-staging.fiple.com

# Check SSL
openssl s_client -connect api-staging.fiple.com:443
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-18
**Status:** Ready for Deployment
