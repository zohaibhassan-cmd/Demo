import './AdminFilterBar.css'
import type { AdminFilterOptions, AdminFilterValues } from '../api/adminApi'

const filterMeta = [
  { id: 'bureau', label: 'Bureau / Office' },
  { id: 'contractNumber', label: 'Contract Number' },
  { id: 'pop', label: 'PoP' },
  { id: 'clin', label: 'CLIN' },
] as const

type AdminFilterBarProps = {
  values: AdminFilterValues
  options?: AdminFilterOptions
  onChange: (next: AdminFilterValues) => void
}

const fallbackOptions: AdminFilterOptions = {
  bureau: ['All'],
  contractNumber: ['All'],
  pop: ['All'],
  clin: ['All'],
}

export function AdminFilterBar({
  values,
  options = fallbackOptions,
  onChange,
}: AdminFilterBarProps) {
  function update(id: keyof AdminFilterValues, value: string) {
    onChange({ ...values, [id]: value })
  }

  return (
    <section className="admin-filter-bar" aria-label="Admin filters">
      <div className="admin-filter-bar__filters">
        {filterMeta.map((filter) => (
          <label key={filter.id} className="admin-filter-bar__field" htmlFor={`admin-${filter.id}`}>
            <span className="admin-filter-bar__label">{filter.label}</span>
            <select
              id={`admin-${filter.id}`}
              className="admin-filter-bar__select"
              value={values[filter.id]}
              onChange={(e) => update(filter.id, e.target.value)}
            >
              {(options[filter.id] ?? ['All']).map((option) => (
                <option key={option} value={option}>
                  {option === 'All' ? 'All + dropdown' : option}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </section>
  )
}
