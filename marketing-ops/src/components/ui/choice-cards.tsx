import { cn } from '@/lib/utils'

interface ChoiceCardsProps<T extends string> {
  value?: T
  options: { value: T; label: string; description?: string }[]
  onChange: (value: T) => void
  columns?: 2 | 3
  className?: string
}

export function ChoiceCards<T extends string>({
  value,
  options,
  onChange,
  columns = 3,
  className,
}: ChoiceCardsProps<T>) {
  return (
    <div
      className={cn(
        'grid gap-2',
        columns === 2 && 'grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-lg border-2 p-3 text-left transition-colors',
            value === opt.value
              ? 'border-primary bg-primary/5 text-foreground'
              : 'border-border bg-background hover:border-primary/50 hover:bg-muted/50'
          )}
        >
          <span className="font-medium text-sm">{opt.label}</span>
          {opt.description && (
            <span className="mt-0.5 block text-xs text-muted-foreground">{opt.description}</span>
          )}
        </button>
      ))}
    </div>
  )
}
