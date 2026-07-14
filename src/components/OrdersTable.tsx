import { useMemo, useState, Fragment } from 'react'
import type { OrderRow } from '../data/orders'
import './OrdersTable.css'

type OrdersTableProps = {
  title: string
  rows: OrderRow[]
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

export function OrdersTable({ title, rows }: OrdersTableProps) {
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) =>
      [
        row.orderDate,
        row.orderNumber,
        row.nickname,
        row.clin,
        row.totalItems,
        row.totalPopCost,
        row.orderedBy,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [rows, search])

  function handleExport() {
    const header = [
      'Order Date',
      'Order #',
      'Order Nickname',
      'CLIN',
      'Total Items',
      'Total POP Cost',
      'Ordered By',
    ]
    const lines = filtered.map((row) =>
      [
        row.orderDate,
        row.orderNumber,
        row.nickname,
        row.clin,
        row.totalItems,
        row.totalPopCost,
        row.orderedBy,
      ]
        .map((cell) => `"${cell.replaceAll('"', '""')}"`)
        .join(','),
    )
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replaceAll(' ', '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

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
            onChange={(e) => setSearch(e.target.value)}
            aria-label={`Search ${title}`}
          />
          <button type="button" className="orders-table__export" onClick={handleExport}>
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
            {filtered.map((row, index) => {
              const open = expandedId === row.id
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
                    <td>{row.orderDate}</td>
                    <td>{row.orderNumber}</td>
                    <td>{row.nickname}</td>
                    <td>{row.clin}</td>
                    <td>{row.totalItems}</td>
                    <td>{row.totalPopCost}</td>
                    <td>{row.orderedBy}</td>
                  </tr>
                  {open ? (
                    <tr className="orders-table__detail-row">
                      <td colSpan={8}>
                        Itemization for {row.orderNumber} — {row.nickname}. Connect Product
                        Details / line-item API here.
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="orders-table__empty">
                  No orders match your search.
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
