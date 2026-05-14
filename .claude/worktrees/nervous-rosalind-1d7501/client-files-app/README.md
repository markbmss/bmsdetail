# Client Files App — Setup Guide

## What you'll need (all free)
- Supabase account → supabase.com
- Netlify account → netlify.com (you already have this)
- Your GoDaddy domain

---

## Step 1 — Set up Supabase (10 min)

1. Go to **supabase.com** → New project
2. Give it a name (e.g. "client-files") and set a database password
3. Once created, go to **SQL Editor** (left sidebar)
4. Open `supabase-schema.sql` from this folder, paste it all in, and click **Run**
5. Go to **Settings → API** and copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

---

## Step 2 — Configure the app

1. In this project folder, duplicate `.env.example` and rename it to `.env.local`
2. Fill it in:

```
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...your-anon-key...
REACT_APP_APP_PASSWORD=ChooseAStrongTeamPassword123
```

> **Important:** Pick a strong password — this is what protects the app.

---

## Step 3 — Deploy to Netlify (5 min)

### Option A — Drag & drop (easiest)
1. Open this folder in Cursor, run:
   ```
   npm install
   npm run build
   ```
2. Go to **netlify.com** → your team → **Add new site → Deploy manually**
3. Drag the `build/` folder into Netlify

### Option B — Connect via GitHub (recommended for updates)
1. Push this project to a private GitHub repo
2. In Netlify → **Add new site → Import from Git** → connect the repo
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `build`

### Add your environment variables in Netlify
1. Netlify → your site → **Site configuration → Environment variables**
2. Add all 3 variables from your `.env.local`

---

## Step 4 — Connect your GoDaddy domain (5 min)

You'll use a **subdomain** (e.g. `clients.yourbusiness.com`) so it doesn't affect your main website.

### In Netlify:
1. Go to your site → **Domain management → Add a domain**
2. Type `clients.yourbusiness.com` → click **Verify** → **Add domain**
3. Netlify will show you a **CNAME value** (something like `your-site-name.netlify.app`)

### In GoDaddy:
1. Go to **My Products → DNS → Manage** for your domain
2. Click **Add New Record**
3. Type: `CNAME`
4. Name: `clients`
5. Value: paste the Netlify CNAME value
6. TTL: 1 hour
7. Save

DNS can take up to 30 minutes to go live. Netlify will auto-provision an SSL certificate.

---

## Done! 🎉

Your app will be live at `https://clients.yourbusiness.com`

Share the URL and the team password with your team members. That's it — everyone shares the same live database.

---

## Managing team access
- To change the password: update `REACT_APP_APP_PASSWORD` in Netlify's environment variables, then redeploy
- To kick someone out: just change the password
- For more advanced per-user logins (different accounts): let me know and we can upgrade to Supabase Auth

---

## Folder structure
```
client-files-app/
├── src/
│   ├── App.js              ← Main app logic
│   ├── index.js            ← Entry point
│   ├── lib/
│   │   └── supabase.js     ← Database connection
│   └── components/
│       ├── Login.js        ← Password screen
│       ├── ClientModal.js  ← Add/edit client form
│       ├── ClientDetail.js ← Client file view
│       └── PaymentModal.js ← Add payment form
├── public/
│   └── index.html
├── supabase-schema.sql     ← Run this in Supabase
├── .env.example            ← Copy to .env.local
├── netlify.toml            ← Netlify routing config
└── package.json
```
