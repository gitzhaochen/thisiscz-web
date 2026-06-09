type SchoolMetaLineProps = {
  city?: string | null
  authorityClassLabel: string
  levelClassLabel: string
  coEdStatusLabel: string
  className?: string
}

export function SchoolMetaLine({
  city,
  authorityClassLabel,
  levelClassLabel,
  coEdStatusLabel,
  className,
}: SchoolMetaLineProps) {
  const baseClassName = 'text-foreground mt-1 text-sm'
  const combinedClassName = className ? `${baseClassName} ${className}` : baseClassName

  return (
    <div className={combinedClassName}>
      {city || '-'} · {authorityClassLabel} · {levelClassLabel} · {coEdStatusLabel}
    </div>
  )
}
