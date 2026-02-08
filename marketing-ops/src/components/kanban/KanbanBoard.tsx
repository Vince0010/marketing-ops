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
    moveTaskToPhase: (taskId: string, newPhaseId: string | null, oldPhaseId: string | null) => Promise<MarketerAction>
    refetch: () => Promise<void>
}

interface KanbanBoardProps {
    campaignId: string
    externalData?: ExternalExecutionData
}

export default function KanbanBoard({ campaignId, externalData }: KanbanBoardProps) {
    const [activeTask, setActiveTask] = useState<MarketerAction | null>(null)

    // Use own hook if no external data provided
    const ownHook = useCampaignExecution(externalData ? undefined : campaignId)

    // Use external data or own hook data
    const {
        phases,
        tasks,
        loading: executionLoading,
        error: executionError,
        createTask,
        moveTaskToPhase,
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

        try {
            await moveTaskToPhase(taskId, newPhaseId, oldPhaseId)
        } catch (err) {
            console.error('Failed to move task:', err)
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
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <p className="text-red-600 dark:text-red-400">{executionError}</p>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
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
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                    Task Board
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

            {/* Empty state */}
            {phases.length === 0 && tasks.length === 0 && (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <p>No phases or tasks yet.</p>
                    <p className="text-sm mt-1">Create phases in the Stage Builder first.</p>
                </div>
            )}
        </div>
    )
}
