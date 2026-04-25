# Padel LiveScore - Setup Checklist

## Pre-Setup Requirements

- [x] Supabase account (already connected)
- [x] Node.js 16+ (with pnpm)
- [x] Next.js 16 project (created)
- [x] All dependencies installed

## Setup Steps

### Phase 1: Database

- [ ] **1. Create Database Tables**
  - Navigate to Supabase Dashboard
  - SQL Editor
  - Copy content from `scripts/01-create-tables.sql`
  - Run the SQL
  - Verify 5 tables created: teams, matches, match_scores, standings, admin_users

  **How to verify:**
  ```sql
  SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
  -- Should show: teams, matches, match_scores, standings, admin_users
  ```

- [ ] **2. Seed Sample Data**
  ```bash
  node scripts/seed-data.js
  ```
  - Creates 4 teams
  - Creates 3 sample matches
  - Creates standings entries
  - Expected output: "Seed data created successfully!"

  **How to verify:**
  ```sql
  SELECT COUNT(*) FROM teams;  -- Should be 4
  SELECT COUNT(*) FROM matches;  -- Should be 3
  ```

- [ ] **3. Create Admin User**
  ```bash
  node scripts/init-admin.js
  ```
  - Default username: `admin`
  - Default password: `admin123`
  - Expected output: "Admin user created"

  **How to verify:**
  ```sql
  SELECT COUNT(*) FROM admin_users;  -- Should be 1
  ```

### Phase 2: Application Setup

- [ ] **4. Verify Environment Variables**
  Check that Supabase variables are set:
  ```bash
  echo "URL: $NEXT_PUBLIC_SUPABASE_URL"
  echo "Key set: $([ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ] && echo yes || echo no)"
  ```
  
  Should output:
  - URL: https://xxxxx.supabase.co
  - Key set: yes

- [ ] **5. Start Development Server**
  ```bash
  pnpm dev
  ```
  
  Expected output:
  ```
  ▲ Next.js 16.2.4
  - Local: http://localhost:3000
  ✓ Ready in XXXms
  ```

- [ ] **6. Verify Server is Running**
  Open http://localhost:3000 in browser
  
  Should see:
  - Padel LiveScore header
  - "Upcoming & Live Matches" section
  - 3 sample matches displayed
  - "Tournament Standings" table with 4 teams
  - "Admin Panel" button in header

### Phase 3: Testing

#### Public Display
- [ ] **7. Test Home Page**
  - URL: http://localhost:3000
  - Check matches display correctly
  - Check standings table shows all teams
  - Check match status badges (LIVE, SCHEDULED)
  - Check team logos display
  - Check responsive design (resize browser)

- [ ] **8. Test Live Score Updates**
  - Keep home page open in one tab
  - Go to admin dashboard in another tab (see Phase 3, step 11)
  - Update a score in admin
  - Home page should update within 5 seconds
  - Verify scores match

#### Admin Dashboard
- [ ] **9. Test Admin Login**
  - URL: http://localhost:3000/admin/login
  - Enter username: `admin`
  - Enter password: `admin123`
  - Click Login
  - Should redirect to dashboard
  - Should see match list

- [ ] **10. Test Login Validation**
  - Try wrong password: should show "Invalid username or password"
  - Try empty fields: should show required field error
  - Try non-existent username: should show "Invalid username or password"

- [ ] **11. Test Score Input**
  - Select a match from the list
  - Check current score displays (should be 0-0 initially)
  - Click "+1 Team A" button
  - Score should update (1-0)
  - Check "Sets Won" displays correctly
  - Try updating multiple times
  - Check success message appears
  - Try clicking same team multiple times
  - Check score increments correctly

- [ ] **12. Test Match State Calculation**
  - Get Team 1 to 6 games (click "+1 Team A" 6 times)
  - Verify set win detected (Team 1 Sets = 1)
  - Score should reset to 0-0 for new game
  - Update Team 2 to 6 games
  - Verify set won
  - Continue until match is complete (2 sets won)
  - Check "Match completed!" message appears
  - Verify buttons are disabled

- [ ] **13. Test Logout**
  - Click Logout button
  - Should redirect to login page
  - Try accessing /admin/dashboard directly
  - Should redirect to login

### Phase 4: Mobile & Responsiveness

- [ ] **14. Test Mobile Layout**
  - Open DevTools (F12)
  - Toggle device toolbar (mobile view)
  - Test iPhone 12 / Android sizes
  - Check:
    - Navigation is accessible
    - Cards stack vertically
    - No horizontal scrolling
    - Buttons are tap-friendly
    - Text is readable

- [ ] **15. Test Touch Interactions**
  - On mobile/tablet, click buttons
  - Verify no hover issues
  - Test form inputs
  - Verify keyboard handling

### Phase 5: Error Handling

- [ ] **16. Test Error Handling**
  - Try accessing /admin/dashboard without login
    - Should redirect to /admin/login
  - Try invalid match ID in API
    - Should handle gracefully
  - Check browser console
    - Should not have uncaught errors

- [ ] **17. Test Form Validation**
  - Admin login with empty username
    - Should show required field error
  - Admin login with empty password
    - Should show required field error

### Phase 6: Database Verification

- [ ] **18. Verify Data Integrity**
  ```sql
  -- Check all tables have data
  SELECT 'teams' as table_name, COUNT(*) as count FROM teams
  UNION ALL
  SELECT 'matches', COUNT(*) FROM matches
  UNION ALL
  SELECT 'standings', COUNT(*) FROM standings
  UNION ALL
  SELECT 'admin_users', COUNT(*) FROM admin_users;
  ```

- [ ] **19. Check Indexes**
  ```sql
  SELECT indexname FROM pg_indexes WHERE tablename IN ('matches', 'match_scores', 'standings');
  -- Should show several indexes
  ```

## Known Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Cannot find module '@/components/ui/'" | Missing shadcn components | Run `pnpm install` |
| "Connect ECONNREFUSED" | Database connection issue | Check SUPABASE_URL and credentials |
| "Invalid username or password" | Admin user not created | Run `node scripts/init-admin.js` |
| "Matches not displaying" | Sample data not seeded | Run `node scripts/seed-data.js` |
| "Login redirects infinitely" | Auth cookie issue | Clear cookies and try again |
| Page blank | Build issue | Kill dev server, clear .next, run `pnpm dev` |

## Quick Troubleshooting

### Database Issues
```bash
# Check Supabase connection
curl -H "Authorization: Bearer YOUR_ANON_KEY" \
  https://your-project.supabase.co/rest/v1/teams

# Should return a JSON array
```

### Server Issues
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
kill -9 <PID>

# Restart server
pnpm dev
```

### Module Issues
```bash
# Clear cache and reinstall
rm -rf node_modules .next pnpm-lock.yaml
pnpm install
pnpm dev
```

## Performance Verification

- [ ] **20. Check Performance**
  - Home page load time: Should be < 1 second
  - Admin dashboard load time: Should be < 500ms
  - Score update latency: Should be < 5 seconds
  - Check Network tab in DevTools
  - Check waterfall chart

## Documentation Review

- [ ] **21. Review Documentation**
  - [ ] Read README.md (overview)
  - [ ] Read QUICK_START.md (getting started)
  - [ ] Read PROJECT_SUMMARY.md (technical details)
  - [ ] Read ARCHITECTURE.md (system design)
  - [ ] Read PADEL_SETUP.md (detailed setup)
  - [ ] Skim DEPLOYMENT.md (for future)

## Before Going Live

- [ ] **22. Security Checklist**
  - [ ] Change admin password from "admin123"
  - [ ] Review .env file (no secrets in git)
  - [ ] Check no console.logs with sensitive data
  - [ ] Verify HTTPS will be enabled (on Vercel)
  - [ ] Plan to enable Supabase RLS for production

- [ ] **23. Production Readiness**
  - [ ] Backup database manually
  - [ ] Test full match flow (start to finish)
  - [ ] Verify all error cases handled
  - [ ] Check responsiveness on real devices
  - [ ] Load test with multiple users (optional)

- [ ] **24. Documentation**
  - [ ] Document any custom changes made
  - [ ] Update admin credentials document
  - [ ] Create deployment notes
  - [ ] Create user guide (if sharing)

## Post-Setup

### Daily
- [ ] Monitor error logs
- [ ] Check database usage
- [ ] Verify matches updating correctly

### Weekly
- [ ] Check Supabase performance
- [ ] Review user feedback
- [ ] Backup database

### Monthly
- [ ] Update dependencies (`pnpm update`)
- [ ] Review security advisories (`pnpm audit`)
- [ ] Optimize slow queries if any
- [ ] Archive old matches (optional)

## Success Criteria

You've successfully set up when:

✅ All 5 database tables exist and have data
✅ Home page displays matches and standings
✅ Admin login works with default credentials
✅ Scores can be entered and update in real-time
✅ Responsive design works on mobile
✅ No console errors
✅ All tests pass
✅ You can explain the data flow

## Next Steps

1. **Test Real Matches**
   - Change admin password
   - Run real matches using the dashboard
   - Verify standings update correctly

2. **Customize**
   - Add your tournament name
   - Add team logos (replace placeholders)
   - Customize colors/branding
   - Add more admin users

3. **Deploy to Production**
   - Push code to GitHub
   - Deploy to Vercel
   - Configure custom domain
   - Follow DEPLOYMENT.md

4. **Monitor & Maintain**
   - Setup error tracking
   - Monitor performance
   - Regular backups
   - Keep dependencies updated

## Support

If you encounter issues:

1. **Check QUICK_START.md** - Common setup issues
2. **Check troubleshooting section** above - Known issues & fixes
3. **Review console logs** - Errors and warnings
4. **Check Supabase dashboard** - Database status
5. **Review code comments** - Implementation details

---

**Setup Time Estimate:** 15-30 minutes

**Expected Outcome:** Fully functional live scoring platform ready for testing or deployment

Good luck with your Padel LiveScore platform! 🎾
