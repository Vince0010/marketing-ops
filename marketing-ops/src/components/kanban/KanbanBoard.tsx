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
import { cn } from '@/lib/utils'

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
    moveTaskToPhase: (taskId: string, newPhaseId: string | null, oldPhaseId: string | null) => Promise<MarketerAction>
    deleteTask: (taskId: string) => Promise<void>
    refetch: () => Promise<void>
}

interface KanbanBoardProps {
    campaignId: string
    externalData?: ExternalExecutionData
}

export default function KanbanBoard({ campaignId, externalData }: KanbanBoardProps) {
    const [activeTask, setActiveTask] = useState<MarketerAction | null>(null)
    const [editingTask, setEditingTask] = useState<{ task: MarketerAction; phase: ExecutionPhase | null } | null>(null)
    const [isDelayModalOpen, setIsDelayModalOpen] = useState(false)
    const [pendingMove, setPendingMove] = useState<{
        taskId: string,
        newPhaseId: string | null,
        oldPhaseId: string | null,
        taskTitle: string,
        daysLate: number
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

        // Initialize with backlog
        grouped.set('backlog', [])

        // Initialize all phases
        phases.forEach(phase => {
            grouped.set(phase.id, [])
        })

        // Group tasks
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
    // A task is "completed" in a phase when it has exited (exited_at is set)
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

        // Check for overdue task
        if (task.due_date && newPhaseId !== oldPhaseId) {
            const now = new Date()
            const dueDate = new Date(task.due_date)
            // Reset time part for accurate day comparison
            now.setHours(0, 0, 0, 0)
            dueDate.setHours(0, 0, 0, 0)

            console.log('[KanbanBoard] Checking overdue:', {
                taskTitle: task.title,
                dueDate: task.due_date,
                now: now.toISOString(),
                dueDateObj: dueDate.toISOString(),
                isOverdue: now > dueDate,
                hasReason: !!task.delay_reason
            })

            if (now > dueDate) {
                // Task is overdue
                // If it already has a delay reason, we might not need to ask again,
                // allows updating reason or skipping. For now, let's ask if it acts as a "gate".
                // Or maybe only if !task.delay_reason.
                // Requirement: "promt and ask why it is late".
                // Let's prompt if no reason exists OR if it's moving to a later phase (implies continuing work late).
                // Simplest UX: check if late and reason is missing.

                // Let's ask always if it's late to confirm the reason? 
                // Getting the "stored for context" part implies we want to capture it.
                // If I move it back and forth, do I answer every time?
                // Let's check `!task.delay_reason`.
                if (!task.delay_reason) {
                    const daysLate = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                    setPendingMove({
                        taskId,
                        newPhaseId,
                        oldPhaseId,
                        taskTitle: task.title,
                        daysLate
                    })
                    setIsDelayModalOpen(true)
                    return
                }
            }
        }

        try {
            await moveTaskToPhase(taskId, newPhaseId, oldPhaseId)
        } catch (err) {
            console.error('Failed to move task:', err)
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

    const handleEditTask = (task: MarketerAction, phase: ExecutionPhase | null) => {
        setEditingTask({ task, phase })
    }

    const handleSaveEdit = async (taskId: string, updates: Partial<MarketerAction>) => {
        await updateTask(taskId, updates)
    }

    const handleDeleteTask = async (task: MarketerAction) => {
        if (window.confirm(`Delete task "${task.title}"?`)) {
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
                <Loader2 className="w-8 h-8 animate-spin text-[#347698]" />
            </div>
        )
    }

    if (executionError) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <AlertCircle className="w-12 h-12 text-[#1B3D20]" />
                <p className="text-[#1B3D20]">{executionError}</p>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 text-sm bg-[#347698] text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                </button>
            </div>
        )
    }

    return (
        <div className="h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800">
                    Task Board
                </h2>
                <button
                    onClick={() => refetch()}
                    className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100"
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
            />

            {/* Empty state */}
            {phases.length === 0 && tasks.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    <p>No phases or tasks yet.</p>
                    <p className="text-sm mt-1">Create phases in the Stage Builder first.</p>
                </div>
            )}
        </div>
    )
}
