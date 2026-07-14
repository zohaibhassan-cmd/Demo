import { useEffect, useState } from 'react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { FilterBar } from '../components/FilterBar'
import { FundingCards } from '../components/FundingCards'
import { OrdersTable } from '../components/OrdersTable'
import {
  exportOrdersUrl,
  fetchCartCount,
  fetchFilterOptions,
  fetchFunding,
  fetchOrders,
  type FilterOptions,
  type FilterValues,
  type FundingCard,
  type OrderRow,
} from '../api/ordersApi'
import './OrdersPage.css'

const initialFilters: FilterValues = {
  bureau: 'All',
  clin: 'All',
  ru1: 'All',
  ru2: 'All',
}

const emptyFilterOptions: FilterOptions = {
  bureau: ['All'],
  clin: ['All'],
  ru1: ['All'],
  ru2: ['All'],
}

const blankFundingCards: FundingCard[] = [
  { id: 'obligated', label: 'Total Obligated', value: null },
  { id: 'historical', label: 'Historical Orders', value: null, linked: true },
  { id: 'pending', label: 'Pending Orders', value: null },
  { id: 'remaining', label: 'Total Funding Remaining', value: null },
]

export function OrdersPage({ onSwitchToAdmin }: { onSwitchToAdmin?: () => void }) {
  const [filters, setFilters] = useState<FilterValues>(initialFilters)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(emptyFilterOptions)
  const [fundingCards, setFundingCards] = useState<FundingCard[]>(blankFundingCards)
  const [clinSelected, setClinSelected] = useState(false)
  const [pendingRows, setPendingRows] = useState<OrderRow[]>([])
  const [historicalRows, setHistoricalRows] = useState<OrderRow[]>([])
  const [pendingSearch, setPendingSearch] = useState('')
  const [historicalSearch, setHistoricalSearch] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadStatic() {
      try {
        const [options, cart] = await Promise.all([
          fetchFilterOptions(),
          fetchCartCount(),
        ])
        if (cancelled) return
        setFilterOptions(options)
        setCartCount(cart)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load filters')
        }
      }
    }

    void loadStatic()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadFunding() {
      try {
        const data = await fetchFunding(filters.clin)
        if (cancelled) return
        setClinSelected(data.clinSelected)
        setFundingCards(data.cards)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load funding')
        }
      }
    }

    void loadFunding()
    return () => {
      cancelled = true
    }
  }, [filters.clin])

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      async function loadOrders() {
        setLoadingOrders(true)
        try {
          const [pending, historical] = await Promise.all([
            fetchOrders('pending', filters, pendingSearch),
            fetchOrders('historical', filters, historicalSearch),
          ])
          if (cancelled) return
          setPendingRows(pending.rows)
          setHistoricalRows(historical.rows)
          setError(null)
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Failed to load orders')
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
    window.location.assign(exportOrdersUrl(status, filters, search))
  }

  return (
    <div className="orders-page">
      <Header />
      <FilterBar
        values={filters}
        options={filterOptions}
        onChange={setFilters}
        cartCount={cartCount}
        onProductDetails={() => undefined}
        onPlaceOrder={() => undefined}
        onAddressBook={() => undefined}
      />

      <main className="orders-page__main">
        {error ? <p className="orders-page__error">{error}</p> : null}

        <div className="orders-page__switch">
          <button type="button" onClick={onSwitchToAdmin}>
            Admin Orders view →
          </button>
        </div>

        <FundingCards clinSelected={clinSelected} cards={fundingCards} />

        <OrdersTable
          title="Pending Orders"
          rows={pendingRows}
          loading={loadingOrders}
          search={pendingSearch}
          onSearchChange={setPendingSearch}
          onExport={() => handleExport('pending')}
        />
        <OrdersTable
          title="Historical Orders"
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
