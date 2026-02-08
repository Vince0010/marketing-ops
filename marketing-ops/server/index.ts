import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import campaignExecutionRoutes from './routes/campaignExecution'
import { setupSSE } from './services/sseService'

const app = express()
const httpServer = createServer(app)

// Middleware
app.use(cors({
  origin: process.env.VITE_APP_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/campaigns', campaignExecutionRoutes)

// Setup SSE for real-time updates
setupSSE(app)

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`)
  console.log(`📡 SSE endpoint: http://localhost:${PORT}/api/events`)
})

export default app
