import { useEffect, useState } from 'react'
import { fetchOrderSummary, type OrderSummaryPayload } from '../api/placeOrderApi'
import './OrderSummaryModal.css'

type OrderSummaryModalProps = {
  open: boolean
  draftId: string | null
  initialSummary?: OrderSummaryPayload | null
  onClose: () => void
}

export function OrderSummaryModal({
  open,
  draftId,
  initialSummary = null,
  onClose,
}: OrderSummaryModalProps) {
  const [summary, setSummary] = useState<OrderSummaryPayload | null>(initialSummary)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !draftId) return
    let cancelled = false
    setError(null)
    if (initialSummary) {
      setSummary(initialSummary)
      return
    }

    async function load() {
      try {
        const data = await fetchOrderSummary(draftId!)
        if (!cancelled) setSummary(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load order summary')
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, draftId, initialSummary])

  if (!open) return null

  return (
    <div className="order-summary-overlay" role="presentation" onClick={onClose}>
      <div
        className="order-summary-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-summary-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="order-summary-modal__close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        <h2 id="order-summary-title" className="order-summary-modal__title">
          Order for CLIN {summary?.clin ?? '###'}
        </h2>

        <div className="order-summary-modal__banner">
          Total Funding Available <u>Before Order</u>:{' '}
          <strong>{summary?.fundingAvailableBeforeFormatted ?? '—'}</strong>
        </div>

        <h3 className="order-summary-modal__heading">Order Summary</h3>

        <div className="order-summary-modal__total-items">
          Total Items: {summary?.totalItems ?? 0} for {summary?.orderTotalFormatted ?? '$0'}
        </div>

        <div className="order-summary-modal__categories">
          {(summary?.categories ?? []).map((category) => (
            <div key={category.label} className="order-summary-modal__category">
              {category.label}: {category.count} for {category.amountFormatted}
            </div>
          ))}
        </div>

        <div className="order-summary-modal__locations">
          {(summary?.locations ?? []).map((location) => (
            <section key={location.location} className="order-summary-modal__location">
              <h4>{location.location}</h4>
              <p>
                Phones: {location.phones.count} ({location.phones.amountFormatted})
              </p>
              <p>
                Tablets: {location.tablets.count} ({location.tablets.amountFormatted})
              </p>
              <p>
                Wireless: {location.wireless.count} ({location.wireless.amountFormatted})
              </p>
              <div className="order-summary-modal__subtotal">
                Subtotal <strong>{location.subtotalFormatted}</strong>
              </div>
            </section>
          ))}
        </div>

        <div className="order-summary-modal__order-total">
          <span>CLIN {summary?.clin ?? '########'}</span>
          <div>
            <strong>Order Total: {summary?.orderTotalFormatted ?? '$0'}</strong>
            <p>{summary?.emailMessage}</p>
          </div>
        </div>

        <div className="order-summary-modal__banner">
          Total Funding Available <u>After Order</u>:{' '}
          <strong>{summary?.fundingAvailableAfterFormatted ?? '—'}</strong>
        </div>

        {error ? <p className="order-summary-modal__error">{error}</p> : null}

        <div className="order-summary-modal__footer">
          <button type="button" className="order-summary-modal__close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
