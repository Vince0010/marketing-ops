import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import campaignExecutionRoutes from './routes/campaignExecution.js'
import { setupSSE } from './services/sseService.js'

const app = express()
const httpServer = createServer(app)

// Middleware
// Allow multiple localhost ports for development (Vite may use different ports)
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    process.env.VITE_APP_URL
].filter(Boolean) as string[]

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true)

        if (allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            console.log('[CORS] Blocked origin:', origin)
            callback(new Error('Not allowed by CORS'))
        }
    },
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
