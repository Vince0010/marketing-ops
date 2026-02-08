import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertCircle, Timer } from 'lucide-react'

interface DelayReasonModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (reason: string) => void
    taskTitle: string
    daysLate: number
    overByTime?: string
}

export function DelayReasonModal({
    isOpen,
    onClose,
    onConfirm,
    taskTitle,
    daysLate,
    overByTime,
}: DelayReasonModalProps) {
    const [reason, setReason] = useState('')
    const [error, setError] = useState('')

    const isTimeBudgetOverdue = !!overByTime
    const title = isTimeBudgetOverdue ? 'Over Time Budget' : 'Ad Overdue'
    const Icon = isTimeBudgetOverdue ? Timer : AlertCircle

    const handleSubmit = () => {
        if (!reason.trim()) {
            setError('Please provide a reason for the delay')
            return
        }
        onConfirm(reason)
        setReason('')
        setError('')
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            onClose()
            setReason('')
            setError('')
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <Icon className="h-5 w-5" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {isTimeBudgetOverdue ? (
                            <>
                                The ad <span className="font-semibold">"{taskTitle}"</span> has exceeded its
                                phase time budget by <span className="font-semibold text-red-600">{overByTime}</span>.
                                Please provide a reason for the delay before moving it to the next phase.
                            </>
                        ) : (
                            <>
                                The ad <span className="font-semibold">"{taskTitle}"</span> is {daysLate} day{daysLate !== 1 ? 's' : ''} late.
                                Please provide a reason for the delay to proceed.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="reason">Reason for delay</Label>
                        <Textarea
                            id="reason"
                            placeholder="e.g. Waiting for client feedback, creative revisions needed..."
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value)
                                if (e.target.value.trim()) setError('')
                            }}
                            className={error ? 'border-red-500' : ''}
                        />
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel Move
                    </Button>
                    <Button onClick={handleSubmit} disabled={!reason.trim()}>
                        Save & Proceed
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
