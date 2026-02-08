# Backend API with Server-Sent Events (SSE)

This backend provides a REST API with real-time updates via Server-Sent Events for campaign execution tracking.

## Architecture

### Backend Components

1. **Express Server** (`server/index.ts`)
   - REST API endpoints
   - CORS configuration
   - Health check endpoint

2. **SSE Service** (`server/services/sseService.ts`)
   - Manages real-time connections per campaign
   - Listens to Supabase database changes
   - Broadcasts updates to connected clients
   - Auto-reconnection support

3. **Campaign Execution Routes** (`server/routes/campaignExecution.ts`)
   - `GET /api/campaigns/:campaignId/execution` - Fetch all data
   - `POST /api/campaigns/:campaignId/tasks` - Create task
   - `PATCH /api/campaigns/:campaignId/tasks/:taskId` - Update task
   - `POST /api/campaigns/:campaignId/tasks/:taskId/move` - Move task between phases
   - `DELETE /api/campaigns/:campaignId/tasks/:taskId` - Delete task

4. **Supabase Admin Client** (`server/config/supabase.ts`)
   - Uses service role key (bypasses RLS)
   - Direct database access for API operations

### Frontend Integration

1. **Campaign Execution Service** (`src/services/campaignExecutionService.ts`)
   - Makes API calls instead of direct Supabase queries
   - Establishes SSE connection for real-time updates
   - Manages connection lifecycle

2. **useCampaignExecution Hook** (`src/hooks/useCampaignExecution.ts`)
   - Provides optimistic updates (instant UI feedback)
   - Listens to SSE events for server updates
   - Automatically refetches on external changes

## Setup

### 1. Install Backend Dependencies

```bash
npm install express cors @types/express @types/cors @types/node tsx concurrently
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_API_URL=http://localhost:3001/api
PORT=3001
```

**Important:** Get your `SUPABASE_SERVICE_ROLE_KEY` from Supabase Dashboard → Settings → API

### 3. Run Development Servers

**Option A: Run Both Together**
```bash
npm run dev:all
```

**Option B: Run Separately**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run dev:backend
```

## How It Works

### Task Creation Flow

1. User creates task in UI
2. `useCampaignExecution` hook calls `createTask()`
3. Hook **immediately** updates local state (optimistic update)
4. Service makes API call to `POST /api/campaigns/:id/tasks`
5. Backend creates task in database
6. Backend broadcasts `task-created` event via SSE
7. All connected clients (including other browsers) receive update
8. Clients refetch data to stay in sync

### Real-Time Updates

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser   │◄───SSE──┤  Backend API │◄──Supa──┤   Database   │
│   Client    │         │   (Express)  │  base   │  (Postgres)  │
└─────────────┘         └──────────────┘         └──────────────┘
      │                        │                         │
      │  1. Create Task        │                         │
      ├───────────────────────►│                         │
      │                        │  2. Insert              │
      │                        ├────────────────────────►│
      │                        │                         │
      │  3. SSE: task-created  │  4. DB Change Event    │
      │◄───────────────────────┤◄────────────────────────┤
      │                        │                         │
      │  5. Refetch Data       │                         │
      ├───────────────────────►│                         │
```

### SSE Connection

- **Endpoint:** `GET /api/events/:campaignId`
- **Connection:** Long-lived HTTP connection
- **Events:** `connected`, `task-created`, `task-updated`, `task-moved`, `task-deleted`, `history-update`
- **Heartbeat:** Every 30 seconds to keep connection alive
- **Auto-reconnect:** Browser automatically reconnects on disconnect

## Benefits

✅ **No Page Refresh Needed** - Updates appear instantly
✅ **Optimistic Updates** - UI responds immediately, syncs with server
✅ **Multi-User Support** - All users see changes in real-time
✅ **Reliable** - Server-Sent Events with auto-reconnection
✅ **Scalable** - One SSE connection per campaign, not per table
✅ **Type-Safe** - Full TypeScript throughout backend and frontend
✅ **Better Security** - Service role key only on server, not exposed to client

## Debugging

### Backend Logs

All logs prefixed with `[SSE]` or `[API]`:
```
[SSE] Client abc123 connected to campaign xyz789
[API] Creating task: New Creative Asset
[SSE] Broadcasting task-created to 3 clients
```

### Frontend Logs

All logs prefixed with `[CampaignExecutionService]` or `[useCampaignExecution]`:
```
[CampaignExecutionService] SSE connected: client-123
[useCampaignExecution] Real-time update received, refetching...
```

### Check SSE Connection

Open browser DevTools → Network tab → Filter by "events" → Should see a persistent connection with status "(pending)"

## Production Deployment

### Backend

1. Build: `npm run build:backend`
2. Deploy to Node.js hosting (Railway, Render, Heroku, etc.)
3. Set environment variables
4. Expose port 3001 (or configure PORT)

### Frontend

1. Update `VITE_API_URL` to production backend URL
2. Build: `npm run build`
3. Deploy to static hosting (Vercel, Netlify, etc.)

## Troubleshooting

**Problem:** SSE not connecting
- Check backend is running on port 3001
- Verify `VITE_API_URL` in `.env`
- Check browser console for connection errors

**Problem:** Updates not appearing
- Check backend logs for SSE broadcast messages
- Verify Supabase service role key is correct
- Check firewall/proxy isn't blocking SSE

**Problem:** CORS errors
- Verify `VITE_APP_URL` matches frontend URL
- Check CORS configuration in `server/index.ts`
