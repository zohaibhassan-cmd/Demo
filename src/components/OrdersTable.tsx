import type { OrderRow } from '../api/ordersApi'
import './OrdersTable.css'

type OrdersTableProps = {
  title: string
  rows: OrderRow[]
  loading?: boolean
  search: string
  onSearchChange: (value: string) => void
  onExport: () => void
  onItemize?: (orderId: string) => void
}

const columns = [
  { key: 'expand', label: '' },
  { key: 'orderDate', label: 'Order Date' },
  { key: 'orderNumber', label: 'Order #' },
  { key: 'nickname', label: 'Order Nickname' },
  { key: 'clin', label: 'CLIN' },
  { key: 'totalItems', label: 'Total Items' },
  { key: 'totalPopCost', label: 'Total POP Cost' },
  { key: 'orderedBy', label: 'Ordered By' },
] as const

export function OrdersTable({
  title,
  rows,
  loading = false,
  search,
  onSearchChange,
  onExport,
  onItemize,
}: OrdersTableProps) {
  return (
    <section className="orders-table">
      <div className="orders-table__toolbar">
        <h2 className="orders-table__title">{title}</h2>
        <div className="orders-table__tools">
          <input
            type="search"
            className="orders-table__search"
            placeholder="Search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={`Search ${title}`}
          />
          <button type="button" className="orders-table__export" onClick={onExport}>
            Export
          </button>
        </div>
      </div>

      <div className="orders-table__scroll">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="orders-table__empty">
                  Loading orders…
                </td>
              </tr>
            ) : null}

            {!loading &&
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={index % 2 === 1 ? 'orders-table__row--alt' : undefined}
                >
                  <td>
                    <button
                      type="button"
                      className="orders-table__expand"
                      aria-label={`Open itemization for order ${row.orderNumber}`}
                      onClick={() => onItemize?.(row.id)}
                    >
                      <ExpandIcon />
                    </button>
                  </td>
                  <td>{row.orderDate}</td>
                  <td>{row.orderNumber}</td>
                  <td>{row.nickname}</td>
                  <td>{row.clin}</td>
                  <td>{row.totalItems}</td>
                  <td>{row.totalPopCost}</td>
                  <td>{row.orderedBy}</td>
                </tr>
              ))}

            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="orders-table__empty">
                  No orders match your filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ExpandIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
