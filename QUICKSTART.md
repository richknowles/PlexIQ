# PlexIQ v5.3.2 - Quick Start Guide

## 🚨 IMPORTANT: Connection Not Working?

If you're seeing connection errors, follow these steps:

### Step 1: Install Dependencies

```bash
cd PlexIQ/web
npm install
```

This installs Next.js and all required packages. **This step is required!**

### Step 2: Configure Plex Connection

Create `.env.local` in the `web/` directory:

```bash
cd PlexIQ/web
nano .env.local
```

Add your Plex details:

```bash
# Required
PLEX_HOST=http://YOUR_PLEX_IP:32400
PLEX_TOKEN=your_actual_plex_token

# Optional
NEXT_PUBLIC_DEMO_ENABLED=true
NEXT_PUBLIC_SESSION_PERSIST=true
```

**How to find your Plex token:**
1. Open Plex Web App
2. Play any movie/show
3. Click the ⚙ icon → "Get Info" → "View XML"
4. Look for `X-Plex-Token` in the URL
5. Copy the long string after `X-Plex-Token=`

### Step 3: Launch PlexIQ

```bash
cd PlexIQ/web
npm run dev
```

Open http://localhost:3000

---

## 🧪 Testing Without Plex (Demo Mode)

If you just want to test the interface without connecting to Plex:

**Your .env.local should have:**
```bash
NEXT_PUBLIC_DEMO_ENABLED=true
PLEX_HOST=http://localhost:32400
PLEX_TOKEN=dummy_token
```

Then when you launch, select **"🧪 Demo Library"** from the dropdown.

---

## ✅ Verify It's Working

### Test 1: Check the app loads
- Open http://localhost:3000
- You should see the Chicago noir interface
- No errors in browser console (F12)

### Test 2: Check library dropdown
- Click the library dropdown
- You should see "🧪 DEMO LIBRARY" (always available)
- If Plex is connected, you'll also see your real libraries

### Test 3: Test Demo Library
- Select "🧪 Demo Library"
- Click "🔍 ANALYZE LIBRARY"
- You should see 10 sample movies with scores
- This works WITHOUT a Plex connection!

### Test 4: Test Real Library (optional)
- Make sure Plex is running
- Make sure your .env.local has correct HOST and TOKEN
- Select your real library from dropdown
- Click "🔍 ANALYZE LIBRARY"
- Should see your actual media

---

## 🔧 Common Issues

### "Cannot reach Plex server"

**Solution 1: Check Plex is running**
```bash
# Test your connection
curl http://YOUR_PLEX_IP:32400/?X-Plex-Token=YOUR_TOKEN
```

If this works, your Plex is fine. Check your `.env.local` has the same values.

**Solution 2: Use Demo Library**
- Set `NEXT_PUBLIC_DEMO_ENABLED=true` in `.env.local`
- Select "🧪 Demo Library" to test without Plex

### "Module not found" errors

```bash
cd PlexIQ/web
rm -rf node_modules package-lock.json
npm install
```

### Port 3000 already in use

```bash
PORT=3001 npm run dev
```

### Changes not showing up

```bash
# Hard refresh in browser
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)

# Or clear cache
F12 → Application → Clear storage
```

---

## 📋 Complete Setup Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Cloned repo (`git clone ...`)
- [ ] Checked out branch (`git checkout claude/plexiq-v5.3.2-production-014pS3sejSzGcEM6wsDc92rY`)
- [ ] Installed web dependencies (`cd web && npm install`)
- [ ] Created `.env.local` with Plex credentials
- [ ] Started dev server (`npm run dev`)
- [ ] Opened http://localhost:3000
- [ ] Tested Demo Library first
- [ ] Connected to real Plex library

---

## 🌭 Ready to Roll!

Once you see the Chicago interface and can select "🧪 Demo Library", you're good to go!

**Test with Demo first, then connect to your real Plex.**

Questions? Check [INSTALL.md](INSTALL.md) or [README.md](README.md)
