# Padel LiveScore - System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────┐    ┌──────────────────────────┐      │
│  │   Public Display         │    │   Admin Dashboard        │      │
│  │   (Home Page)            │    │   (Referee Interface)    │      │
│  │                          │    │                          │      │
│  │ • Match Cards            │    │ • Login Form             │      │
│  │ • Live Scores (5s poll)  │    │ • Score Input            │      │
│  │ • Standings Table        │    │ • Match Selection        │      │
│  │                          │    │ • Match Status           │      │
│  └──────────────────────────┘    └──────────────────────────┘      │
│           ▲                                ▲                        │
│           │ SSR + Polling                  │ HTTP + Auth            │
│           │ (5-sec interval)               │ (Session Cookie)       │
│           │                                │                        │
└───────────┼────────────────────────────────┼────────────────────────┘
            │                                │
            │ HTTPS / REST API               │
            │                                │
┌───────────┼────────────────────────────────┼────────────────────────┐
│           │  APPLICATION LAYER             │                        │
│           ▼                                ▼                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │          Next.js 16 - API Routes & Pages                  │    │
│  │                                                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │    │
│  │  │ /api/auth    │  │ /api/matches │  │ /api/admin   │    │    │
│  │  │              │  │              │  │              │    │    │
│  │  │ • login      │  │ • GET        │  │ • score      │    │    │
│  │  │ • logout     │  │   (with SSR) │  │   GET/POST   │    │    │
│  │  │ • check      │  │              │  │              │    │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │    │
│  │                                                             │    │
│  │  ┌────────────────────────────────────┐                   │    │
│  │  │     Middleware & Route Protection  │                   │    │
│  │  │                                    │                   │    │
│  │  │ • /admin/* routes require auth    │                   │    │
│  │  │ • Cookie verification             │                   │    │
│  │  └────────────────────────────────────┘                   │    │
│  │                                                             │    │
│  └────────────────────────────────────────────────────────────┘    │
│           ▲                           ▲                            │
│           │                           │                            │
│           │ Database Queries          │ Auth Validation            │
│           │                           │                            │
└───────────┼───────────────────────────┼────────────────────────────┘
            │                           │
            │                           │
            │          ┌────────────────┘
            │          │
            │          ▼
┌───────────┼──────────────────────────────────────────────────────────┐
│           │  BUSINESS LOGIC LAYER                                    │
│           │                                                          │
│  ┌────────▼──────────────────────────────────────────────┐         │
│  │  Match Service                                         │         │
│  │  ─────────────────────────────────────────────        │         │
│  │  • calculateMatchState()                               │         │
│  │  • updateMatchScore()                                  │         │
│  │  • getMatchScores()                                    │         │
│  │  • getUpcomingMatches()                                │         │
│  │  • getStandings()                                      │         │
│  │  • updateStandings()                                   │         │
│  └────────────────────────────────────────────────────────┘         │
│                                                                      │
│  ┌──────────────────────────────────────────────────────┐          │
│  │  Auth Service                                         │          │
│  │  ──────────────────────────────────                 │          │
│  │  • hashPassword()                                     │          │
│  │  • verifyPassword()                                   │          │
│  │  • verifyAdminUser()                                  │          │
│  │  • createAdminUser()                                  │          │
│  └──────────────────────────────────────────────────────┘          │
│                                                                      │
└──────────────┬──────────────────────────────────────────────────────┘
               │
               │ SQL Queries (Type-safe)
               │
┌──────────────▼──────────────────────────────────────────────────────┐
│                      DATA ACCESS LAYER                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│         ┌─────────────────────────────────────────┐               │
│         │  Supabase PostgreSQL Client             │               │
│         │  ──────────────────────────────────    │               │
│         │  • supabaseClient (browser)             │               │
│         │  • supabaseServer (server)              │               │
│         │  • Real-time subscriptions (optional)   │               │
│         └─────────────────────────────────────────┘               │
│                                                                      │
└──────────────┬──────────────────────────────────────────────────────┘
               │
               │ PostgreSQL Protocol
               │
┌──────────────▼──────────────────────────────────────────────────────┐
│                      DATABASE LAYER                                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │           Supabase PostgreSQL Database                     │   │
│  │           ──────────────────────────────                  │   │
│  │                                                             │   │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │   │
│  │  │ teams   │  │ matches  │  │ match_   │  │standings │  │   │
│  │  │         │  │          │  │ scores   │  │          │  │   │
│  │  │ ─────── │  │ ──────── │  │ ──────── │  │ ──────── │  │   │
│  │  │ id      │  │ id       │  │ id       │  │ id       │  │   │
│  │  │ name    │  │ team1_id │  │ match_id │  │ team_id  │  │   │
│  │  │ logo    │  │ team2_id │  │ set      │  │ matches_ │  │   │
│  │  │         │  │ status   │  │ game     │  │ played   │  │   │
│  │  │         │  │ winner   │  │ points   │  │ matches_ │  │   │
│  │  │         │  │ sched.   │  │          │  │ won      │  │   │
│  │  │         │  │ at       │  │          │  │ ...      │  │   │
│  │  └─────────┘  └──────────┘  └──────────┘  └──────────┘  │   │
│  │                                                             │   │
│  │  ┌────────────────────────────────────────────────────┐   │   │
│  │  │ admin_users                                        │   │   │
│  │  │ ──────────────────────────────────                │   │   │
│  │  │ id | username | password_hash | created_at       │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  │                                                             │   │
│  │  Indexes:                                                  │   │
│  │  • idx_matches_status                                      │   │
│  │  • idx_matches_scheduled_at                               │   │
│  │  • idx_match_scores_match_id                              │   │
│  │  • idx_standings_team_id                                   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Public User Flow

```
User visits home page
        │
        ▼
    Next.js SSR
    (getServerSideProps or direct fetch)
        │
        ▼
    /api/matches (GET)
    /api/standings (GET)
        │
        ▼
    Supabase Query
    SELECT * FROM matches 
    JOIN teams...
        │
        ▼
    Render HTML + Client JS
        │
        ▼
    Browser receives page
        │
        ▼
    useSocketMatch hook
    (polling every 5 seconds)
        │
        ├─────────────────┐
        │                 │
        ▼                 ▼
    /api/admin/score   Poll Loop
    (GET with matchId)
        │
        ▼
    calculateMatchState()
        │
        ▼
    Update React state
        │
        ▼
    Re-render component
        │
        ▼
    Live scores visible!
```

### Admin Score Update Flow

```
Referee clicks +1 button
        │
        ▼
    ScoreInput Component
    (onClick handler)
        │
        ▼
    POST /api/admin/score
    (with matchId, setNum, gameNum, points)
        │
        ▼
    Middleware checks auth
    (/api/auth/check)
        │
        ├─ Fail ──────────▶ 401 Unauthorized
        │
        └─ Pass
            │
            ▼
        updateMatchScore()
        INSERT/UPDATE match_scores
        │
        ▼
        getMatchScores()
        SELECT * FROM match_scores
        │
        ▼
        calculateMatchState()
        (Padel scoring logic)
        │
        ▼
        updateMatchStatus()
        UPDATE matches SET status='live'
        │
        ▼
        Response: { score, matchState }
        │
        ├─▶ Admin dashboard
        │   updates score input UI
        │
        └─▶ Public page
            polling detects new score
            within 5 seconds
```

### Authentication Flow

```
User enters credentials
        │
        ▼
    AdminLoginForm
    (username, password)
        │
        ▼
    POST /api/auth/login
        │
        ▼
    verifyAdminUser(username, password)
        │
        ├─ Query admin_users table
        │
        ├─ bcrypt.compare(password, hash)
        │
        └─ If invalid: Return 401
        │
        ▼
    Create session cookie
    (admin_token, httpOnly, 7-day expiry)
        │
        ▼
    Redirect to /admin/dashboard
        │
        ▼
    Middleware checks cookie on protected routes
    (/middleware.ts)
        │
        ├─ Cookie exists ──────▶ Allow access
        │
        └─ Cookie missing ────▶ Redirect to /admin/login
```

## Component Hierarchy

```
Layout
├── Header
│   ├── Logo
│   ├── Navigation
│   └── Auth Button (if admin)
│
└── Page
    ├── Home Page (/)
    │   ├── Hero Section
    │   ├── MatchCard
    │   │   ├── useSocketMatch hook
    │   │   ├── Status Badge
    │   │   ├── Team Logos
    │   │   └── Score Display
    │   │
    │   └── Standings
    │       └── Table
    │           └── Team Rows
    │
    ├── Login Page (/admin/login)
    │   └── AdminLoginForm
    │       ├── Username Input
    │       ├── Password Input
    │       └── Login Button
    │
    └── Dashboard (/admin/dashboard)
        ├── Matches List
        │   └── Match Buttons
        │
        └── ScoreInput
            ├── Team Info
            ├── Sets Display
            ├── Score Display
            ├── Control Buttons (+1)
            └── Reset Button
```

## State Management

```
┌─────────────────────────────────────────┐
│        Global Application State          │
├─────────────────────────────────────────┤
│                                          │
│  Session State (Cookies)                │
│  ├── admin_token (httpOnly)             │
│  └── Expires: 7 days                    │
│                                          │
│  Component State (React)                │
│  ├── Home: matches, standings           │
│  ├── Dashboard: selectedMatch, scores   │
│  └── ScoreInput: matchState             │
│                                          │
│  Server State (Database)                │
│  ├── Teams, Matches, Scores             │
│  ├── Standings (calculated)             │
│  └── Admin Users (hashed passwords)     │
│                                          │
└─────────────────────────────────────────┘
```

## Padel Scoring Logic (match-service.ts)

```
calculateMatchState(scores) {
    │
    ├─ Group scores by set
    │
    ├─ For each set:
    │  ├─ Is 6+ games with 2+ margin? → Set won
    │  ├─ Is 6-6? → Calculate tiebreaker (7+ with 2+ margin)
    │  └─ Add to completed sets
    │
    ├─ Count sets won (team1, team2)
    │
    ├─ Check match completion:
    │  └─ First to 2 sets wins match
    │
    └─ Return:
       ├─ team1Sets / team2Sets
       ├─ currentSet { team1Games, team2Games }
       ├─ matchComplete boolean
       └─ winner (team1 | team2 | undefined)
}
```

## Real-Time Update Strategy

### Current Implementation (Polling)

```
Client
  │
  ├─▶ Fetch /api/admin/score (every 5 seconds)
  │   │
  │   ▼
  │   API calculates state
  │   │
  │   ▼
  │   Return JSON
  │   │
  │   ▼
  │   Update React state
  │   │
  │   ▼
  │   Re-render component
  │
  └─ Repeat interval
```

### Future Implementation (WebSocket)

```
Client                          Server
  │                              │
  ├─ Socket.io Connection ─────▶ │
  │                              │
  ├─ join-match event ─────────▶ │ Subscribe to room
  │                              │
  │                    ┌─────────┤
  │                    │ (Score updated)
  │                    │
  │ ◀─ score-updated ──┤
  │   (Real-time)      │
  │                    └─────────┤
  │   Update state                │
  │   Re-render                   │
  │                              │
  └─ leave-match event ────────▶ │
```

## Database Relationships

```
teams
  ├─▶ matches (1:many via team1_id, team2_id)
  │   └─▶ match_scores (1:many via match_id)
  │
  └─▶ standings (1:1 via team_id)

admin_users
  └─▶ No relationships (authentication only)
```

## Performance Considerations

### Caching Strategy
```
Home Page (/)
├─ SSR: Revalidate every 60 seconds
├─ Client: Polling every 5 seconds
└─ Browser cache: Public, max-age=60

Standings (/api/standings)
├─ API: Revalidate every 120 seconds
└─ Client: Refresh on mount

Matches (/api/matches)
├─ API: Revalidate every 60 seconds
└─ SSR: On page render
```

### Database Optimization
```
Indexes:
├─ matches(status) - Quick status filtering
├─ matches(scheduled_at) - Sorting by time
├─ match_scores(match_id) - Score lookup
└─ standings(team_id) - Quick standing lookup
```

## Security Layers

```
Public Requests
     ▼
GET only (no mutations)
     ▼
Allow direct database read

Admin Requests
     ▼
Check auth cookie
     ▼
Middleware verification
     ▼
Validate inputs
     ▼
Database write with auth context
     ▼
Log operations
```

## Deployment Architecture

```
Vercel (Frontend)
  ├─ Next.js server
  ├─ API routes
  └─ Static files
       │
       ▼ HTTPS
       │
Supabase (Database)
  ├─ PostgreSQL
  ├─ Authentication
  └─ Real-time subscriptions
       │
       ▼ TLS
       │
Postgres Server

Optional:
Railway/Heroku (Socket.io)
  └─ WebSocket server
     (for production real-time)
```

---

This architecture ensures:
- **Scalability** - Stateless API routes, database indexes
- **Performance** - SSR caching, polling optimization
- **Security** - Hashed passwords, session-based auth
- **Maintainability** - Clear separation of concerns
- **Reliability** - Database constraints, error handling

