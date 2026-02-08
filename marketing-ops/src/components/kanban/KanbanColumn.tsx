import { useState, useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, MoreHorizontal, Clock, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react'
import type { ExecutionPhase } from '@/types/phase'
import type { MarketerAction, MarketerActionInsert } from '@/types/actions'
import { ActionCard } from './ActionCard'
import { ActionCardEditor } from './ActionCardEditor'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
    phase: ExecutionPhase | null // null = Backlog
    tasks: MarketerAction[]
    campaignId: string
    onCreateTask: (task: MarketerActionInsert) => Promise<void>
    onTaskClick?: (task: MarketerAction, phase: ExecutionPhase | null) => void
    completedCount?: number // Number of tasks that have completed this phase
    isBacklog?: boolean
}

interface SortableTaskProps {
    task: MarketerAction
    phase: ExecutionPhase | null
    onTaskClick?: (task: MarketerAction, phase: ExecutionPhase | null) => void
}

/**
 * Calculate total time spent by a task in its current phase
 */
function calculateTaskTime(task: MarketerAction): number {
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
 * Format minutes into human-readable string
 */
function formatTime(minutes: number): string {
    if (minutes < 60) {
        return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMins = minutes % 60
    if (remainingMins === 0) {
        return `${hours}h`
    }
    return `${hours}h ${remainingMins}m`
}

function SortableTask({ task, phase, onTaskClick }: SortableTaskProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const handleClick = () => {
        if (onTaskClick) {
            onTaskClick(task, phase)
        }
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
        >
            <ActionCard
                task={task}
                phase={phase}
                onClick={handleClick}
                isDragging={isDragging}
            />
        </div>
    )
}

export function KanbanColumn({ phase, tasks, campaignId, onCreateTask, onTaskClick, completedCount = 0, isBacklog }: KanbanColumnProps) {
    const [isAddingTask, setIsAddingTask] = useState(false)

    const columnId = phase?.id || 'backlog'

    const { setNodeRef, isOver } = useDroppable({
        id: columnId,
    })

    // Calculate phase metrics
    const phaseMetrics = useMemo(() => {
        const totalMinutes = tasks.reduce((sum, task) => sum + calculateTaskTime(task), 0)
        const plannedMinutes = phase?.planned_duration_days
            ? phase.planned_duration_days * 8 * 60 // Assume 8-hour workdays
            : null

        const driftMinutes = plannedMinutes !== null
            ? totalMinutes - plannedMinutes
            : null

        return {
            totalMinutes,
            plannedMinutes,
            driftMinutes,
            isOverBudget: driftMinutes !== null && driftMinutes > 0,
        }
    }, [tasks, phase])

    const handleSaveTask = async (taskData: MarketerActionInsert) => {
        await onCreateTask(taskData)
        setIsAddingTask(false)
    }

    const taskIds = tasks.map(t => t.id)

    return (
        <div className="flex flex-col min-w-[280px] max-w-[320px] bg-slate-100 dark:bg-slate-900 rounded-lg">
            {/* Column Header */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {isBacklog ? 'Backlog' : phase?.phase_name}
                        </h3>
                        {/* For backlog, just show count */}
                        {isBacklog ? (
                            <span className="px-2 py-0.5 text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                                {tasks.length}
                            </span>
                        ) : (
                            /* For phases, show progress as completed/total */
                            <span className={cn(
                                "px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1",
                                tasks.length + completedCount === 0
                                    ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                    : completedCount === tasks.length + completedCount
                                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                        : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                            )}>
                                {completedCount > 0 && <CheckCircle className="w-3 h-3" />}
                                {completedCount}/{tasks.length + completedCount}
                            </span>
                        )}
                    </div>
                    <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>

                {/* Phase Metrics - Only show for actual phases (not backlog) */}
                {!isBacklog && phase && (
                    <div className="flex items-center gap-3 text-xs">
                        {/* Total Time */}
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(phaseMetrics.totalMinutes)}</span>
                        </div>

                        {/* Planned Time */}
                        {phaseMetrics.plannedMinutes !== null && (
                            <span className="text-slate-400 dark:text-slate-500">
                                / {formatTime(phaseMetrics.plannedMinutes)} planned
                            </span>
                        )}

                        {/* Drift Indicator */}
                        {phaseMetrics.driftMinutes !== null && phaseMetrics.driftMinutes !== 0 && (
                            <div className={cn(
                                "flex items-center gap-0.5 px-1.5 py-0.5 rounded font-medium",
                                phaseMetrics.isOverBudget
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            )}>
                                {phaseMetrics.isOverBudget ? (
                                    <>
                                        <TrendingUp className="w-3 h-3" />
                                        <span>+{formatTime(phaseMetrics.driftMinutes)}</span>
                                    </>
                                ) : (
                                    <>
                                        <TrendingDown className="w-3 h-3" />
                                        <span>{formatTime(Math.abs(phaseMetrics.driftMinutes))}</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Task List */}
            <div
                ref={setNodeRef}
                className={cn(
                    "flex-1 p-2 space-y-2 min-h-[200px] overflow-y-auto",
                    isOver && "bg-blue-50 dark:bg-blue-900/20"
                )}
            >
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <SortableTask
                            key={task.id}
                            task={task}
                            phase={phase}
                            onTaskClick={onTaskClick}
                        />
                    ))}
                </SortableContext>

                {/* Add Task Form */}
                {isAddingTask ? (
                    <ActionCardEditor
                        campaignId={campaignId}
                        phaseId={phase?.id || null}
                        phaseName={isBacklog ? 'Backlog' : phase?.phase_name}
                        onSave={handleSaveTask}
                        onCancel={() => setIsAddingTask(false)}
                    />
                ) : (
                    <button
                        onClick={() => setIsAddingTask(true)}
                        className="w-full p-2 flex items-center justify-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add task
                    </button>
                )}

                {/* Empty state */}
                {tasks.length === 0 && !isAddingTask && (
                    <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-4">
                        Drop tasks here
                    </p>
                )}
            </div>
        </div>
    )
}
