# 🚀 Fiple Production Setup Guide

This guide walks you through setting up your Fiple mobile app for production deployment to the App Store and Google Play Store.

---

## ✅ Completed Setup (Already Done)

The following critical fixes have been implemented:

1. ✅ **Authentication Security**: Fixed authentication bypass vulnerability
2. ✅ **NativeWind TypeScript**: Configured for zero compilation errors
3. ✅ **Secure Token Storage**: Implemented expo-secure-store for encrypted token storage
4. ✅ **Environment-Based API URLs**: Configured dynamic API URLs via environment variables
5. ✅ **App Permissions**: Added all required iOS and Android permissions
6. ✅ **App Metadata**: Added description and privacy policy URL

---

## 📋 Remaining Configuration Steps

### Step 1: Create EAS Project

**What:** Initialize your Expo Application Services (EAS) project

**How:**
```bash
cd /home/user/Fiple/mobile
npx eas init
```

**What happens:**
- Creates an EAS project linked to your Expo account
- Updates `app.json` with your real project ID (replaces `YOUR_EAS_PROJECT_ID`)
- Sets up credentials for iOS and Android builds

**Time:** 5 minutes

---

### Step 2: Configure Environment Variables

**What:** Set up your API URL for different environments

**How:**

Create `.env.local` for local development:
```bash
# .env.local (for development - DO NOT commit)
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

For production builds, set in EAS:
```bash
# Production API URL
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://api.fiple.app
```

**Reference:** `.env.example` file already created with documentation

**Time:** 5 minutes

---

### Step 3: Create Privacy Policy and Terms of Service

**What:** Create legal documents required by App Store and Play Store

**Options:**

**Option A: Use Template (Fastest)**
1. Use generator: https://www.privacypolicygenerator.info/
2. Fill in:
   - App name: Fiple
   - Company name: Fiple Ltd (or your company)
   - Data collected: Email, name, location, camera/photos, user content
   - Analytics: (specify if you use Google Analytics, etc.)
   - Third-party services: Paystack (payments), Expo (infrastructure)

**Option B: Professional Legal Review (Recommended)**
- Hire a lawyer to review/create documents
- Ensure GDPR and CCPA compliance
- Estimated cost: $300-$1,000
- Time: 3-7 days

**Where to host:**
- Host at `https://fiple.app/privacy` and `https://fiple.app/terms`
- Update `app.json` privacy field (currently set to `https://fiple.app/privacy`)

**Time:** 2-6 hours (template) or 3-7 days (legal review)

---

### Step 4: Replace Placeholder Assets

**What:** Replace all placeholder app icons and create screenshots

**Required Assets:**

#### App Icon (1024x1024px, 32-bit RGBA PNG)
- Current: Placeholder dated "Oct 26, 1985" (8-bit indexed)
- Required: Production-quality icon
- Tools: Figma, Adobe Illustrator, Canva Pro
- Location: `mobile/assets/icon.png`

#### Adaptive Icon (Android)
- Foreground layer: 1024x1024px (transparent PNG)
- Background: Solid color or 1024x1024px image
- Location: `mobile/assets/adaptive-icon.png`

#### App Screenshots
**iOS Requirements:**
- 6.7" display (iPhone 14 Pro Max): 1290x2796px - 5-6 screenshots
- 6.5" display (iPhone 11 Pro Max): 1242x2688px - 5-6 screenshots
- 5.5" display (iPhone 8 Plus): 1242x2208px - 5-6 screenshots

**Android Requirements:**
- Phone: 1080x1920px minimum - 5-8 screenshots
- Tablet (optional): 1920x1080px - 3-5 screenshots
- Feature graphic: 1024x500px (required for Play Store listing)

**How to capture screenshots:**
```bash
# Run app in simulator
npx expo start --ios
# OR
npx expo start --android

# Capture screenshots of:
# 1. Login/Welcome screen
# 2. Home feed
# 3. Marketplace
# 4. Wallet/Rewards
# 5. Profile
# 6. Key feature (e.g., Live Battle, Skill Exchange)
```

**Tools:**
- iOS: Use Simulator > File > Save Screen (⌘S)
- Android: Use emulator screenshot button
- Polish: Figma, Sketch, or screenshot framing tools

**Time:** 3-6 hours (design + capture)

---

### Step 5: Configure Apple Developer Account

**What:** Set up iOS app submission credentials

**Prerequisites:**
- Apple Developer Account ($99/year)
- App created in App Store Connect

**How:**

1. **Create App in App Store Connect:**
   - Go to https://appstoreconnect.apple.com
   - Click "My Apps" > "+" > "New App"
   - Bundle ID: `com.fiple.app` (must match `app.json`)
   - App name: Fiple
   - Primary language: English

2. **Get your credentials:**
   ```bash
   # Your Apple ID: email used for developer account
   # ASC App ID: Found in App Store Connect > App Information > Apple ID (numeric)
   # Apple Team ID: Found in developer.apple.com > Membership > Team ID
   ```

3. **Update `eas.json`:**
   ```json
   {
     "submit": {
       "production": {
         "ios": {
           "appleId": "your-email@example.com",
           "ascAppId": "1234567890",
           "appleTeamId": "ABC123DEF4"
         }
       }
     }
   }
   ```

**Time:** 30 minutes (if account already exists)

---

### Step 6: Configure Google Play Console

**What:** Set up Android app submission credentials

**Prerequisites:**
- Google Play Developer Account ($25 one-time)
- App created in Play Console

**How:**

1. **Create App in Play Console:**
   - Go to https://play.google.com/console
   - Click "Create app"
   - App name: Fiple
   - Default language: English
   - App category: Social
   - Package name: `com.fiple.app` (must match `app.json`)

2. **Create Service Account:**
   - Go to Google Cloud Console > IAM & Admin > Service Accounts
   - Create service account with "Service Account User" role
   - Create JSON key
   - Download and save as `mobile/google-play-service-account.json`
   - **IMPORTANT:** Add to `.gitignore`!

3. **Grant permissions:**
   - Play Console > API access
   - Link service account
   - Grant "Release Manager" role

**Time:** 20 minutes

---

### Step 7: Complete App Store Listings

**iOS App Store:**
- App description (4,000 characters max)
- Keywords (100 characters, comma-separated)
- Screenshots (from Step 4)
- App icon (from Step 4)
- Privacy policy URL: `https://fiple.app/privacy`
- Support URL: `https://fiple.app/support`
- Marketing URL: `https://fiple.app`
- App category: Social Networking
- Content rating: 12+ (social features, user-generated content)

**Google Play Store:**
- App description (4,000 characters max)
- Short description (80 characters)
- Screenshots (from Step 4)
- Feature graphic (1024x500px)
- App icon (512x512px, extracted from 1024x1024)
- Privacy policy URL: `https://fiple.app/privacy`
- Category: Social
- Content rating: Complete questionnaire (likely T for Teen)

**Time:** 1-2 hours

---

## 🏗️ Build Process

### Development Build

```bash
cd /home/user/Fiple/mobile

# iOS development build
eas build --profile development --platform ios

# Android development build
eas build --profile development --platform android
```

### Preview Build (Internal Testing)

```bash
# iOS (TestFlight)
eas build --profile preview --platform ios

# Android (Internal testing track)
eas build --profile preview --platform android
```

### Production Build

```bash
# iOS (App Store)
eas build --profile production --platform ios

# Android (Play Store)
eas build --profile production --platform android

# Both platforms
eas build --profile production --platform all
```

---

## 📤 Submission Process

### iOS Submission

```bash
# Automatically submit to TestFlight (beta testing)
eas submit --platform ios --latest

# OR manually upload to App Store Connect:
# 1. Download .ipa from EAS dashboard
# 2. Use Xcode Transporter to upload
# 3. Create new version in App Store Connect
# 4. Fill in all metadata
# 5. Submit for review
```

**Review time:** 1-3 days typically

### Android Submission

```bash
# Automatically submit to Play Console
eas submit --platform android --latest

# OR manually upload:
# 1. Download .aab from EAS dashboard
# 2. Upload to Play Console > Production
# 3. Complete store listing
# 4. Submit for review
```

**Review time:** Usually same day to 3 days

---

## ✅ Pre-Submission Checklist

### Technical Requirements
- [ ] All TypeScript errors resolved (run `npm run type-check`)
- [ ] App builds successfully on EAS
- [ ] Tested on real iOS device
- [ ] Tested on real Android device
- [ ] All features work with production API
- [ ] Secure token storage verified
- [ ] Authentication flow works end-to-end
- [ ] Payment flows tested (Paystack test mode)
- [ ] Push notifications work
- [ ] Deep linking works

### Legal/Compliance
- [ ] Privacy policy hosted and accessible
- [ ] Terms of service hosted and accessible
- [ ] Privacy policy linked in app
- [ ] All permissions have usage descriptions
- [ ] GDPR compliance verified (if targeting EU)
- [ ] COPPA compliance verified (if allowing users under 13)

### App Store Assets
- [ ] Production app icon (1024x1024)
- [ ] iOS screenshots (all required sizes)
- [ ] Android screenshots
- [ ] Android feature graphic
- [ ] App description written
- [ ] Keywords/search terms defined
- [ ] Support email set up
- [ ] Marketing website live

### Configuration
- [ ] EAS project created (`eas init`)
- [ ] Environment variables configured
- [ ] Apple Developer credentials in `eas.json`
- [ ] Google Play service account configured
- [ ] App created in App Store Connect
- [ ] App created in Play Console

---

## 🐛 Common Issues

### Issue: "No bundle identifier found"
**Solution:** Ensure `ios.bundleIdentifier` in `app.json` matches App Store Connect

### Issue: "Missing privacy policy"
**Solution:** Host privacy policy and add URL to `app.json` and store listings

### Issue: "Build failed: Invalid credentials"
**Solution:** Run `eas credentials` to reset and reconfigure

### Issue: "App rejected: Missing usage descriptions"
**Solution:** All permission descriptions already added in `app.json`. If rejected, add more detail.

### Issue: "TypeScript errors prevent build"
**Solution:** All NativeWind errors should now be resolved. Run `npm run type-check` to verify.

---

## 📞 Support Resources

- **Expo Documentation:** https://docs.expo.dev
- **EAS Build:** https://docs.expo.dev/build/introduction/
- **EAS Submit:** https://docs.expo.dev/submit/introduction/
- **Apple App Review:** https://developer.apple.com/app-store/review/
- **Google Play Policies:** https://play.google.com/console/about/guides/

---

## 🎯 Estimated Timeline

| Phase | Duration |
|-------|----------|
| EAS project setup | 5 minutes |
| Environment configuration | 5 minutes |
| Create privacy policy (template) | 2-4 hours |
| Design and capture assets | 3-6 hours |
| Apple Developer setup | 30 minutes |
| Google Play setup | 20 minutes |
| Complete store listings | 1-2 hours |
| Build and test | 2-3 hours |
| Submission | 1 hour |
| **TOTAL** | **1-2 days of active work** |
| Review periods | **1-7 days** |

**Total to production:** 3-10 days from start to approved in stores

---

## 🚀 Quick Start Commands

```bash
# Navigate to mobile directory
cd /home/user/Fiple/mobile

# Initialize EAS project
npx eas init

# Configure environment
cp .env.example .env.local
# Edit .env.local with your local API URL

# Run type check to verify no errors
npm run type-check

# Start development server
npx expo start

# Build for production (after completing Steps 1-7)
eas build --profile production --platform all

# Submit to stores (after build completes)
eas submit --platform all --latest
```

---

*This guide covers all remaining steps to take your Fiple app from current state to production deployment. All critical code fixes have already been applied!*
