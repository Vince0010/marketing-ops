import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, RotateCcw, PlayCircle } from 'lucide-react'

interface BackwardMoveModalProps {
    isOpen: boolean
    onClose: () => void
    onResume: () => void
    onRestart: () => void
    taskTitle: string
    phaseName: string
    previousTime: string
}

export function BackwardMoveModal({
    isOpen,
    onClose,
    onResume,
    onRestart,
    taskTitle,
    phaseName,
    previousTime,
}: BackwardMoveModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RotateCcw className="w-5 h-5 text-amber-500" />
                        Return to Previous Phase
                    </DialogTitle>
                    <DialogDescription className="space-y-2 pt-2">
                        <p>
                            You're moving <span className="font-semibold text-foreground">"{taskTitle}"</span> back to the{' '}
                            <span className="font-semibold text-foreground">{phaseName}</span> phase.
                        </p>
                        <p className="text-sm">
                            This action card previously spent{' '}
                            <span className="font-semibold text-foreground">{previousTime}</span> in this phase.
                        </p>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    <div className="flex items-start gap-3 p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                        <PlayCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Resume from where you left off
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                Continue with {previousTime} already logged. Time tracking will continue from this point.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
                        <RotateCcw className="w-5 h-5 text-slate-600 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                Start fresh
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                Reset time to 0 and begin tracking from scratch in this phase.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                        The phase will be marked as "in progress" again. Previous time will be preserved in history.
                    </p>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onRestart}
                        className="w-full sm:w-auto"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Start Fresh
                    </Button>
                    <Button
                        type="button"
                        onClick={onResume}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                    >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Resume ({previousTime})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
