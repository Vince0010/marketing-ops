import { useState, useMemo } from 'react'
import {
    DndContext,
    DragOverlay,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
import { useCampaignExecution } from '@/hooks/useCampaignExecution'
import type { ExecutionPhase } from '@/types/phase'
import type { MarketerAction, MarketerActionInsert, TaskPhaseHistory } from '@/types/actions'
import { KanbanColumn } from './KanbanColumn'
import { ActionCard } from './ActionCard'
import { TaskEditModal } from './TaskEditModal'
import { DelayReasonModal } from './DelayReasonModal'
import { BackwardMoveModal } from './BackwardMoveModal'

/**
 * External data interface to share state with parent component
 */
interface ExternalExecutionData {
    phases: ExecutionPhase[]
    tasks: MarketerAction[]
    history: TaskPhaseHistory[]
    loading: boolean
    error: string | null
    createTask: (taskData: MarketerActionInsert) => Promise<MarketerAction>
    updateTask: (taskId: string, updates: Partial<MarketerAction>) => Promise<MarketerAction>
    moveTaskToPhase: (taskId: string, newPhaseId: string | null, oldPhaseId: string | null, delayReason?: string, restartPhase?: boolean) => Promise<MarketerAction>
    deleteTask: (taskId: string) => Promise<void>
    refetch: () => Promise<void>
}

interface KanbanBoardProps {
    campaignId: string
    externalData?: ExternalExecutionData
}

/**
 * Calculate time a task has spent in its current phase (in minutes)
 */
function calculateTimeInPhase(task: MarketerAction): number {
    const storedMinutes = task.time_in_phase_minutes || 0
    if (task.started_at) {
        const startedAt = new Date(task.started_at)
        const now = new Date()
        const elapsedMs = now.getTime() - startedAt.getTime()
        const elapsedMinutes = Math.floor(elapsedMs / 60000)
        return storedMinutes + elapsedMinutes
    }
    return storedMinutes
}

/**
 * Get per-card time budget from the phase's planned duration (8-hour workdays)
 */
function getPhaseBudgetMinutes(phase?: ExecutionPhase | null): number | null {
    if (!phase?.planned_duration_days) return null
    return phase.planned_duration_days * 8 * 60
}

function formatTime(minutes: number): string {
    if (minutes <= 0) return '0m'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMins = minutes % 60
    if (remainingMins === 0) return `${hours}h`
    return `${hours}h ${remainingMins}m`
}

export default function KanbanBoard({ campaignId, externalData }: KanbanBoardProps) {
    const [activeTask, setActiveTask] = useState<MarketerAction | null>(null)
    const [editingTask, setEditingTask] = useState<{ task: MarketerAction; phase: ExecutionPhase | null } | null>(null)
    const [isDelayModalOpen, setIsDelayModalOpen] = useState(false)
    const [isBackwardMoveModalOpen, setIsBackwardMoveModalOpen] = useState(false)
    const [pendingMove, setPendingMove] = useState<{
        taskId: string,
        newPhaseId: string | null,
        oldPhaseId: string | null,
        taskTitle: string,
        daysLate: number,
        overByTime?: string,
    } | null>(null)
    const [pendingBackwardMove, setPendingBackwardMove] = useState<{
        taskId: string,
        newPhaseId: string | null,
        oldPhaseId: string | null,
        taskTitle: string,
        phaseName: string,
        previousTime: string,
    } | null>(null)

    // Use own hook if no external data provided
    const ownHook = useCampaignExecution(externalData ? undefined : campaignId)

    // Use external data or own hook data
    const {
        phases,
        tasks,
        history,
        loading: executionLoading,
        error: executionError,
        createTask,
        updateTask,
        moveTaskToPhase,
        deleteTask,
        refetch,
    } = externalData || ownHook

    // Configure drag sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )

    // Group tasks by phase
    const tasksByPhase = useMemo(() => {
        const grouped = new Map<string, MarketerAction[]>()
        grouped.set('backlog', [])
        phases.forEach(phase => {
            grouped.set(phase.id, [])
        })
        tasks.forEach(task => {
            const phaseId = task.phase_id || 'backlog'
            const existing = grouped.get(phaseId) || []
            grouped.set(phaseId, [...existing, task])
        })
        return grouped
    }, [phases, tasks])

    // Sort phases by phase_number
    const sortedPhases = useMemo(() => {
        return [...phases].sort((a, b) => a.phase_number - b.phase_number)
    }, [phases])

    // Calculate completed count per phase from history
    const completedByPhase = useMemo(() => {
        const counts = new Map<string, number>()
        history.forEach(entry => {
            if (entry.exited_at && entry.phase_id) {
                const current = counts.get(entry.phase_id) || 0
                counts.set(entry.phase_id, current + 1)
            }
        })
        return counts
    }, [history])

    /**
     * Determine if a move is forward (to a higher phase_number) or backward
     */
    const isForwardMove = (oldPhaseId: string | null, newPhaseId: string | null): boolean => {
        // Moving from backlog to any phase is forward
        if (!oldPhaseId && newPhaseId) return true
        // Moving from any phase to backlog is backward
        if (oldPhaseId && !newPhaseId) return false

        const oldPhase = phases.find(p => p.id === oldPhaseId)
        const newPhase = phases.find(p => p.id === newPhaseId)
        if (!oldPhase || !newPhase) return true

        return newPhase.phase_number > oldPhase.phase_number
    }

    const handleDragStart = (event: DragStartEvent) => {
        const task = tasks.find(t => t.id === event.active.id)
        setActiveTask(task || null)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveTask(null)

        if (!over) return

        const taskId = active.id as string
        const task = tasks.find(t => t.id === taskId)
        if (!task) return

        const newPhaseId = over.id === 'backlog' ? null : (over.id as string)
        const oldPhaseId = task.phase_id

        // Don't do anything if dropped in same column
        if (newPhaseId === oldPhaseId) return

        const movingForward = isForwardMove(oldPhaseId, newPhaseId)

        // Validate phase exists if moving to a phase (not backlog)
        if (newPhaseId) {
            const newPhase = phases.find(p => p.id === newPhaseId)
            if (!newPhase) {
                console.error('[KanbanBoard] Target phase not found:', newPhaseId, 'Available phases:', phases.map(p => ({ id: p.id, name: p.phase_name })))
                alert('Invalid phase. The target phase does not exist. Please refresh the page and try again.')
                return
            }
        }

        // Prevent skipping phases when moving forward
        if (movingForward && oldPhaseId && newPhaseId) {
            const oldPhase = phases.find(p => p.id === oldPhaseId)
            const newPhase = phases.find(p => p.id === newPhaseId)
            
            if (oldPhase && newPhase) {
                const phaseDiff = newPhase.phase_number - oldPhase.phase_number
                if (phaseDiff > 1) {
                    // User is trying to skip phases
                    alert(`Cannot skip phases. Please move the card sequentially through each phase.\n\nCurrent phase: ${oldPhase.phase_name} (${oldPhase.phase_number})\nTarget phase: ${newPhase.phase_name} (${newPhase.phase_number})\n\nPlease move to phase ${oldPhase.phase_number + 1} first.`)
                    return
                }
            }
        }

        // Check if moving BACKWARD to a previously completed phase
        if (!movingForward && newPhaseId && task.completed_phases?.includes(newPhaseId)) {
            // Get the phase name and previous time spent
            const newPhase = phases.find(p => p.id === newPhaseId)
            const prevTimeEntries = history.filter(
                h => h.action_id === taskId && h.phase_id === newPhaseId && h.exited_at !== null
            )
            const totalPreviousMinutes = prevTimeEntries.reduce((sum, h) => sum + (h.time_spent_minutes || 0), 0)

            if (totalPreviousMinutes > 0 && newPhase) {
                setPendingBackwardMove({
                    taskId,
                    newPhaseId,
                    oldPhaseId,
                    taskTitle: task.title,
                    phaseName: newPhase.phase_name,
                    previousTime: formatTime(totalPreviousMinutes),
                })
                setIsBackwardMoveModalOpen(true)
                return
            }
        }

        // Only gate forward moves — check time budget overdue
        if (movingForward && oldPhaseId) {
            const oldPhase = phases.find(p => p.id === oldPhaseId)
            const budgetMinutes = getPhaseBudgetMinutes(oldPhase)
            const timeSpent = calculateTimeInPhase(task)

            if (budgetMinutes !== null && timeSpent > budgetMinutes) {
                const overByMinutes = timeSpent - budgetMinutes
                setPendingMove({
                    taskId,
                    newPhaseId,
                    oldPhaseId,
                    taskTitle: task.title,
                    daysLate: 0,
                    overByTime: formatTime(overByMinutes),
                })
                setIsDelayModalOpen(true)
                return
            }
        }

        // Also check due_date overdue (existing behavior)
        if (movingForward && task.due_date && !task.delay_reason) {
            const now = new Date()
            const dueDate = new Date(task.due_date)
            now.setHours(0, 0, 0, 0)
            dueDate.setHours(0, 0, 0, 0)

            if (now > dueDate) {
                const daysLate = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                setPendingMove({
                    taskId,
                    newPhaseId,
                    oldPhaseId,
                    taskTitle: task.title,
                    daysLate,
                })
                setIsDelayModalOpen(true)
                return
            }
        }

        try {
            console.log('[KanbanBoard] Executing move:', { taskId, from: oldPhaseId, to: newPhaseId })
            await moveTaskToPhase(taskId, newPhaseId, oldPhaseId)
            console.log('[KanbanBoard] Move completed successfully')
        } catch (err) {
            console.error('[KanbanBoard] Failed to move task:', err)
            const errorMsg = err instanceof Error ? err.message : 'Unknown error'
            alert(`Failed to move card: ${errorMsg}\\n\\nCheck the browser console for details. Make sure the backend server is running (npm run dev:all).`)
        }
    }

    const handleDelayConfirm = async (reason: string) => {
        if (!pendingMove) return

        try {
            await moveTaskToPhase(
                pendingMove.taskId,
                pendingMove.newPhaseId,
                pendingMove.oldPhaseId,
                reason
            )
        } catch (err) {
            console.error('Failed to move task with reason:', err)
        } finally {
            setIsDelayModalOpen(false)
            setPendingMove(null)
        }
    }

    const handleBackwardMoveResume = async () => {
        if (!pendingBackwardMove) return

        try {
            // Resume with previous time (restartPhase = false, which is default)
            await moveTaskToPhase(
                pendingBackwardMove.taskId,
                pendingBackwardMove.newPhaseId,
                pendingBackwardMove.oldPhaseId,
                undefined,
                false // Don't restart, carry over time
            )
        } catch (err) {
            console.error('Failed to move task backward (resume):', err)
        } finally {
            setIsBackwardMoveModalOpen(false)
            setPendingBackwardMove(null)
        }
    }

    const handleBackwardMoveRestart = async () => {
        if (!pendingBackwardMove) return

        try {
            // Start fresh (restartPhase = true)
            await moveTaskToPhase(
                pendingBackwardMove.taskId,
                pendingBackwardMove.newPhaseId,
                pendingBackwardMove.oldPhaseId,
                undefined,
                true // Restart from 0
            )
        } catch (err) {
            console.error('Failed to move task backward (restart):', err)
        } finally {
            setIsBackwardMoveModalOpen(false)
            setPendingBackwardMove(null)
        }
    }

    const handleEditTask = (task: MarketerAction, phase: ExecutionPhase | null) => {
        setEditingTask({ task, phase })
    }

    const handleSaveEdit = async (taskId: string, updates: Partial<MarketerAction>) => {
        await updateTask(taskId, updates)
    }

    const handleDeleteTask = async (task: MarketerAction) => {
        if (window.confirm(`Delete ad "${task.title}"?`)) {
            try {
                await deleteTask(task.id)
            } catch (err) {
                console.error('Failed to delete task:', err)
            }
        }
    }

    const handleCreateTask = async (taskData: MarketerActionInsert) => {
        await createTask(taskData)
    }

    if (executionLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    if (executionError) {
        return (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-4">
                    <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                            Failed to load Kanban board
                        </h3>
                        <p className="text-sm text-red-700 dark:text-red-300 mb-3">{executionError}</p>
                        {executionError.includes('backend server') && (
                            <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/40 rounded-lg">
                                <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-2">
                                    To start the backend server:
                                </p>
                                <code className="block bg-red-200 dark:bg-red-900/60 p-2 rounded text-sm font-mono text-red-900 dark:text-red-100">
                                    cd marketing-ops && npm run dev:all
                                </code>
                            </div>
                        )}
                        <button
                            onClick={() => refetch()}
                            className="mt-4 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry Connection
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                    Ad Deliverables Board
                </h2>
                <button
                    onClick={() => refetch()}
                    className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Refresh"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Kanban Board */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {/* Backlog Column */}
                    <KanbanColumn
                        phase={null}
                        tasks={tasksByPhase.get('backlog') || []}
                        campaignId={campaignId}
                        onCreateTask={handleCreateTask}
                        onEditTask={handleEditTask}
                        onDeleteTask={handleDeleteTask}
                        isBacklog
                    />

                    {/* Phase Columns */}
                    {sortedPhases.map(phase => (
                        <KanbanColumn
                            key={phase.id}
                            phase={phase}
                            tasks={tasksByPhase.get(phase.id) || []}
                            campaignId={campaignId}
                            onCreateTask={handleCreateTask}
                            onEditTask={handleEditTask}
                            onDeleteTask={handleDeleteTask}
                            completedCount={completedByPhase.get(phase.id) || 0}
                        />
                    ))}
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeTask ? (
                        <div className="opacity-80 rotate-3">
                            <ActionCard task={activeTask} isDragging />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Task Edit Modal */}
            {editingTask && (
                <TaskEditModal
                    task={editingTask.task}
                    phase={editingTask.phase}
                    onSave={handleSaveEdit}
                    onClose={() => setEditingTask(null)}
                />
            )}

            <DelayReasonModal
                isOpen={isDelayModalOpen}
                onClose={() => {
                    setIsDelayModalOpen(false)
                    setPendingMove(null)
                }}
                onConfirm={handleDelayConfirm}
                taskTitle={pendingMove?.taskTitle || ''}
                daysLate={pendingMove?.daysLate || 0}
                overByTime={pendingMove?.overByTime}
            />

            <BackwardMoveModal
                isOpen={isBackwardMoveModalOpen}
                onClose={() => {
                    setIsBackwardMoveModalOpen(false)
                    setPendingBackwardMove(null)
                }}
                onResume={handleBackwardMoveResume}
                onRestart={handleBackwardMoveRestart}
                taskTitle={pendingBackwardMove?.taskTitle || ''}
                phaseName={pendingBackwardMove?.phaseName || ''}
                previousTime={pendingBackwardMove?.previousTime || '0m'}
            />

            {/* Empty state */}
            {phases.length === 0 && tasks.length === 0 && (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <p>No phases or ads yet.</p>
                    <p className="text-sm mt-1">Create phases in the Stage Builder first.</p>
                </div>
            )}
        </div>
    )
}
