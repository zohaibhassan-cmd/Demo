import { useEffect, useState } from 'react'
import {
  fetchPlaceOrderFunding,
  fetchPlaceOrderOptions,
  startPlaceOrder,
  type PlaceOrderDraft,
} from '../api/placeOrderApi'
import './PlaceOrderModal.css'

type PlaceOrderModalProps = {
  open: boolean
  onClose: () => void
  onStarted?: (draft: PlaceOrderDraft) => void
}

export function PlaceOrderModal({ open, onClose, onStarted }: PlaceOrderModalProps) {
  const [bureauOptions, setBureauOptions] = useState<string[]>([])
  const [clinOptions, setClinOptions] = useState<string[]>([])
  const [bureau, setBureau] = useState('')
  const [clin, setClin] = useState('')
  const [nickname, setNickname] = useState('')
  const [fundingLabel, setFundingLabel] = useState('$1,358,000')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [successDraft, setSuccessDraft] = useState<PlaceOrderDraft | null>(null)

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setError(null)
    setSuccessDraft(null)
    setBureau('')
    setClin('')
    setNickname('')

    async function load() {
      try {
        const options = await fetchPlaceOrderOptions()
        if (cancelled) return
        setBureauOptions(options.bureau)
        setClinOptions(options.clin)
        const funding = await fetchPlaceOrderFunding('', '')
        if (!cancelled) setFundingLabel(funding.totalFundingAvailableBeforeFormatted)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load Place Order')
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    let cancelled = false

    async function loadFunding() {
      try {
        const funding = await fetchPlaceOrderFunding(bureau, clin)
        if (!cancelled) setFundingLabel(funding.totalFundingAvailableBeforeFormatted)
      } catch {
        // keep previous funding label
      }
    }

    void loadFunding()
    return () => {
      cancelled = true
    }
  }, [open, bureau, clin])

  if (!open) return null

  async function handleNext() {
    setError(null)

    if (!bureau) {
      setError('Select a Bureau/Office.')
      return
    }
    if (!clin) {
      setError('Select a CLIN.')
      return
    }
    if (!nickname.trim()) {
      setError('Enter an Order Nickname.')
      return
    }

    setSubmitting(true)
    try {
      const result = await startPlaceOrder({ bureau, clin, nickname })
      setSuccessDraft(result.draft)
      onStarted?.(result.draft)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to continue')
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    onClose()
  }

  return (
    <div className="place-order-overlay" role="presentation" onClick={handleCancel}>
      <div
        className="place-order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-order-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="place-order-modal__close"
          aria-label="Close"
          onClick={handleCancel}
        >
          ×
        </button>

        <h2 id="place-order-title" className="place-order-modal__title">
          Place Order
        </h2>

        {successDraft ? (
          <div className="place-order-modal__success">
            <p>
              Draft <strong>{successDraft.id}</strong> started for{' '}
              <strong>{successDraft.nickname}</strong>.
            </p>
            <p className="place-order-modal__success-note">
              Bureau: {successDraft.bureau} · CLIN: {successDraft.clin}
            </p>
            <p className="place-order-modal__success-note">
              Next step in flow: Order Selection (coming next).
            </p>
            <div className="place-order-modal__actions">
              <button type="button" className="place-order-modal__cancel" onClick={handleCancel}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="place-order-modal__funding">
              <span>Total Funding Available Before Order:</span>
              <strong>{fundingLabel}</strong>
            </div>

            <div className="place-order-modal__form">
              <label className="place-order-modal__row" htmlFor="po-bureau">
                <span>Bureau/Office</span>
                <select
                  id="po-bureau"
                  value={bureau}
                  onChange={(e) => setBureau(e.target.value)}
                >
                  <option value="">Dropdown</option>
                  {bureauOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="place-order-modal__row" htmlFor="po-clin">
                <span>CLIN</span>
                <select id="po-clin" value={clin} onChange={(e) => setClin(e.target.value)}>
                  <option value="">Dropdown</option>
                  {clinOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="place-order-modal__row" htmlFor="po-nickname">
                <span>Order Nickname</span>
                <input
                  id="po-nickname"
                  type="text"
                  placeholder="Free Form Field"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </label>
            </div>

            {error ? <p className="place-order-modal__error">{error}</p> : null}

            <div className="place-order-modal__actions">
              <button type="button" className="place-order-modal__cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button
                type="button"
                className="place-order-modal__next"
                onClick={() => void handleNext()}
                disabled={submitting}
              >
                {submitting ? 'Saving…' : 'Next'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
