import { useState, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pencil } from 'lucide-react'
import type { PhaseTicket, TicketPriority } from '@/types/phase'

const PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

export interface TicketEdits {
  title: string
  description?: string
  assignee?: string
  due_date?: string
  priority?: TicketPriority
}

interface TrackerTicketEditPopoverProps {
  ticket: PhaseTicket
  phaseId: string
  onSave: (phaseId: string, ticketId: string, updates: Partial<TicketEdits>) => void
  children: React.ReactNode
}

export default function TrackerTicketEditPopover({
  ticket,
  phaseId,
  onSave,
  children,
}: TrackerTicketEditPopoverProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(ticket.title)
  const [description, setDescription] = useState(ticket.description ?? '')
  const [assignee, setAssignee] = useState(ticket.assignee ?? '')
  const [dueDate, setDueDate] = useState(ticket.due_date ?? '')
  const [priority, setPriority] = useState<TicketPriority | ''>(ticket.priority ?? '')

  useEffect(() => {
    if (open) {
      setTitle(ticket.title)
      setDescription(ticket.description ?? '')
      setAssignee(ticket.assignee ?? '')
      setDueDate(ticket.due_date ?? '')
      setPriority(ticket.priority ?? '')
    }
  }, [open, ticket])

  const handleSave = () => {
    onSave(phaseId, ticket.id, {
      title: title.trim() || ticket.title,
      description: description.trim() || undefined,
      assignee: assignee.trim() || undefined,
      due_date: dueDate || undefined,
      priority: priority || undefined,
    })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start" side="right" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description / notes</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details..."
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Input
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority | '')}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>Save</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
