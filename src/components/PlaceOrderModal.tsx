import { useEffect, useRef, useState } from 'react'
import {
  fetchPlaceOrderFunding,
  fetchPlaceOrderOptions,
  selectOrderType,
  startPlaceOrder,
  submitBulkUpload,
  type PlaceOrderDraft,
} from '../api/placeOrderApi'
import './PlaceOrderModal.css'

type Step = 'start' | 'selection'

type PlaceOrderModalProps = {
  open: boolean
  onClose: () => void
  onStarted?: (draft: PlaceOrderDraft) => void
  onOpenReview?: (draftId: string) => void
  onOpenNewOrder?: (draftId: string) => void
  onOpenInternationalPass?: (draftId: string) => void
  onOpenReplaceUpgrade?: (draftId: string) => void
  onOpenSuspend?: (draftId: string) => void
}

export function PlaceOrderModal({
  open,
  onClose,
  onStarted,
  onOpenReview,
  onOpenNewOrder,
  onOpenInternationalPass,
  onOpenReplaceUpgrade,
  onOpenSuspend,
}: PlaceOrderModalProps) {
  const [step, setStep] = useState<Step>('start')
  const [bureauOptions, setBureauOptions] = useState<string[]>([])
  const [clinOptions, setClinOptions] = useState<string[]>([])
  const [orderTypeOptions, setOrderTypeOptions] = useState<string[]>([])
  const [bureau, setBureau] = useState('')
  const [clin, setClin] = useState('')
  const [nickname, setNickname] = useState('')
  const [orderType, setOrderType] = useState('')
  const [fundingLabel, setFundingLabel] = useState('$1,358,000')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [draft, setDraft] = useState<PlaceOrderDraft | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setStep('start')
    setError(null)
    setStatusMessage(null)
    setDraft(null)
    setBureau('')
    setClin('')
    setNickname('')
    setOrderType('')

    async function load() {
      try {
        const options = await fetchPlaceOrderOptions()
        if (cancelled) return
        setBureauOptions(options.bureau)
        setClinOptions(options.clin)
        setOrderTypeOptions(options.orderTypes ?? [])
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
    if (!open || step !== 'start') return
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
  }, [open, step, bureau, clin])

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
      setDraft(result.draft)
      setFundingLabel(result.fundingAvailableBeforeFormatted)
      setStep('selection')
      onStarted?.(result.draft)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to continue')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleOrderTypeChange(value: string) {
    setOrderType(value)
    setError(null)
    setStatusMessage(null)
    if (!value || !draft) return

    setSubmitting(true)
    try {
      const result = await selectOrderType(draft.id, value)
      setDraft(result.draft)
      if (value === 'New Order') {
        onOpenNewOrder?.(result.draft.id)
      } else if (value === 'International Pass') {
        onOpenInternationalPass?.(result.draft.id)
      } else if (value === 'Replace-Upgrade') {
        onOpenReplaceUpgrade?.(result.draft.id)
      } else if (value === 'Suspend') {
        onOpenSuspend?.(result.draft.id)
      } else {
        onOpenReview?.(result.draft.id)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to select order type')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleBulkFile(file: File | undefined) {
    if (!file || !draft) return
    setError(null)
    setStatusMessage(null)
    setSubmitting(true)
    try {
      const result = await submitBulkUpload(draft.id, file.name)
      setDraft(result.draft)
      setStatusMessage(result.message)
      onOpenReview?.(result.draft.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk upload failed')
    } finally {
      setSubmitting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
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

        <div className="place-order-modal__funding">
          <span>Total Funding Available Before Order:</span>
          <strong>{fundingLabel}</strong>
        </div>

        {step === 'start' ? (
          <>
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
        ) : null}

        {step === 'selection' ? (
          <>
            <div className="place-order-modal__selection">
              <label className="place-order-modal__row place-order-modal__row--selection" htmlFor="po-type">
                <span>Order Type</span>
                <select
                  id="po-type"
                  value={orderType}
                  disabled={submitting}
                  onChange={(e) => void handleOrderTypeChange(e.target.value)}
                >
                  <option value="">Dropdown</option>
                  {orderTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <div className="place-order-modal__bulk">
                <span>Have multiple items?</span>
                <button
                  type="button"
                  className="place-order-modal__bulk-link"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!draft || submitting}
                >
                  Bulk Upload
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="place-order-modal__file"
                  aria-label="Bulk upload file"
                  onChange={(e) => void handleBulkFile(e.target.files?.[0])}
                />
              </div>
            </div>

            {statusMessage ? (
              <p className="place-order-modal__success-note">{statusMessage}</p>
            ) : null}
            {error ? <p className="place-order-modal__error">{error}</p> : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
