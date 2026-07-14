import './FilterBar.css'
import type { FilterOptions, FilterValues } from '../api/ordersApi'

const filterMeta = [
  { id: 'bureau', label: 'Bureau / Office' },
  { id: 'clin', label: 'CLIN' },
  { id: 'ru1', label: 'RU1 Nickname' },
  { id: 'ru2', label: 'RU2 Nickname' },
] as const

type FilterBarProps = {
  values: FilterValues
  options?: FilterOptions
  onChange: (next: FilterValues) => void
  cartCount?: number
  onProductDetails?: () => void
  onPlaceOrder?: () => void
  onAddressBook?: () => void
}

export type { FilterValues }

const fallbackOptions: FilterOptions = {
  bureau: ['All'],
  clin: ['All'],
  ru1: ['All'],
  ru2: ['All'],
}

export function FilterBar({
  values,
  options = fallbackOptions,
  onChange,
  cartCount = 0,
  onProductDetails,
  onPlaceOrder,
  onAddressBook,
}: FilterBarProps) {
  function update(id: keyof FilterValues, value: string) {
    onChange({ ...values, [id]: value })
  }

  return (
    <section className="filter-bar" aria-label="Filters and actions">
      <div className="filter-bar__filters">
        {filterMeta.map((filter) => (
          <label key={filter.id} className="filter-bar__field" htmlFor={filter.id}>
            <span className="filter-bar__label">{filter.label}</span>
            <select
              id={filter.id}
              className="filter-bar__select"
              value={values[filter.id]}
              onChange={(e) => update(filter.id, e.target.value)}
            >
              {options[filter.id]?.map((option) => (
                <option key={option} value={option}>
                  {option === 'All' ? 'All + dropdown' : option}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="filter-bar__actions">
        <button type="button" className="filter-bar__btn" onClick={onProductDetails}>
          Product Details
        </button>
        <button type="button" className="filter-bar__btn" onClick={onPlaceOrder}>
          Place Order
        </button>
        <button type="button" className="filter-bar__btn" onClick={onAddressBook}>
          Address Book
        </button>
        <button type="button" className="filter-bar__cart" aria-label={`Cart, ${cartCount} items`}>
          <CartIcon />
          {cartCount > 0 ? (
            <span className="filter-bar__cart-badge">{cartCount}</span>
          ) : null}
        </button>
      </div>
    </section>
  )
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 7h13l-1.4 8.2a1.5 1.5 0 0 1-1.5 1.3H9.2a1.5 1.5 0 0 1-1.5-1.2L6 4.5H3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="20" r="1.3" fill="currentColor" />
      <circle cx="17" cy="20" r="1.3" fill="currentColor" />
    </svg>
  )
}
