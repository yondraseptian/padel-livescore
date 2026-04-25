# Padel LiveScore - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Verify Supabase Connection ✓
The database is already connected via environment variables in your Vercel project.

### Step 2: Create Database Tables
Open your Supabase project dashboard and run the SQL migration:

```sql
-- Copy the contents of scripts/01-create-tables.sql
-- Paste into: Supabase → SQL Editor → Run
```

Or use the Node script (coming next).

### Step 3: Seed Sample Data

```bash
# Run this to create sample teams and matches
node scripts/seed-data.js
```

**Expected output:**
```
✓ Seed data created successfully!

Teams created:
  1. Team A
  2. Team B
  3. Team C
  4. Team D

Matches created:
  1. Team A vs Team B (scheduled)
  2. Team C vs Team D (scheduled)
  3. Team A vs Team C (live)
```

### Step 4: Create Admin User

```bash
# Run this to create the default admin account
node scripts/init-admin.js
```

**Default credentials:**
- Username: `admin`
- Password: `admin123`

### Step 5: Start the Dev Server

```bash
pnpm dev
```

Server runs at: `http://localhost:3000`

## 📱 Using the Application

### Public Display (Home Page)
- **URL:** `http://localhost:3000`
- Shows: Upcoming matches, live scores, and standings
- Live scores auto-update via WebSocket

### Admin Dashboard (Referee)
- **URL:** `http://localhost:3000/admin/login`
- **Username:** `admin`
- **Password:** `admin123`
- Enter scores and manage matches

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Web Browser                         │
│         (Public Display + Admin Dashboard)          │
└─────────────┬───────────────────────────────────────┘
              │
              ├─── HTTP/REST ──→ Next.js API Routes
              │                  - /api/matches
              │                  - /api/standings
              │                  - /api/auth/*
              │                  - /api/admin/score
              │
              └─── WebSocket ──→ Socket.io Server
                                 (Real-time updates)
                                 Port: 3001
              
              ↓ (All data persists to)
              
         ┌────────────────────┐
         │  Supabase + SQL    │
         │  PostgreSQL DB     │
         └────────────────────┘
```

## 🗄️ Database Tables

| Table | Purpose | Records |
|-------|---------|---------|
| `teams` | Team information | 4 (seeded) |
| `matches` | Match schedule & status | 3 (seeded) |
| `match_scores` | Detailed game/set scores | Empty (filled by admin) |
| `standings` | Leaderboard | 4 (auto-updated) |
| `admin_users` | Referee accounts | 1 (admin) |

## 📊 Match Scoring Format

- **Best of 3 Sets** (first to 2 sets wins)
- **Each Set:** First to 6 games with 2+ lead
- **Tiebreaker at 6-6:** First to 7 points with 2+ lead
- **Current Score Display:** Sets Won | Current Set Games

Example: `2-1 | 4-3` = Team already won 2 sets and 1, currently in set 3, leading 4-3

## 🔧 Common Tasks

### Change Admin Password

```javascript
// In Node.js REPL or script
import { createAdminUser } from './lib/auth.ts';
await createAdminUser('admin', 'newpassword123');
```

### View Match Scores

```bash
# Query specific match scores
curl "http://localhost:3000/api/admin/score?matchId=<match_id>"
```

### Reset a Match

Currently not implemented. To reset:

1. Delete records from `match_scores` table
2. Reset `matches.status` to 'scheduled'
3. Update `matches.winner_id` to NULL

### Add New Team

Go to Supabase → SQL Editor:

```sql
INSERT INTO teams (name, logo_url) 
VALUES ('New Team', 'https://example.com/logo.png');

-- Then create standing entry
INSERT INTO standings (team_id, matches_played, matches_won, matches_lost, games_won, games_lost, sets_won, sets_lost)
VALUES ('<team_id>', 0, 0, 0, 0, 0, 0, 0);
```

## 🔐 Security Notes

⚠️ **For Development Only:**
- Default admin credentials are in code
- No rate limiting
- No HTTPS enforcement
- SQL queries not fully parameterized

⚠️ **Before Production:**
1. Change admin password
2. Add API rate limiting
3. Enable HTTPS
4. Implement proper JWT tokens
5. Add Row Level Security (RLS) to Supabase
6. Validate all user inputs
7. Use environment variables for secrets

## 🐛 Troubleshooting

### "No matches available"
```bash
# Reseed the data
node scripts/seed-data.js
```

### "Login fails"
```bash
# Verify admin user exists
node scripts/init-admin.js
```

### "Scores not updating"
- Check if you're logged in to admin dashboard
- Check browser console for errors
- Verify Socket.io server is running (if enabled)

### Build errors
```bash
# Clear Next.js cache and rebuild
rm -rf .next
pnpm dev
```

## 📖 Documentation

For detailed information, see:
- **Full Setup:** `PADEL_SETUP.md`
- **API Docs:** See endpoint descriptions in `/app/api` folders
- **Database Schema:** `scripts/01-create-tables.sql`

## 🎯 Next Steps

1. ✅ Start the dev server (`pnpm dev`)
2. ✅ Visit home page: `http://localhost:3000`
3. ✅ Check matches and standings
4. ✅ Go to admin login: `/admin/login`
5. ✅ Enter score for a match
6. ✅ Watch live updates on home page

## 💡 Tips

- **Real-time Updates:** Open home page in one window, admin dashboard in another, see live updates
- **Testing:** Use the 3 pre-loaded sample matches
- **Responsive:** Try mobile view for compact score display
- **Dark Mode:** App supports light/dark theme switching

Enjoy your Padel LiveScore platform! 🎾
