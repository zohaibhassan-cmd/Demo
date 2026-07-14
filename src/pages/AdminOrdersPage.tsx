import { useEffect, useState } from 'react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { AdminFilterBar } from '../components/AdminFilterBar'
import { AdminOrdersTable } from '../components/AdminOrdersTable'
import {
  exportAdminOrdersUrl,
  fetchAdminFilterOptions,
  fetchAdminOrders,
  type AdminFilterOptions,
  type AdminFilterValues,
  type AdminOrderRow,
} from '../api/adminApi'
import './OrdersPage.css'

const initialFilters: AdminFilterValues = {
  bureau: 'All',
  contractNumber: 'All',
  pop: 'All',
  clin: 'All',
}

const emptyOptions: AdminFilterOptions = {
  bureau: ['All'],
  contractNumber: ['All'],
  pop: ['All'],
  clin: ['All'],
}

type AdminOrdersPageProps = {
  onSwitchToBureau?: () => void
}

export function AdminOrdersPage({ onSwitchToBureau }: AdminOrdersPageProps) {
  const [filters, setFilters] = useState<AdminFilterValues>(initialFilters)
  const [filterOptions, setFilterOptions] = useState<AdminFilterOptions>(emptyOptions)
  const [pendingRows, setPendingRows] = useState<AdminOrderRow[]>([])
  const [historicalRows, setHistoricalRows] = useState<AdminOrderRow[]>([])
  const [pendingSearch, setPendingSearch] = useState('')
  const [historicalSearch, setHistoricalSearch] = useState('')
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadFilters() {
      try {
        const options = await fetchAdminFilterOptions()
        if (!cancelled) setFilterOptions(options)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load admin filters')
        }
      }
    }

    void loadFilters()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      async function loadOrders() {
        setLoadingOrders(true)
        try {
          const [pending, historical] = await Promise.all([
            fetchAdminOrders('pending', filters, pendingSearch),
            fetchAdminOrders('historical', filters, historicalSearch),
          ])
          if (cancelled) return
          setPendingRows(pending.rows)
          setHistoricalRows(historical.rows)
          setError(null)
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Failed to load admin orders')
          }
        } finally {
          if (!cancelled) setLoadingOrders(false)
        }
      }

      void loadOrders()
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [filters, pendingSearch, historicalSearch])

  function handleExport(status: 'pending' | 'historical') {
    const search = status === 'pending' ? pendingSearch : historicalSearch
    window.location.assign(exportAdminOrdersUrl(status, filters, search))
  }

  return (
    <div className="orders-page">
      <Header
        variant="admin"
        active="Order"
        onNavigate={(item) => {
          if (item === 'Order') return
          // Placeholder tabs — switch demo view from footer link
        }}
      />
      <AdminFilterBar values={filters} options={filterOptions} onChange={setFilters} />

      <main className="orders-page__main">
        {error ? <p className="orders-page__error">{error}</p> : null}

        <div className="orders-page__switch">
          <button type="button" onClick={onSwitchToBureau}>
            ← Bureau Orders view
          </button>
        </div>

        <AdminOrdersTable
          title="Pending Orders"
          variant="pending"
          rows={pendingRows}
          loading={loadingOrders}
          search={pendingSearch}
          onSearchChange={setPendingSearch}
          onExport={() => handleExport('pending')}
        />
        <AdminOrdersTable
          title="Historical Orders"
          variant="historical"
          rows={historicalRows}
          loading={loadingOrders}
          search={historicalSearch}
          onSearchChange={setHistoricalSearch}
          onExport={() => handleExport('historical')}
        />
      </main>

      <Footer />
    </div>
  )
}
