# Padel LiveScore - Deployment Guide

## Overview

This guide covers deploying Padel LiveScore to production on Vercel with Supabase database.

## Prerequisites

- Vercel account (free or paid)
- GitHub repository (optional, for auto-deployments)
- Supabase account (already configured)
- Domain name (optional)

## Step 1: Prepare for Production

### 1.1 Update Admin Credentials

**⚠️ IMPORTANT:** Change default admin password immediately!

```bash
# Create new admin user via Node script
# Edit scripts/init-admin.js with new username/password
node scripts/init-admin.js
```

**Or in Supabase SQL Editor:**

```sql
-- Delete old admin user
DELETE FROM admin_users WHERE username = 'admin';

-- Insert new user with hashed password (requires bcrypt)
-- Use the init script above instead
```

### 1.2 Update Environment Variables

In Vercel project settings, ensure these are set:

```
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
POSTGRES_URL=your_postgres_url
POSTGRES_PASSWORD=your_postgres_password
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 1.3 Enable Supabase Security Features

**In Supabase Dashboard:**

1. **Enable Row Level Security (RLS):**
   ```sql
   ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
   ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
   ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;
   ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
   ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
   ```

2. **Create RLS Policies:**
   ```sql
   -- Public can read teams, matches, standings
   CREATE POLICY "teams_public_read" ON teams
   FOR SELECT USING (true);

   CREATE POLICY "matches_public_read" ON matches
   FOR SELECT USING (true);

   CREATE POLICY "standings_public_read" ON standings
   FOR SELECT USING (true);

   -- Only authenticated admins can modify scores
   CREATE POLICY "match_scores_admin_all" ON match_scores
   FOR ALL USING (auth.role() = 'authenticated');
   ```

## Step 2: Deploy Frontend to Vercel

### 2.1 Connect Git Repository

```bash
# Push code to GitHub
git add .
git commit -m "Padel LiveScore - Ready for production"
git push origin main
```

### 2.2 Create Vercel Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Select **Next.js** framework preset
4. Add environment variables (from Step 1.2)
5. Click **Deploy**

### 2.3 Configure Domain

1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records (Vercel will provide instructions)

### 2.4 Setup GitHub Auto-Deployments

- Automatically deploys main branch to production
- Preview deployments for pull requests
- Rollback previous versions easily

## Step 3: Deploy Socket.io Server (Optional)

For production real-time updates, deploy Socket.io separately:

### 3.1 Deploy to Railway, Heroku, or Render

**Using Railway (Recommended):**

```bash
# 1. Push your code to GitHub
# 2. Go to railway.app
# 3. Create new project → Deploy from GitHub
# 4. Select your repository
# 5. Add environment variables
# 6. Deploy
```

**Environment variables for Socket.io server:**
```
NODE_ENV=production
SOCKET_PORT=3000
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 3.2 Update Client Connection

In `.env.local`:
```
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.railway.app
```

Redeploy to Vercel after updating.

### 3.3 Test Socket.io Connection

```javascript
// In browser console
const socket = io('https://your-socket-server.railway.app');
socket.on('connect', () => console.log('Connected!'));
```

## Step 4: Database Verification

### 4.1 Verify Tables Exist

In Supabase SQL Editor:

```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should return: teams, matches, match_scores, standings, admin_users
```

### 4.2 Verify Data

```sql
-- Check teams
SELECT COUNT(*) FROM teams;

-- Check admin users
SELECT COUNT(*) FROM admin_users;
```

## Step 5: Monitor & Maintain

### 5.1 Setup Error Tracking

**Option 1: Vercel Analytics**
- Automatic in Vercel dashboard
- Monitor Core Web Vitals
- See error logs

**Option 2: Sentry Integration**

```bash
pnpm add @sentry/nextjs
```

Configure in `next.config.mjs`:

```javascript
import * as Sentry from '@sentry/nextjs';

export default {
  sentry: {
    dsn: process.env.SENTRY_DSN,
  },
};
```

### 5.2 Monitor Database

- Check Supabase usage dashboard
- Monitor query performance
- Review connection limits

### 5.3 Security Updates

```bash
# Regular dependency updates
pnpm update
pnpm audit

# Keep Node.js updated
node --version
```

## Step 6: Performance Optimization

### 6.1 Enable Caching Headers

```typescript
// In API routes
response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
```

### 6.2 Database Query Optimization

Review query performance in Supabase:

```sql
-- Analyze slow queries
EXPLAIN ANALYZE
SELECT m.*, t1.name, t2.name
FROM matches m
JOIN teams t1 ON m.team1_id = t1.id
JOIN teams t2 ON m.team2_id = t2.id;
```

### 6.3 Image Optimization

Current: Placeholder URLs. Future: Use Vercel Image Optimization:

```typescript
import Image from 'next/image';

<Image
  src={logoUrl}
  alt="Team logo"
  width={100}
  height={100}
/>
```

## Step 7: Backup & Disaster Recovery

### 7.1 Database Backups

Supabase automatically backs up daily. Manual backup:

```bash
# Export database
pg_dump $POSTGRES_URL > backup.sql

# Restore from backup
psql $POSTGRES_URL < backup.sql
```

### 7.2 Code Backups

GitHub serves as your code backup. Alternatively:

```bash
git clone https://github.com/yourusername/padel-livescore.git backup
```

## Step 8: SSL/HTTPS Setup

### Vercel
- **Automatic:** HTTPS enabled by default
- **Renewal:** Automatic
- **Custom domain:** Auto SSL certificate via Let's Encrypt

### Database
- Supabase: HTTPS connections required
- Use `sslmode=require` in connection strings

## Rollback Procedure

### In Vercel
1. Dashboard → Deployments
2. Find previous successful deployment
3. Click "..." → Redeploy
4. Confirms active deployment

### Database
```bash
# Restore from backup
psql $POSTGRES_URL < backup.sql
```

## Troubleshooting Production Issues

### Issue: 500 Error on Home Page

```bash
# 1. Check Vercel logs
# 2. Check Supabase status
# 3. Verify environment variables
# 4. Check database connectivity
psql $POSTGRES_URL -c "SELECT 1"
```

### Issue: Scores Not Updating

```javascript
// Check Socket.io connection
fetch('https://yourdomain.com/api/admin/score?matchId=<id>')
  .then(r => r.json())
  .then(console.log)
```

### Issue: Admin Login Fails

```sql
-- Verify admin user exists
SELECT * FROM admin_users;

-- Verify table permissions
SHOW row_security;
```

## Monitoring Checklist

- [ ] Daily: Check error logs in Vercel
- [ ] Weekly: Review database performance
- [ ] Monthly: Update dependencies
- [ ] Monthly: Review security advisories
- [ ] Quarterly: Database optimization review

## Scaling Considerations

### Traffic Scaling
- Vercel: Auto-scales serverless functions
- Supabase: Upgrade plan as needed
- Socket.io: Deploy multiple instances with Redis adapter

### Database Scaling
```sql
-- Monitor current size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Archive old matches
DELETE FROM matches 
WHERE status = 'completed' 
AND scheduled_at < NOW() - INTERVAL '1 year';
```

### Storage Scaling
- Current: No file uploads (placeholder images)
- Future: Use Vercel Blob or Supabase Storage
- Budget: ~1GB for 1,000 photos at 1MB each

## Cost Estimation

### Monthly Costs
| Component | Free Tier | Pro Tier |
|-----------|-----------|----------|
| Vercel | Free | $20 |
| Supabase DB | 500MB | ~$25 |
| Storage (images) | 1GB | ~$5 |
| **Total** | **Free** | **~$50** |

Adjust based on traffic and match volume.

## Security Checklist

- [ ] Change default admin password
- [ ] Enable database RLS policies
- [ ] Use HTTPS everywhere
- [ ] Set secure cookie flags
- [ ] Add rate limiting
- [ ] Enable CORS properly
- [ ] Validate all user inputs
- [ ] Use environment variables for secrets
- [ ] Enable database logging
- [ ] Setup monitoring alerts
- [ ] Regular security audits
- [ ] Keep dependencies updated

## Support & Maintenance

### Support Channels
- Vercel: [vercel.com/support](https://vercel.com/support)
- Supabase: [supabase.com/support](https://supabase.com/support)
- Next.js: [nextjs.org/docs](https://nextjs.org/docs)

### Regular Maintenance
- Weekly: Check logs and errors
- Monthly: Update dependencies
- Quarterly: Security review
- Annually: Infrastructure audit

---

**Deployment Checklist:**
1. ✅ Change admin password
2. ✅ Update environment variables
3. ✅ Enable Supabase RLS
4. ✅ Deploy to Vercel
5. ✅ Configure custom domain
6. ✅ Test all features
7. ✅ Setup monitoring
8. ✅ Document process

Good luck with your deployment!
