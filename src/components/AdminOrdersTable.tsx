import { useState, Fragment } from 'react'
import type { AdminOrderRow } from '../api/adminApi'
import './OrdersTable.css'

type AdminOrdersTableProps = {
  title: string
  variant: 'pending' | 'historical'
  rows: AdminOrderRow[]
  loading?: boolean
  search: string
  onSearchChange: (value: string) => void
  onExport: () => void
}

export function AdminOrdersTable({
  title,
  variant,
  rows,
  loading = false,
  search,
  onSearchChange,
  onExport,
}: AdminOrdersTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const dateColumnLabel =
    variant === 'pending' ? 'Earliest Request Date' : 'To Vendor Date'

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
              <th scope="col" />
              <th scope="col">Order #</th>
              <th scope="col">Order Date</th>
              <th scope="col">CLIN</th>
              <th scope="col">Total POP Cost</th>
              <th scope="col">{dateColumnLabel}</th>
              <th scope="col">Ordered By</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="orders-table__empty">
                  Loading orders…
                </td>
              </tr>
            ) : null}

            {!loading &&
              rows.map((row, index) => {
                const open = expandedId === row.id
                const dateValue =
                  variant === 'pending' ? row.earliestRequestDate : row.toVendorDate
                return (
                  <Fragment key={row.id}>
                    <tr className={index % 2 === 1 ? 'orders-table__row--alt' : undefined}>
                      <td>
                        <button
                          type="button"
                          className="orders-table__expand"
                          aria-expanded={open}
                          aria-label={`${open ? 'Collapse' : 'Expand'} order ${row.orderNumber}`}
                          onClick={() => setExpandedId(open ? null : row.id)}
                        >
                          <ExpandIcon />
                        </button>
                      </td>
                      <td>{row.orderNumber}</td>
                      <td>{row.orderDate}</td>
                      <td>{row.clin}</td>
                      <td>{row.totalPopCost}</td>
                      <td>{dateValue ?? '—'}</td>
                      <td>{row.orderedBy}</td>
                    </tr>
                    {open ? (
                      <tr className="orders-table__detail-row">
                        <td colSpan={7}>
                          Admin detail for {row.orderNumber}. API: /api/orders/{row.id}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })}

            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="orders-table__empty">
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
