import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, MoreHorizontal } from 'lucide-react'
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
    isBacklog?: boolean
}

interface SortableTaskProps {
    task: MarketerAction
}

function SortableTask({ task }: SortableTaskProps) {
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

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
        >
            <ActionCard task={task} isDragging={isDragging} />
        </div>
    )
}

export function KanbanColumn({ phase, tasks, campaignId, onCreateTask, isBacklog }: KanbanColumnProps) {
    const [isAddingTask, setIsAddingTask] = useState(false)

    const columnId = phase?.id || 'backlog'

    const { setNodeRef, isOver } = useDroppable({
        id: columnId,
    })

    const handleSaveTask = async (taskData: MarketerActionInsert) => {
        await onCreateTask(taskData)
        setIsAddingTask(false)
    }

    const taskIds = tasks.map(t => t.id)

    return (
        <div className="flex flex-col min-w-[280px] max-w-[320px] bg-slate-100 dark:bg-slate-900 rounded-lg">
            {/* Column Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {isBacklog ? 'Backlog' : phase?.phase_name}
                    </h3>
                    <span className="px-2 py-0.5 text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                        {tasks.length}
                    </span>
                </div>
                <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
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
                        <SortableTask key={task.id} task={task} />
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
