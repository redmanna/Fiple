# 📄 How to Host Privacy Policy & Terms of Service

Your `PRIVACY_POLICY.md` and `TERMS_OF_SERVICE.md` templates are ready. Now you need to host them at public URLs.

**Required URLs:**
- `https://fiple.app/privacy`
- `https://fiple.app/terms`

---

## Option 1: GitHub Pages (Free, Recommended for Quick Setup)

### Step 1: Convert Markdown to HTML

Use an online converter or this simple HTML template:

**Create `privacy.html`:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Fiple</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 { color: #6366f1; }
        h2 { color: #6366f1; margin-top: 30px; }
        a { color: #6366f1; }
    </style>
</head>
<body>
    <!-- Paste converted HTML from PRIVACY_POLICY.md here -->
</body>
</html>
```

### Step 2: Create GitHub Repository

```bash
# Create a new repo for your website
cd /home/user
mkdir fiple-website
cd fiple-website

git init
# Copy your HTML files
cp /home/user/Fiple/PRIVACY_POLICY.md .
cp /home/user/Fiple/TERMS_OF_SERVICE.md .

# Convert to HTML (use online tool or pandoc)
# Save as privacy.html and terms.html

git add .
git commit -m "Initial commit: Legal documents"

# Create GitHub repo at github.com/[your-username]/fiple-website
git remote add origin https://github.com/[your-username]/fiple-website.git
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to GitHub repository settings
2. Click "Pages" in sidebar
3. Source: Deploy from branch
4. Branch: `main` / `root`
5. Click "Save"

Your docs will be available at:
- `https://[your-username].github.io/fiple-website/privacy.html`
- `https://[your-username].github.io/fiple-website/terms.html`

### Step 4: Configure Custom Domain (Optional)

If you own `fiple.app`:
1. Add CNAME record in your DNS:
   ```
   www.fiple.app  CNAME  [your-username].github.io
   ```
2. In GitHub Pages settings, add custom domain: `www.fiple.app`
3. Enable "Enforce HTTPS"

Your docs will be at:
- `https://www.fiple.app/privacy.html`
- `https://www.fiple.app/terms.html`

---

## Option 2: Notion (Fastest, No Coding)

### Step 1: Create Notion Account
- Sign up at https://notion.so (free)

### Step 2: Create Pages
1. Create new page: "Privacy Policy"
2. Paste content from `PRIVACY_POLICY.md`
3. Format with Notion's editor
4. Click "Share" > "Publish to web"
5. Copy public link

Repeat for Terms of Service.

### Step 3: Get Clean URLs
Notion URLs look like:
- `https://username.notion.site/Privacy-Policy-abc123...`

**Limitation:** Can't customize to `fiple.app/privacy` easily.

**Workaround:** Use link shortener or redirects.

---

## Option 3: Google Sites (Free, Easy)

### Step 1: Create Site
1. Go to https://sites.google.com
2. Click "Blank" to create new site
3. Name it "Fiple Legal"

### Step 2: Add Pages
1. Click "Pages" > "+ New page"
2. Name: "Privacy Policy"
3. Add text box, paste content from `PRIVACY_POLICY.md`
4. Format with Google Sites editor
5. Repeat for "Terms of Service"

### Step 3: Publish
1. Click "Publish"
2. Choose URL: `fiple-legal.web.app` (or custom domain)
3. Publish

URLs will be:
- `https://sites.google.com/view/fiple-legal/privacy`
- `https://sites.google.com/view/fiple-legal/terms`

### Step 4: Custom Domain
If you own `fiple.app`:
1. In Google Sites, click "Settings" > "Custom domain"
2. Follow instructions to add DNS records
3. Set up: `fiple.app/privacy` and `fiple.app/terms`

---

## Option 4: Your Own Website (If You Have One)

If you already have a website hosted:

### Using Static HTML
1. Convert markdown to HTML
2. Upload `privacy.html` and `terms.html` to your web server
3. Ensure files are at:
   - `https://fiple.app/privacy.html` (or `/privacy`)
   - `https://fiple.app/terms.html` (or `/terms`)

### Using WordPress
1. Create new pages: "Privacy Policy" and "Terms of Service"
2. Paste content
3. Set permalinks:
   - `/privacy`
   - `/terms`
4. Publish

### Using Next.js/React
1. Create pages in your web app:
   ```jsx
   // pages/privacy.js
   export default function Privacy() {
     return <div>{/* Privacy content */}</div>
   }
   ```
2. Deploy with your normal deployment process

---

## Option 5: Netlify (Free, Developer-Friendly)

### Step 1: Create Simple Site

```bash
# Create site folder
mkdir fiple-legal
cd fiple-legal

# Create privacy.html and terms.html
# (Convert from markdown)

# Create netlify.toml
cat > netlify.toml <<EOF
[[redirects]]
  from = "/privacy"
  to = "/privacy.html"
  status = 200

[[redirects]]
  from = "/terms"
  to = "/terms.html"
  status = 200
EOF

# Initialize git
git init
git add .
git commit -m "Initial commit"
```

### Step 2: Deploy to Netlify

1. Go to https://netlify.com
2. Sign up (free)
3. Click "Add new site" > "Import an existing project"
4. Connect GitHub repo (or drag & drop folder)
5. Deploy

Site will be at: `https://[random-name].netlify.app`

### Step 3: Custom Domain

1. In Netlify dashboard: Domain settings
2. Add custom domain: `fiple.app`
3. Follow DNS configuration instructions
4. Enable HTTPS (automatic)

---

## Option 6: Vercel (Free, Next.js Optimized)

Similar to Netlify:

1. Create simple HTML site or Next.js app
2. Push to GitHub
3. Connect to https://vercel.com
4. Deploy
5. Configure custom domain

---

## Markdown to HTML Conversion Tools

To convert your .md files to HTML:

**Online Tools:**
- https://markdowntohtml.com/
- https://dillinger.io/
- https://pandoc.org/try/ (advanced)

**Command Line (if you have pandoc):**
```bash
pandoc PRIVACY_POLICY.md -o privacy.html -s --css style.css
pandoc TERMS_OF_SERVICE.md -o terms.html -s --css style.css
```

**VS Code Extension:**
- Install "Markdown All in One"
- Right-click .md file > "Markdown: Print to HTML"

---

## Quick Start Recommendation

**For fastest setup (15 minutes):**

1. **Use Notion:**
   - Create account
   - Copy/paste both documents
   - Publish to web
   - Update app.json with Notion URLs

2. **Or use Google Sites:**
   - Create site
   - Add pages for privacy and terms
   - Publish
   - Update app.json with Google Sites URLs

**For professional setup (1-2 hours):**

1. **Use GitHub Pages with custom domain:**
   - More control
   - Custom domain support
   - Free forever
   - Professional URLs

---

## After Hosting

### Update app.json

Once your documents are live, verify the URL in `app.json`:

```json
{
  "expo": {
    "privacy": "https://fiple.app/privacy"
  }
}
```

### Add In-App Links

Consider adding links within your app:
- Settings screen
- Registration screen
- Footer/About section

Example:
```jsx
import { Linking } from 'react-native';

<TouchableOpacity
  onPress={() => Linking.openURL('https://fiple.app/privacy')}
>
  <Text>Privacy Policy</Text>
</TouchableOpacity>
```

### Test

Before submission, verify:
- [ ] URLs are publicly accessible (test in incognito browser)
- [ ] Documents load on mobile and desktop
- [ ] HTTPS is enabled (required by app stores)
- [ ] Content is readable and formatted correctly
- [ ] No broken links within documents

---

## Common Issues

### Issue: URL not accessible
**Solution:** Check DNS propagation (can take 24-48 hours)

### Issue: HTTPS not working
**Solution:**
- GitHub Pages: Enable in settings
- Netlify/Vercel: Automatic
- Custom hosting: Get SSL certificate (Let's Encrypt is free)

### Issue: 404 errors
**Solution:** Check file names and paths match exactly

---

## Final Checklist

Before moving to next deployment step:

- [ ] Privacy policy is live at public URL
- [ ] Terms of service is live at public URL
- [ ] Both URLs use HTTPS
- [ ] Both load correctly on mobile
- [ ] Both load correctly on desktop
- [ ] app.json has correct privacy URL
- [ ] Committed changes to git

Once complete, proceed to asset creation (ASSET_CREATION_GUIDE.md)!

---

**Need help?** The easiest options are Notion (5 min setup) or Google Sites (10 min setup). Both are free and require no technical knowledge.
