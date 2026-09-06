import type { ReactNode } from 'react'

/** Shared primitives. Kept deliberately small — this is an instrument, not a kit. */

export function Panel({
  title,
  count,
  children,
  scroll = true,
}: {
  title: string
  count?: ReactNode
  children: ReactNode
  scroll?: boolean
}) {
  return (
    <section className="flex min-h-0 flex-col border border-[#2c2723] bg-[#151210]">
      <header className="flex shrink-0 items-baseline justify-between border-b border-[#2c2723] px-3 py-2">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b7ada0]">
          {title}
        </h2>
        {count !== undefined && (
          <span className="tnum font-mono text-[11px] text-[#9a8f80]">{count}</span>
        )}
      </header>
      <div className={`min-h-0 flex-1 ${scroll ? 'overflow-y-auto' : ''}`}>{children}</div>
    </section>
  )
}

export function Meter({ value, tone = 'neutral' }: { value: number; tone?: 'neutral' | 'warn' | 'bad' }) {
  const color = tone === 'bad' ? '#e0565c' : tone === 'warn' ? '#dc9a3f' : '#8a7f72'
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-[#2c2723]">
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, background: color }}
      />
    </div>
  )
}

export function Tag({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'warn' | 'bad' | 'good'
}) {
  const map = {
    neutral: 'border-[#3a342e] text-[#b7ada0]',
    warn: 'border-[#dc9a3f]/50 text-[#dc9a3f]',
    bad: 'border-[#e0565c]/50 text-[#e0565c]',
    good: 'border-[#62ab82]/50 text-[#62ab82]',
  }
  return (
    <span
      className={`inline-block border px-1.5 py-px font-mono text-[10px] uppercase tracking-[0.08em] ${map[tone]}`}
    >
      {children}
    </span>
  )
}

export function Button({
  children,
  onClick,
  variant = 'ghost',
  ...rest
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'ghost' | 'solid'
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    'px-2.5 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const style =
    variant === 'solid'
      ? 'bg-[#f2ede6] text-[#151210] hover:bg-white'
      : 'border border-[#3a342e] text-[#e8e1d8] hover:border-[#6b6055] hover:bg-[#211c18]'
  return (
    <button className={`${base} ${style}`} onClick={onClick} {...rest}>
      {children}
    </button>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-3 py-4 text-[12px] leading-relaxed text-[#9a8f80]">{children}</p>
}
