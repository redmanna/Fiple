# 🎨 Fiple Asset Creation Guide

This guide provides detailed specifications for creating all required assets for App Store and Google Play Store submission.

---

## 📱 Current Asset Status

### ❌ Assets Requiring Immediate Replacement

All current assets are **placeholders** dated "Oct 26, 1985" and must be replaced before submission.

```bash
# Current placeholder assets:
mobile/assets/icon.png            # 8-bit indexed, 1985 placeholder
mobile/assets/adaptive-icon.png   # 8-bit indexed, 1985 placeholder
mobile/assets/favicon.png         # 8-bit indexed, 1985 placeholder
mobile/assets/splash-icon.png     # Needs verification
```

---

## 1️⃣ App Icon (CRITICAL)

### Specifications

| Attribute | Requirement |
|-----------|-------------|
| **Dimensions** | 1024 x 1024 pixels |
| **Format** | PNG |
| **Color Depth** | 32-bit RGBA (NOT 8-bit indexed) |
| **Transparency** | Yes (for adaptive icon) |
| **File Size** | Under 1 MB |
| **DPI** | 72 or higher |

### Design Guidelines

**DO:**
- Use your brand colors (currently: #6366f1 - indigo/purple)
- Keep it simple and recognizable at small sizes
- Ensure it looks good on both light and dark backgrounds
- Use a square or rounded square design
- Make it distinctive and memorable

**DON'T:**
- Include text (it won't be readable at small sizes)
- Use photos (they don't scale well)
- Copy other app icons
- Use gradients that are too complex
- Make it too detailed

### Design Tools

**Professional:**
- Adobe Illustrator
- Sketch
- Figma (free tier available)
- Affinity Designer

**Beginner-Friendly:**
- Canva Pro (has app icon templates)
- Adobe Express
- IconKitchen (online tool)

### File Locations

After creating your icon:
```
mobile/assets/icon.png           # 1024x1024, 32-bit RGBA
```

---

## 2️⃣ Adaptive Icon (Android Only)

Android uses adaptive icons that consist of two layers that can animate and mask.

### Specifications

| Layer | Dimensions | Notes |
|-------|------------|-------|
| **Foreground** | 1024 x 1024 px | Must be PNG with transparency |
| **Background** | 1024 x 1024 px | Can be solid color or image |
| **Safe Zone** | 66% center circle | Keep logo within this area |

### Design Guidelines

- The **foreground layer** should contain your logo/icon
- The **background layer** can be a solid color or pattern
- Keep important elements within the center 66% circle (safe zone)
- Elements can extend beyond safe zone for visual interest
- Android will mask your icon into various shapes (circle, square, rounded square)

### Current Configuration

In `app.json`:
```json
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#6366f1"  // Your brand purple/indigo
  }
}
```

### Creating Adaptive Icons

**Option 1: Separate Foreground**
- Create `adaptive-icon.png` with transparent background
- Place logo in center 66% safe zone
- Keep `backgroundColor` as `#6366f1` in `app.json`

**Option 2: Full Custom**
- Create both foreground and background images
- Update `app.json` to reference both:
```json
"adaptiveIcon": {
  "foregroundImage": "./assets/adaptive-icon-foreground.png",
  "backgroundImage": "./assets/adaptive-icon-background.png"
}
```

### Testing Tool
- Use Android Studio's Image Asset Studio to preview

---

## 3️⃣ Splash Screen / Launch Screen

### Current Configuration
```json
"splash": {
  "image": "./assets/splash-icon.png",
  "resizeMode": "contain",
  "backgroundColor": "#6366f1"
}
```

### Specifications

| Attribute | Requirement |
|-----------|-------------|
| **Dimensions** | 1284 x 2778 pixels (iPhone 13 Pro Max) |
| **Format** | PNG |
| **Content** | Logo or brand mark only |
| **Background** | Transparent (background color set in app.json) |

### Design Guidelines

- Keep it simple - just your logo
- Use `resizeMode: "contain"` to prevent stretching
- Background color (#6366f1) is set in `app.json`
- Don't include text or complex graphics
- Will be shown briefly on app launch

---

## 4️⃣ Favicon (Web)

### Specifications

| Attribute | Requirement |
|-----------|-------------|
| **Dimensions** | 48 x 48 pixels (minimum) |
| **Format** | PNG or ICO |
| **Recommended** | 32x32, 48x48, 64x64 |

### Location
```
mobile/assets/favicon.png
```

---

## 5️⃣ App Screenshots (CRITICAL)

Screenshots are **required** for both App Store and Play Store submission.

### iOS Screenshot Requirements

Apple requires screenshots for multiple device sizes:

| Device | Dimensions | Required |
|--------|------------|----------|
| **iPhone 6.7"** (14 Pro Max, 15 Pro Max) | 1290 x 2796 px | ✅ YES |
| **iPhone 6.5"** (11 Pro Max, XS Max) | 1242 x 2688 px | ✅ YES |
| **iPhone 5.5"** (8 Plus) | 1242 x 2208 px | Recommended |
| **iPad Pro 12.9"** | 2048 x 2732 px | If supporting iPad |

**Number of Screenshots:** 3-10 per device size (5-6 recommended)

### Android Screenshot Requirements

| Device Type | Dimensions | Required |
|-------------|------------|----------|
| **Phone** | 1080 x 1920 px minimum | ✅ YES (at least 2) |
| **7-inch Tablet** | 1920 x 1080 px | Optional |
| **10-inch Tablet** | 1920 x 1200 px | Optional |

**Number of Screenshots:** 2-8 per device type (5-6 recommended)

### Screenshot Content Guidelines

**What to Include:**
1. **Login/Welcome Screen** - Show the first-time user experience
2. **Home Feed** - Showcase social features and content
3. **Marketplace** - Highlight shopping capabilities
4. **Wallet/Rewards** - Show earning potential
5. **Profile** - Demonstrate personalization
6. **Key Feature** - Live battles, skill exchange, or unique feature

**Best Practices:**
- Use actual app screens (not mockups)
- Show realistic content (not lorem ipsum)
- Highlight key features and benefits
- Use consistent branding
- Add captions or text overlays to explain features (optional but recommended)
- Show the app in action with real data

### How to Capture Screenshots

#### iOS (Using Simulator)

```bash
# 1. Start the app in iOS simulator
cd /home/user/Fiple/mobile
npx expo start --ios

# 2. In simulator menu:
# File > Save Screen (or ⌘S)

# 3. Or use command line:
xcrun simctl io booted screenshot screenshot.png
```

#### Android (Using Emulator)

```bash
# 1. Start the app in Android emulator
cd /home/user/Fiple/mobile
npx expo start --android

# 2. Use emulator screenshot button (camera icon)
# Or press ⌘S (Mac) / Ctrl+S (Windows)

# 3. Or use command line:
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png
```

#### Web Tools for Framing (Optional)

Make your screenshots look professional:
- **Previewed** (previewed.app) - Free screenshot framing
- **MockUPhone** (mockuphone.com) - Device mockups
- **Screely** (screely.com) - Add browser frames
- **Figma** - Full customization

---

## 6️⃣ Feature Graphic (Android Only)

### Specifications

| Attribute | Requirement |
|-----------|-------------|
| **Dimensions** | 1024 x 500 pixels |
| **Format** | PNG or JPG |
| **File Size** | Under 1 MB |
| **Content** | Showcase your app |

### Design Guidelines

- Displayed prominently in Play Store
- Should highlight your app's key value proposition
- Can include:
  - App name/logo
  - Key features (with icons)
  - Screenshot preview
  - Tagline (e.g., "Nigeria's #1 Campus Social Commerce Platform")
- Use your brand colors (#6366f1)
- High contrast and readable

### Design Template

```
[Left Side - App Icon]  [Center - Screenshots/Features]  [Right Side - Tagline]

                        Fiple
                        Connect • Buy • Earn • Create

                        [3 phone screenshots showing key features]
```

---

## 7️⃣ Promotional Assets (Optional but Recommended)

### App Preview Video (iOS)

- **Duration:** 15-30 seconds
- **Format:** .mov, .mp4, or .m4v
- **Dimensions:** Same as screenshot dimensions
- **Content:** Show app in action, highlight key features

### YouTube Promo Video (Android)

- Link to a YouTube video showcasing your app
- Displayed on Play Store listing

---

## 📐 Quick Reference Checklist

### Must Have (Critical)
- [ ] App Icon - 1024x1024, 32-bit RGBA
- [ ] Adaptive Icon (Android) - 1024x1024, transparent foreground
- [ ] iOS Screenshots - 6.7" (1290x2796) - at least 5 images
- [ ] iOS Screenshots - 6.5" (1242x2688) - at least 5 images
- [ ] Android Screenshots - Phone (1080x1920+) - at least 2 images
- [ ] Feature Graphic (Android) - 1024x500

### Nice to Have
- [ ] Splash screen custom design
- [ ] iOS 5.5" screenshots
- [ ] Android tablet screenshots
- [ ] App preview video
- [ ] Promotional YouTube video

---

## 🛠️ Recommended Workflow

### Step 1: Design App Icon (2-4 hours)
1. Sketch concepts
2. Design in Figma/Canva/Illustrator
3. Export as 1024x1024 PNG, 32-bit RGBA
4. Replace `mobile/assets/icon.png`
5. Create adaptive icon foreground
6. Replace `mobile/assets/adaptive-icon.png`

### Step 2: Capture Screenshots (1-2 hours)
1. Populate app with realistic demo data:
   - Create demo user account
   - Add sample posts, products, profiles
   - Ensure content looks authentic
2. Start app in iOS simulator (iPhone 14 Pro Max)
3. Navigate through key screens and capture:
   - Login/Welcome
   - Home feed
   - Marketplace
   - Wallet
   - Profile
   - Key feature
4. Repeat for Android emulator
5. Organize screenshots in folders:
   ```
   screenshots/
   ├── ios/
   │   ├── 6.7-inch/
   │   │   ├── 1-login.png
   │   │   ├── 2-home.png
   │   │   ├── 3-marketplace.png
   │   │   ├── 4-wallet.png
   │   │   └── 5-profile.png
   │   └── 6.5-inch/
   │       └── [same as above]
   └── android/
       └── phone/
           ├── 1-login.png
           ├── 2-home.png
           └── [more screenshots]
   ```

### Step 3: Create Feature Graphic (1-2 hours)
1. Design in Canva/Figma using 1024x500 template
2. Include app name, tagline, and visual elements
3. Export as PNG or JPG
4. Save for Play Store upload

### Step 4: Optional Enhancements (2-4 hours)
1. Frame screenshots with device mockups
2. Add text overlays explaining features
3. Create app preview video
4. Design promotional graphics

---

## 🎨 Brand Colors & Fonts

Based on your `app.json`:

**Primary Color:** `#6366f1` (Indigo/Purple)
**Splash Background:** `#6366f1`

Use this color consistently across all assets for brand recognition.

---

## 📦 Export Checklist

Before moving to next step:

```bash
# Verify all assets exist and have correct properties:
ls -lh mobile/assets/

# Expected output:
# icon.png          - ~200-500 KB, 1024x1024, 32-bit
# adaptive-icon.png - ~100-300 KB, 1024x1024, 32-bit with alpha
# splash-icon.png   - ~100-500 KB
# favicon.png       - ~5-20 KB

# Verify image properties (on Mac):
file mobile/assets/icon.png
# Should show: PNG image data, 1024 x 1024, RGBA

# Check file creation date (should be recent, not 1985!):
stat mobile/assets/icon.png
```

---

## 🚀 After Assets Are Ready

Once all assets are created:

1. Replace files in `mobile/assets/` directory
2. Test locally:
   ```bash
   cd mobile
   npx expo start
   # Verify icon appears correctly on launch
   ```
3. Commit changes:
   ```bash
   git add mobile/assets/
   git commit -m "feat: Replace placeholder assets with production designs"
   git push
   ```
4. Proceed with EAS build and store submission

---

## 📞 Need Help?

If you need professional design services:
- **Fiverr:** App icon design ($20-$100)
- **99designs:** Crowdsource design competition
- **Upwork:** Hire freelance designer
- **Canva Pro:** DIY with templates ($12.99/month)

---

**Next Steps:** After creating assets, refer to `PRODUCTION_SETUP_GUIDE.md` for store submission process.
