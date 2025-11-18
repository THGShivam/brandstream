interface ScoreBarProps {
  value: number
  label: string
  color: string
}

export function ScoreBar({ value, label, color }: ScoreBarProps) {
  const percentage = (value / 10) * 100

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="text-xs font-semibold text-foreground">{value.toFixed(1)}</span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
