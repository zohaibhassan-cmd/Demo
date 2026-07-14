import './Header.css'

const navItems = ['Home', 'Usage', 'Order'] as const

type HeaderProps = {
  active?: (typeof navItems)[number]
}

export function Header({ active = 'Order' }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__logo" aria-hidden="true">
          <span className="app-header__logo-mark">AQD</span>
        </span>
        <span className="app-header__title">
          ACQUISITION NEXUS <span className="app-header__pipe">|</span> MOBILE
          DEVICES
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
          >
            {item}
          </button>
        ))}
      </nav>
    </header>
  )
}
