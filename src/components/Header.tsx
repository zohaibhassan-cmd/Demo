import './Header.css'

type HeaderProps = {
  variant?: 'bureau' | 'admin'
  active?: string
  onNavigate?: (item: string) => void
}

const bureauNav = ['Home', 'Usage', 'Order'] as const
const adminNav = ['Contract', 'Funding', 'Bureau/Office', 'Order'] as const

export function Header({
  variant = 'bureau',
  active = 'Order',
  onNavigate,
}: HeaderProps) {
  const navItems = variant === 'admin' ? adminNav : bureauNav
  const subtitle = variant === 'admin' ? 'ADMIN' : 'MOBILE DEVICES'

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__logo" aria-hidden="true">
          <span className="app-header__logo-mark">AQD</span>
        </span>
        <span className="app-header__title">
          ACQUISITION NEXUS <span className="app-header__pipe">|</span> {subtitle}
        </span>
      </div>
      <nav className="app-header__nav" aria-label="Primary">
        {navItems.map((item) => (
          <button
            key={item}
            type="button"
            className={
              item === active
                ? 'app-header__nav-btn app-header__nav-btn--active'
                : 'app-header__nav-btn'
            }
            onClick={() => onNavigate?.(item)}
          >
            {item}
          </button>
        ))}
      </nav>
    </header>
  )
}
