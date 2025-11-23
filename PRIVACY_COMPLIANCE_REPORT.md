# FIPLE APP - PRIVACY & PERMISSIONS COMPLIANCE REPORT
**Generated:** 2025-11-23  
**Status:** PARTIAL COMPLIANCE - CRITICAL ITEMS MISSING

---

## EXECUTIVE SUMMARY

The Fiple app has proper **permission declarations** but is **missing critical privacy documentation** required for App Store submission. Key issues identified:

- **Critical**: Privacy Policy and Terms of Service not configured
- **Important**: Missing iOS notification permission description
- **Important**: No privacy policy URL in app configuration
- **Good**: Comprehensive permission declarations for iOS and Android
- **Good**: Proper usage descriptions for sensitive APIs

---

## 1. PERMISSIONS DECLARED

### iOS Permission Declarations (app.json - infoPlist)

#### Camera & Media ✅
| Permission | Status | Description |
|-----------|--------|-------------|
| **NSCameraUsageDescription** | Declared | "Fiple needs access to your camera to create posts and reels." |
| **NSPhotoLibraryUsageDescription** | Declared | "Fiple needs access to your photos to share images and videos." |
| **NSMicrophoneUsageDescription** | Declared | "Fiple needs access to your microphone to record audio for reels." |

#### Location ⚠️
| Permission | Status | Description |
|-----------|--------|-------------|
| **NSLocationWhenInUseUsageDescription** | Declared | "Fiple uses your location to show local content and campus hubs." |
| **NSLocationAlwaysUsageDescription** | **NOT DECLARED** | Not used in app |
| **Location actual usage** | **NOT FOUND** | No expo-location imports found in codebase |

#### Notifications ❌ MISSING CRITICAL
| Permission | Status | Impact |
|-----------|--------|--------|
| **NSUserNotificationUsageDescription** | **NOT DECLARED** | Required for iOS push notifications |
| **UNUserNotificationCenter** | **NOT CONFIGURED** | Expo-notifications plugin present but iOS description missing |

**ACTION REQUIRED**: Add notification usage description to iOS infoPlist

```json
"NSUserNotificationUsageDescription": "Fiple sends you notifications about new messages, comments, and rewards."
```

---

### Android Permissions (app.json)

#### Declared Permissions ✅
```
CAMERA
RECORD_AUDIO
READ_EXTERNAL_STORAGE
WRITE_EXTERNAL_STORAGE
ACCESS_FINE_LOCATION
ACCESS_COARSE_LOCATION
```

#### Missing Permissions ⚠️
| Permission | Expected | Status |
|-----------|----------|--------|
| **POST_NOTIFICATIONS** | Android 13+ | Not declared (needed for push notifications) |
| **READ_MEDIA_IMAGES** | Android 13+ | Not declared (scoped storage alternative) |
| **READ_MEDIA_VIDEO** | Android 13+ | Not declared (scoped storage alternative) |

**NOTE**: Android 13+ requires POST_NOTIFICATIONS for push notifications. Consider updating:
```json
"permissions": [
  "CAMERA",
  "RECORD_AUDIO",
  "READ_EXTERNAL_STORAGE",
  "WRITE_EXTERNAL_STORAGE",
  "ACCESS_FINE_LOCATION",
  "ACCESS_COARSE_LOCATION",
  "POST_NOTIFICATIONS",
  "READ_MEDIA_IMAGES",
  "READ_MEDIA_VIDEO"
]
```

---

## 2. SENSITIVE API USAGE

### Detected Usage in Codebase

#### ✅ expo-image-picker (PROPERLY DECLARED)
- **Files using it**: 
  - `/home/user/Fiple/mobile/src/screens/create/CreatePostScreen.tsx`
  - `/home/user/Fiple/mobile/src/screens/merchant/AddProductScreen.tsx`
  - `/home/user/Fiple/mobile/src/screens/business/CreateAdScreen.tsx`
- **Usage**: Photo library access, camera access for posts
- **Permission status**: Declared
- **Permission request**: `ImagePicker.requestCameraPermissionsAsync()` called in code

#### ⚠️ expo-notifications (PLUGIN DECLARED BUT MISSING iOS DESCRIPTION)
- **Package**: `expo-notifications@0.32.13` installed
- **iOS**: Missing NSUserNotificationUsageDescription
- **Android**: Permission may need POST_NOTIFICATIONS
- **Plugin config**: Present in app.json but incomplete

#### ❌ expo-location (DECLARED BUT NOT USED)
- **Android permission**: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` declared
- **iOS description**: Declared - "Fiple uses your location to show local content and campus hubs"
- **Actual usage**: No `expo-location` imports found in mobile codebase
- **Issue**: Declaring location permission for unused feature

**ACTION REQUIRED**: Either implement location features or remove location permissions

#### ✅ @react-native-async-storage/async-storage (PROPERLY USED)
- **Usage**: Stores authentication tokens and user data
- **Files affected**:
  - `authStore.ts` - Stores/retrieves authToken, user data
  - `client.ts` - Stores/retrieves authToken
  - `marketplace-service.ts` - Stores recent searches
  - Multiple service files - Retrieve auth token
- **Data stored**: 
  - `authToken` - JWT authentication token
  - `user` - User profile object (JSON)
  - `@fiple_recent_searches` - User search history
- **Security**: AsyncStorage is not encrypted by default
  - **Recommendation**: Use `react-native-encrypted-async-storage` for sensitive data

---

## 3. DATA COLLECTION & PRIVACY PRACTICES

### User Data Collected
Based on Prisma schema analysis:

#### Account Information
- Email address
- Phone number
- Username
- Password hash
- Display name
- Avatar/Cover images

#### Personal Information
- Date of birth
- Gender
- Bio/Profile description
- Location (country, state, city)
- Language preference

#### Academic/Campus Information (If Verified)
- Campus ID
- Campus name
- School email
- Student ID
- Graduation year
- Course name

#### Financial Data
- Bank account details (name, number)
- Paystack customer ID
- Stripe customer ID
- Wallet balance (NGN, USD)
- Transaction history
- Reward earnings
- Total withdrawn amount

#### Behavioral/Engagement Data
- Posts count
- Followers/Following count
- Likes received
- Shares count
- Total views
- Engagement score
- Account status and verification status
- Last login time
- Last active time

#### Content Data
- Posts (text, images, videos)
- Comments
- Likes
- Shares
- Stories
- Reels

### Third-Party Services & Data Sharing

#### Payment Processing ✅
| Service | Data Shared | Purpose |
|---------|------------|---------|
| **Paystack** | Email, bank details, transaction amounts | Payment processing, withdrawals |
| **Stripe** | Email, transaction amounts | International payments |

#### Communication Services ⚠️
| Service | Data Shared | Status |
|---------|------------|--------|
| **SendGrid** | Email address, user name | Email notifications |
| **Africa's Talking** | Phone number | SMS notifications |
| **Twilio** | (Optional) Phone number | SMS notifications |

#### Storage
| Service | Data Stored | Privacy |
|---------|------------|---------|
| **Supabase** | User media (images/videos) | Encrypted in transit |

#### Analytics ⚠️
| Tool | Status | Configuration |
|------|--------|-----------------|
| **Google Analytics** | Configured in env | `GOOGLE_ANALYTICS_ID` in .env |
| **Sentry** | Configured in env | `SENTRY_DSN` for error tracking |
| **Internal Analytics** | Business analytics endpoints | Platform metrics collection |

**NOTE**: No third-party user tracking (Mixpanel, Amplitude, Segment) found in code

---

## 4. PRIVACY POLICY & TERMS OF SERVICE STATUS

### Critical Gaps ❌

| Document | Status | Location | Action |
|----------|--------|----------|--------|
| **Privacy Policy** | NOT CONFIGURED | Not found in codebase or app.json | **REQUIRED** |
| **Terms of Service** | NOT CONFIGURED | Not found in codebase or app.json | **REQUIRED** |
| **Privacy Policy URL** | NOT SET | No URL in app.json | **REQUIRED** |
| **Cookie Policy** | NOT CONFIGURED | Not found | **CONDITIONALLY REQUIRED** |

### Production Checklist Status
From `/home/user/Fiple/PRODUCTION_LAUNCH_CHECKLIST.md`:
```
- [ ] GDPR compliance checked
- [ ] Data retention policy defined
- [ ] Terms of Service finalized
- [ ] Privacy Policy finalized
```

**Status**: All marked as NOT COMPLETED ❌

### Requirements for App Stores

#### Apple App Store Requirements
1. **Privacy Policy URL required** - Must be provided in App Store Connect
2. **Contact information** - Email/URL for privacy inquiries
3. **Data collection disclosure** - Apple requires apps to declare what data is collected
4. **Data safety section** - Required for all apps
5. **User consent** - Users must accept privacy policy

#### Google Play Store Requirements  
1. **Privacy Policy URL required** - Must be accessible via app and play store
2. **Data safety questionnaire** - Google Play now requires "Data safety" section:
   - Data types collected
   - How data is used
   - Data sharing practices
   - Data retention practices
   - Security practices

---

## 5. APP STORE COMPLIANCE CHECKLIST

### Apple App Store ❌

#### Privacy Label (Data & Privacy) INCOMPLETE
- [ ] Declare all collected data types
- [ ] Mark data as "linked to user" or "linked to user ID"
- [ ] Mark data as "used for tracking" if applicable
- [ ] Add privacy policy URL
- [ ] Provide app privacy contact email

#### Required Data Types Not Declared
Missing declarations for:
- [ ] User ID
- [ ] Email address
- [ ] Phone number
- [ ] Date of birth
- [ ] Gender
- [ ] Location
- [ ] Photos/Videos
- [ ] Payment Information
- [ ] Financial Information
- [ ] Bank Account Information
- [ ] Contact Information
- [ ] Search History

#### Privacy Practices INCOMPLETE
- [ ] Privacy policy available and linked
- [ ] Data deletion mechanism documented
- [ ] Data handling for minors documented
- [ ] Third-party data sharing disclosed
- [ ] Security practices documented

### Google Play Store ❌

#### Data Safety Section INCOMPLETE
Required information:
- [ ] Declare all data types collected
- [ ] Disclose data sharing with third parties
- [ ] Declare data retention periods
- [ ] Describe security practices
- [ ] Link to privacy policy
- [ ] Confirm compliance with Play Store policies

#### Required Disclosures
Missing documentation for:
- [ ] User-generated content (posts, reels, stories)
- [ ] Location data usage
- [ ] Camera/microphone usage
- [ ] Payment card data
- [ ] Authentication credentials
- [ ] Device identifiers
- [ ] Analytics data

---

## 6. ISSUES & RECOMMENDATIONS

### Critical Issues (Must Fix Before Launch) 🔴

#### 1. Missing Privacy Policy Document
**Impact**: App Store rejection  
**Action**:
- Create comprehensive privacy policy document
- Include sections on:
  - Data collection practices
  - How data is used
  - Third-party sharing
  - User rights (access, deletion, portability)
  - Data retention policy
  - Contact information
  - Compliance with GDPR/local laws
- Host on server (e.g., fiple.com/privacy)
- Add URL to app.json

#### 2. Missing Terms of Service
**Impact**: App Store rejection, legal liability  
**Action**:
- Create Terms of Service covering:
  - User responsibilities
  - Prohibited content
  - Account termination
  - Liability limitations
  - Dispute resolution
  - Copyright/DMCA policies
- Host on server
- Link from app

#### 3. Missing iOS Notification Permission
**Impact**: iOS app may malfunction, warnings in review  
**Action**:
Add to `app.json` infoPlist:
```json
"NSUserNotificationUsageDescription": "Fiple sends you notifications about new messages, comments, and rewards."
```

#### 4. Unused Location Permission Declared
**Impact**: Privacy concern, trust violation, App Store warnings  
**Action**:
Option A: Implement location features
Option B: Remove location permissions from both iOS and Android
```json
// iOS: Remove NSLocationWhenInUseUsageDescription
// Android: Remove ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION
```

### Important Issues (Fix Before Launch) 🟡

#### 1. Missing Android 13+ Notifications Permission
**Impact**: Notifications won't work on Android 13+  
**Action**:
Add `POST_NOTIFICATIONS` to Android permissions array

#### 2. Unencrypted AsyncStorage
**Impact**: Sensitive auth tokens stored unencrypted  
**Action**:
Install encrypted storage:
```bash
npm install react-native-encrypted-async-storage
```
Update auth store to use encryption for:
- authToken
- user data
- sensitive information

#### 3. Google Analytics Configuration
**Impact**: Privacy concern if not disclosed  
**Action**:
- Ensure Google Analytics ID is set in production
- Document analytics in privacy policy
- Provide opt-out mechanism if possible
- Comply with GDPR cookie consent requirements

#### 4. Missing Data Retention Policy
**Impact**: GDPR non-compliance, App Store rejection  
**Action**:
Define and document:
- How long auth tokens are valid (currently 7 days)
- User data retention period
- Deleted account data cleanup timeline
- Analytics data retention
- Payment transaction retention

### Recommended Issues (Best Practices) 🟢

#### 1. Implement Data Deletion Feature
**Recommendation**: Add ability for users to:
- Download their data (GDPR right)
- Request account deletion (GDPR right)
- Delete specific content

#### 2. Add Consent Flows
**Recommendation**: Request explicit user consent for:
- Tracking (Google Analytics)
- Marketing communications
- Camera/microphone (on app launch)

#### 3. Implement Privacy by Design
**Recommendation**:
- Minimize data collection
- Anonymize analytics data
- Default to privacy-friendly settings
- Implement data minimization principles

---

## 7. DATA SAFETY REQUIREMENTS (Google Play)

### Checklist for Google Play Data Safety Section

```
Data Types Collected:
[ ] Name/email - Collected (necessary for account)
[ ] Phone number - Collected (optional)
[ ] Date of birth - Collected (optional for campus verification)
[ ] Photos/videos - Collected (user-generated content)
[ ] Location - Declared but not used (ISSUE)
[ ] Payment information - Collected (Paystack/Stripe)
[ ] Bank account info - Collected (for withdrawals)
[ ] Search history - Collected (stored in AsyncStorage)
[ ] Device ID - May be collected
[ ] Device info - May be collected

Data Sharing:
[ ] Shared with Paystack - Payment processing
[ ] Shared with Stripe - Payment processing
[ ] Shared with SendGrid - Email delivery
[ ] Shared with Africa's Talking - SMS delivery
[ ] Shared with Supabase - Storage

Data Retention:
[ ] Auth tokens: 7 days
[ ] User account: Until deletion (need policy)
[ ] Transaction records: [DEFINE - suggest 7 years for tax]
[ ] Analytics: [DEFINE]
[ ] Deleted account data: [DEFINE]

Security:
[ ] HTTPS for all API communication
[ ] JWT token-based authentication
[ ] Password hashing with bcrypt
[ ] Environment variable security
[ ] [NEED] Encrypted AsyncStorage for sensitive data
[ ] [NEED] Privacy Policy documentation
[ ] [NEED] Data handling procedures documentation
```

---

## 8. COMPLIANCE MATRIX

| Requirement | iOS | Android | Status |
|-------------|-----|---------|--------|
| **Permission Declarations** | ✅ Complete | ⚠️ Needs Android 13+ | Partial |
| **Usage Descriptions** | ⚠️ Missing notification | ✅ App handles | Partial |
| **Privacy Policy URL** | ❌ Missing | ❌ Missing | CRITICAL |
| **Terms of Service** | ❌ Missing | ❌ Missing | CRITICAL |
| **Data Safety Disclosure** | N/A | ❌ Not completed | CRITICAL |
| **Third-party Disclosure** | ❌ Not in app | ❌ Not in app | Important |
| **Data Deletion Feature** | ❌ Not implemented | ❌ Not implemented | Important |
| **Consent Flows** | ❌ Not implemented | ❌ Not implemented | Recommended |
| **Encrypted Storage** | ❌ Not implemented | ❌ Not implemented | Important |
| **Data Retention Policy** | ❌ Not documented | ❌ Not documented | Important |

---

## 9. IMMEDIATE ACTION ITEMS

### Before App Store Submission

**Priority 1 (Blocking)** - Complete within 48 hours:
1. [ ] Create and host Privacy Policy document
2. [ ] Create and host Terms of Service document
3. [ ] Add Privacy Policy URL to app.json
4. [ ] Add NSUserNotificationUsageDescription to iOS infoPlist
5. [ ] Remove unused location permissions OR implement location features

**Priority 2 (High)** - Complete within 1 week:
6. [ ] Add POST_NOTIFICATIONS to Android permissions
7. [ ] Implement encrypted AsyncStorage for auth tokens
8. [ ] Document data retention policy
9. [ ] Complete Google Play Data Safety section
10. [ ] Create Apple App Store Data & Privacy section

**Priority 3 (Medium)** - Complete before launch:
11. [ ] Implement data deletion feature
12. [ ] Add user consent flows
13. [ ] Document security practices
14. [ ] Set up GDPR compliance procedures

---

## 10. TEMPLATE: PRIVACY POLICY SECTIONS

Essential sections for Fiple's Privacy Policy:

```markdown
# Fiple Privacy Policy

1. Introduction
2. Information We Collect
   - Account Information
   - Usage Information
   - Payment Information
   - Location Information
   - Device Information
   - Content You Create

3. How We Use Your Information
   - To provide services
   - To improve services
   - To communicate with you
   - For payments and rewards
   - For analytics

4. Data Sharing
   - Paystack (payments)
   - Stripe (payments)
   - SendGrid (emails)
   - Africa's Talking (SMS)
   - Supabase (storage)
   - Service providers
   - Legal requirements

5. Data Security
   - HTTPS encryption
   - Secure authentication
   - Data protection measures
   - Limitations

6. Your Rights
   - Access your data
   - Correct data
   - Delete account
   - Download data
   - Opt-out of tracking

7. Data Retention
   - Active accounts: Until deletion
   - Deleted accounts: 30-90 days
   - Transactions: 7 years (tax compliance)
   - Analytics: [Define]

8. Children's Privacy
   - Users must be 13+
   - No intentional collection from minors

9. Changes to Policy
   - How we notify users
   - Your acceptance of changes

10. Contact Information
    - Privacy contact email
    - Address
    - Support channels
```

---

## CONCLUSION

**Overall Compliance Status**: 40% Complete

Fiple has implemented proper **permission declarations** and **API usage** handling, but is **missing critical privacy documentation** required for both Apple App Store and Google Play Store submissions.

**Next Steps**:
1. Create Privacy Policy and Terms of Service (CRITICAL)
2. Add notification permission to iOS (CRITICAL)
3. Configure app.json with privacy policy URL
4. Fix Android 13+ notification permission
5. Implement encrypted storage for sensitive data
6. Complete Google Play Data Safety section

**Estimated Time to Full Compliance**: 2-3 weeks with legal review

---

**Report Generated**: 2025-11-23  
**Repository**: /home/user/Fiple  
**Agent**: F - Privacy & Permissions Check
