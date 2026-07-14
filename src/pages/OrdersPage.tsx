import { useEffect, useState } from 'react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { FilterBar } from '../components/FilterBar'
import { FundingCards } from '../components/FundingCards'
import { OrdersTable } from '../components/OrdersTable'
import { PlaceOrderModal } from '../components/PlaceOrderModal'
import { NewOrderModal } from '../components/NewOrderModal'
import { InternationalPassModal } from '../components/InternationalPassModal'
import { ReplaceUpgradeModal } from '../components/ReplaceUpgradeModal'
import { ReviewOrderModal } from '../components/ReviewOrderModal'
import { OrderSummaryModal } from '../components/OrderSummaryModal'
import { ItemizationModal } from '../components/ItemizationModal'
import { SimpleDialog } from '../components/SimpleDialog'
import type { OrderSummaryPayload } from '../api/placeOrderApi'
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
  const [placeOrderOpen, setPlaceOrderOpen] = useState(false)
  const [newOrderDraftId, setNewOrderDraftId] = useState<string | null>(null)
  const [intlPassDraftId, setIntlPassDraftId] = useState<string | null>(null)
  const [replaceUpgradeDraftId, setReplaceUpgradeDraftId] = useState<string | null>(null)
  const [reviewDraftId, setReviewDraftId] = useState<string | null>(null)
  const [summaryDraftId, setSummaryDraftId] = useState<string | null>(null)
  const [orderSummary, setOrderSummary] = useState<OrderSummaryPayload | null>(null)
  const [itemizeOrderId, setItemizeOrderId] = useState<string | null>(null)
  const [infoDialog, setInfoDialog] = useState<{ title: string; message: string } | null>(null)

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
        onProductDetails={() =>
          setInfoDialog({
            title: 'Product Details',
            message: 'Product Details screen will open here. Button is active.',
          })
        }
        onPlaceOrder={() => setPlaceOrderOpen(true)}
        onAddressBook={() =>
          setInfoDialog({
            title: 'Address Book',
            message: 'Address Book screen will open here. Button is active.',
          })
        }
        onCart={() =>
          setInfoDialog({
            title: 'Cart',
            message: `You have ${cartCount} item(s) in the cart. Full Cart screen coming next.`,
          })
        }
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
          onItemize={setItemizeOrderId}
        />
        <OrdersTable
          title="Historical Orders"
          rows={historicalRows}
          loading={loadingOrders}
          search={historicalSearch}
          onSearchChange={setHistoricalSearch}
          onExport={() => handleExport('historical')}
          onItemize={setItemizeOrderId}
        />
      </main>

      <Footer />

      <PlaceOrderModal
        open={placeOrderOpen}
        onClose={() => setPlaceOrderOpen(false)}
        onOpenReview={(draftId) => setReviewDraftId(draftId)}
        onOpenNewOrder={(draftId) => setNewOrderDraftId(draftId)}
        onOpenInternationalPass={(draftId) => setIntlPassDraftId(draftId)}
        onOpenReplaceUpgrade={(draftId) => setReplaceUpgradeDraftId(draftId)}
      />
      <NewOrderModal
        open={Boolean(newOrderDraftId)}
        draftId={newOrderDraftId}
        onClose={() => setNewOrderDraftId(null)}
        onBack={() => {
          setNewOrderDraftId(null)
          setPlaceOrderOpen(true)
        }}
        onGoToCart={(draftId, cartCount) => {
          setCartCount(cartCount)
          setNewOrderDraftId(null)
          setReviewDraftId(draftId)
        }}
      />
      <InternationalPassModal
        open={Boolean(intlPassDraftId)}
        draftId={intlPassDraftId}
        onClose={() => setIntlPassDraftId(null)}
        onBack={() => {
          setIntlPassDraftId(null)
          setPlaceOrderOpen(true)
        }}
        onGoToCart={(draftId, cartCount) => {
          setCartCount(cartCount)
          setIntlPassDraftId(null)
          setReviewDraftId(draftId)
        }}
      />
      <ReplaceUpgradeModal
        open={Boolean(replaceUpgradeDraftId)}
        draftId={replaceUpgradeDraftId}
        onClose={() => setReplaceUpgradeDraftId(null)}
        onBack={() => {
          setReplaceUpgradeDraftId(null)
          setPlaceOrderOpen(true)
        }}
        onGoToCart={(draftId, cartCount) => {
          setCartCount(cartCount)
          setReplaceUpgradeDraftId(null)
          setReviewDraftId(draftId)
        }}
      />
      <ReviewOrderModal
        open={Boolean(reviewDraftId)}
        draftId={reviewDraftId}
        onClose={() => setReviewDraftId(null)}
        onAddMore={() => {
          if (!reviewDraftId) return
          const id = reviewDraftId
          setReviewDraftId(null)
          setNewOrderDraftId(id)
        }}
        onPlaced={(review) => {
          setCartCount(0)
          setReviewDraftId(null)
          setOrderSummary(review.summary ?? null)
          setSummaryDraftId(review.draftId)
        }}
      />
      <OrderSummaryModal
        open={Boolean(summaryDraftId)}
        draftId={summaryDraftId}
        initialSummary={orderSummary}
        onClose={() => {
          setSummaryDraftId(null)
          setOrderSummary(null)
        }}
      />
      <ItemizationModal
        open={Boolean(itemizeOrderId)}
        orderId={itemizeOrderId}
        onClose={() => setItemizeOrderId(null)}
      />
      <SimpleDialog
        open={Boolean(infoDialog)}
        title={infoDialog?.title ?? ''}
        message={infoDialog?.message ?? ''}
        onClose={() => setInfoDialog(null)}
      />
    </div>
  )
}
