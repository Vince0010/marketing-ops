import { Express, Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase.js'

interface SSEClient {
    id: string
    campaignId: string
    response: Response
}

class SSEService {
    private clients: Map<string, SSEClient[]> = new Map()

    addClient(campaignId: string, clientId: string, res: Response) {
        if (!this.clients.has(campaignId)) {
            this.clients.set(campaignId, [])
        }

        this.clients.get(campaignId)!.push({ id: clientId, campaignId, response: res })

        console.log(`[SSE] Client ${clientId} connected to campaign ${campaignId}`)
        console.log(`[SSE] Total clients for campaign: ${this.clients.get(campaignId)!.length}`)
    }

    removeClient(campaignId: string, clientId: string) {
        const clients = this.clients.get(campaignId)
        if (clients) {
            const filtered = clients.filter(c => c.id !== clientId)
            if (filtered.length === 0) {
                this.clients.delete(campaignId)
            } else {
                this.clients.set(campaignId, filtered)
            }
            console.log(`[SSE] Client ${clientId} disconnected from campaign ${campaignId}`)
        }
    }

    broadcast(campaignId: string, event: string, data: any) {
        const clients = this.clients.get(campaignId)
        if (!clients || clients.length === 0) {
            console.log(`[SSE] No clients to broadcast to for campaign ${campaignId}`)
            return
        }

        console.log(`[SSE] Broadcasting ${event} to ${clients.length} clients for campaign ${campaignId}`)

        const deadClients: string[] = []

        clients.forEach(client => {
            try {
                client.response.write(`event: ${event}\n`)
                client.response.write(`data: ${JSON.stringify(data)}\n\n`)
            } catch (error) {
                console.error(`[SSE] Error sending to client ${client.id}:`, error)
                deadClients.push(client.id)
            }
        })

        // Clean up dead connections
        deadClients.forEach(clientId => this.removeClient(campaignId, clientId))
    }

    setupDatabaseListeners() {
        console.log('[SSE] Setting up database listeners...')

        // Listen to marketer_actions changes
        supabaseAdmin
            .channel('db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'marketer_actions' },
                (payload) => {
                    console.log('[SSE] marketer_actions change detected:', payload.eventType)

                    // @ts-ignore - campaign_id exists in the record
                    const campaignId = payload.new?.campaign_id || payload.old?.campaign_id
                    if (campaignId) {
                        this.broadcast(campaignId, 'task-update', {
                            type: payload.eventType,
                            data: payload.new || payload.old
                        })
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'task_phase_history' },
                (payload) => {
                    console.log('[SSE] task_phase_history change detected:', payload.eventType)

                    // Broadcast to all connected clients
                    this.clients.forEach((clients, campaignId) => {
                        this.broadcast(campaignId, 'history-update', {
                            type: payload.eventType,
                            data: payload.new || payload.old
                        })
                    })
                }
            )
            .subscribe((status) => {
                console.log('[SSE] Database listener status:', status)
            })
    }
}

export const sseService = new SSEService()

export function setupSSE(app: Express) {
    // Setup database listeners
    sseService.setupDatabaseListeners()

    // SSE endpoint
    app.get('/api/events/:campaignId', (req: Request, res: Response) => {
        const { campaignId } = req.params
        const clientId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no') // Disable nginx buffering

        // Send initial connection message
        res.write(`event: connected\n`)
        res.write(`data: ${JSON.stringify({ clientId, campaignId })}\n\n`)

        // Add client
        sseService.addClient(campaignId, clientId, res)

        // Send heartbeat every 30 seconds
        const heartbeatInterval = setInterval(() => {
            try {
                res.write(`:heartbeat\n\n`)
            } catch (error) {
                clearInterval(heartbeatInterval)
            }
        }, 30000)

        // Handle client disconnect
        req.on('close', () => {
            clearInterval(heartbeatInterval)
            sseService.removeClient(campaignId, clientId)
        })
    })
}
