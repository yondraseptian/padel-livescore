# Padel LiveScore Setup Guide

## Overview

This is a complete live scoring platform for padel tennis tournaments with real-time updates, standings tracking, and a referee dashboard.

## Features

- **Public Display**: SSR homepage with upcoming matches and standings
- **Live Scoring**: Real-time score updates via Socket.io WebSocket
- **Admin Dashboard**: Referee interface to enter and manage scores
- **Leaderboard**: Auto-updating tournament standings
- **Best of 3 Sets**: Standard padel format (6 games per set, 2-point margin)

## Architecture

### Frontend
- **Next.js 16** with App Router for SSR
- **React 19** for interactive components
- **Tailwind CSS** for styling
- **Socket.io Client** for real-time updates
- **shadcn/ui** components

### Backend
- **Next.js API Routes** for RESTful endpoints
- **Supabase PostgreSQL** for data persistence
- **Socket.io Server** for WebSocket communication
- **bcryptjs** for password hashing

### Database Schema
- `teams` - Team information
- `matches` - Match schedule and status
- `match_scores` - Detailed game/set scores
- `standings` - Leaderboard calculations
- `admin_users` - Referee authentication

## Setup Instructions

### 1. Database Setup

The Supabase database is already connected. To create the tables:

```bash
# The SQL migration file is ready at: scripts/01-create-tables.sql
# In Supabase dashboard, go to SQL Editor and run the SQL directly
```

**Or manually create tables via Supabase UI:**

Copy and paste the content from `scripts/01-create-tables.sql` into Supabase SQL Editor.

### 2. Create Admin User

After database is set up, create a default admin user:

```bash
# Using Node.js directly
node -r tsconfig-paths/register scripts/init-admin.js
```

**Default credentials for testing:**
- Username: `admin`
- Password: `admin123`

**⚠️ IMPORTANT:** Change these in production!

### 3. Environment Variables

All Supabase environment variables should already be configured. To verify:

```bash
# Check your .env.local file has these variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 4. Run Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

### 5. Socket.io Server (Optional for Production)

For production real-time features, run the separate Socket.io server:

```bash
node server.js
```

The server runs on port 3001 by default.

## Usage Guide

### Public Display (Home Page)

- Visit `http://localhost:3000`
- View upcoming and live matches
- Check tournament standings
- Live score updates appear automatically for ongoing matches

### Admin Dashboard

1. Navigate to `http://localhost:3000/admin/login`
2. Login with admin credentials
3. Select a match from the list
4. Click team buttons to increment score
5. Score updates broadcast in real-time to all viewers

## API Endpoints

### Public APIs

- `GET /api/matches` - Get upcoming/live matches
- `GET /api/standings` - Get current standings

### Admin APIs (Requires Authentication)

- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/check` - Check if authenticated
- `GET /api/admin/score?matchId=<id>` - Get match scores
- `POST /api/admin/score` - Update match score

## Socket.io Events

### Client -> Server
- `join-match` - Subscribe to match updates
- `update-score` - Report score change
- `match-started` - Start a match
- `match-completed` - End a match

### Server -> Client
- `score-updated` - New score available
- `match-started` - Match has started
- `match-completed` - Match has ended
- `standings-updated` - Standings changed

## File Structure

```
/app
  /api
    /auth - Authentication endpoints
    /admin - Admin score management
    /matches - Match data endpoints
    /standings - Standings endpoint
  /admin
    /login - Admin login page
    /dashboard - Score entry dashboard
  layout.tsx - Root layout
  page.tsx - Home page

/components
  match-card.tsx - Display single match with live score
  standings.tsx - Leaderboard component
  score-input.tsx - Score entry form
  admin-login-form.tsx - Login form

/lib
  db.ts - Database types and clients
  auth.ts - Authentication utilities
  socket.ts - Socket.io utilities
  match-service.ts - Match scoring logic
```

## Padel Scoring Rules

**Format: Best of 3 sets**

- First team to win 2 sets wins the match
- Each set: First team to 6 games with 2+ game lead wins
- If 6-6: Play tiebreaker (first to 7 points with 2+ lead)
- Games are counted 0-15-30-40-Deuce-Advantage-Win

## Troubleshooting

### Database Connection Issues

```bash
# Test Supabase connection
curl -H "Authorization: Bearer YOUR_ANON_KEY" \
  https://your-project.supabase.co/rest/v1/teams
```

### Socket.io Not Updating

1. Check Socket.io server is running: `node server.js`
2. Verify `NEXT_PUBLIC_SOCKET_URL` environment variable is set
3. Check browser console for connection errors

### Admin Login Not Working

1. Verify admin user was created
2. Check database has `admin_users` table
3. Ensure password is correctly hashed

## Production Deployment

1. **Database**: Supabase handles this
2. **Frontend**: Deploy Next.js to Vercel
3. **Socket.io Server**: Deploy to separate Node.js host (Heroku, Railway, etc.)
4. **Environment Variables**: Update all URLs to production
5. **Security**: 
   - Change default admin credentials
   - Enable HTTPS
   - Use environment variable for JWT secret
   - Implement rate limiting

## Future Enhancements

- [ ] Multiple tournament/league support
- [ ] Player statistics and history
- [ ] Photo gallery for matches
- [ ] Mobile app for scoring
- [ ] Email notifications for match updates
- [ ] Streaming integration
- [ ] Advanced statistics (rally length, ace count, etc.)
- [ ] Tournament brackets/seeding
- [ ] Spectator chat during live matches

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API endpoint documentation
3. Check Socket.io console for connection logs
4. Verify Supabase database tables exist and have data
