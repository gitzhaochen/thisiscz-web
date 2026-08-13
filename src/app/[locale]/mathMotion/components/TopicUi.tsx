import { ReactNode } from 'react'

export function TopicPanel({
  title,
  subtitle,
  children,
  controls,
}: {
  title: string
  subtitle: string
  children: ReactNode
  controls: ReactNode
}) {
  return (
    <article className="bg-card overflow-hidden rounded-lg border">
      <div className="border-b p-4">
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
        <p className="text-muted-foreground mt-1.5 text-sm leading-6">{subtitle}</p>
      </div>
      <div className="grid xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="from-muted/30 to-background min-w-0 bg-gradient-to-b p-4">{children}</div>
        <div className="border-t p-4 xl:border-t-0 xl:border-l">{controls}</div>
      </div>
    </article>
  )
}

export function NumberControl({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  id: string
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}) {
  const update = (rawValue: string) => {
    const parsed = Number(rawValue)
    if (Number.isFinite(parsed)) onChange(Math.min(max, Math.max(min, parsed)))
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <div className="bg-background flex items-center rounded-lg border">
          <input
            id={id}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => update(event.target.value)}
            className="h-8 w-16 bg-transparent px-2 text-right text-sm font-semibold outline-none"
          />
          {unit ? <span className="text-muted-foreground pr-2 text-xs">{unit}</span> : null}
        </div>
      </div>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => update(event.target.value)}
        className="h-2 w-full cursor-pointer accent-indigo-600"
      />
    </div>
  )
}

export function FormulaBox({ label, formula, value }: { label: string; formula: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-xl border p-3.5">
      <div className="text-muted-foreground text-xs font-medium">{label}</div>
      <div className="mt-1 text-base font-bold text-indigo-600 dark:text-indigo-300">{formula}</div>
      <div className="text-muted-foreground mt-1 text-xs">= {value}</div>
    </div>
  )
}

export function Hint({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl bg-cyan-50 px-3.5 py-3 text-xs leading-5 text-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-100">
      {children}
    </p>
  )
}
