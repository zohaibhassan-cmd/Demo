import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  fetchDeactivateContext,
  fetchDeactivateOptions,
  submitBulkUpload,
  submitDeactivateItem,
  type DeactivateContext,
  type DeactivateItemInput,
  type DeactivateOptions,
} from '../api/placeOrderApi'
import './DeactivateModal.css'

type DeactivateModalProps = {
  open: boolean
  draftId: string | null
  onClose: () => void
  onBack: () => void
  onGoToCart: (draftId: string, cartCount: number) => void
}

const emptyForm: DeactivateItemInput = {
  mobileNumber: '',
  firstName: '',
  lastName: '',
  email: '',
  ruiNickname1: '',
  ruiNickname2: '',
  bureauDesignator: '',
  deactivateDate: '',
  unitCost: 50555,
}

export function DeactivateModal({
  open,
  draftId,
  onClose,
  onBack,
  onGoToCart,
}: DeactivateModalProps) {
  const [options, setOptions] = useState<DeactivateOptions | null>(null)
  const [context, setContext] = useState<DeactivateContext | null>(null)
  const [form, setForm] = useState<DeactivateItemInput>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open || !draftId) return
    let cancelled = false
    setError(null)
    setStatus(null)
    setForm(emptyForm)

    async function load() {
      try {
        const [opts, ctx] = await Promise.all([
          fetchDeactivateOptions(),
          fetchDeactivateContext(draftId!),
        ])
        if (cancelled) return
        setOptions(opts)
        setContext(ctx)
        setForm((prev) => ({ ...prev, unitCost: opts.unitCost }))
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load Deactivate form')
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, draftId])

  if (!open || !draftId) return null

  function update<K extends keyof DeactivateItemInput>(
    key: K,
    value: DeactivateItemInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function submitItem(thenGoToCart: boolean) {
    if (!draftId) return
    setBusy(true)
    setError(null)
    setStatus(null)
    try {
      const result = await submitDeactivateItem(draftId, form)
      setContext((prev) =>
        prev
          ? {
              ...prev,
              cartCount: result.cartCount,
              costRemainingForClinFormatted: result.costRemainingForClinFormatted,
            }
          : prev,
      )
      if (thenGoToCart) {
        onGoToCart(draftId, result.cartCount)
      } else {
        setStatus(result.message)
        setForm((prev) => ({ ...emptyForm, unitCost: prev.unitCost }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save deactivate item')
    } finally {
      setBusy(false)
    }
  }

  async function handleBulk(file: File | undefined) {
    if (!file || !draftId) return
    setBusy(true)
    setError(null)
    try {
      const result = await submitBulkUpload(draftId, file.name)
      onGoToCart(draftId, result.draft.items?.length ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk upload failed')
    } finally {
      setBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const currentYear = new Date().getFullYear()

  return (
    <div className="deactivate-overlay" role="presentation" onClick={onClose}>
      <div
        className="deactivate-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deactivate-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="deactivate-modal__chrome">Order - Deactivate</div>
        <button
          type="button"
          className="deactivate-modal__close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        <h2 id="deactivate-title" className="deactivate-modal__title">
          Order for CLIN {context?.clin ?? '###'}
        </h2>

        <div className="deactivate-modal__funding">
          <span>
            Total Funding Available for Demotion:{' '}
            <strong>{context?.fundingAvailableBeforeFormatted ?? '—'}</strong>
          </span>
          <span className="deactivate-modal__cart" aria-label={`Cart ${context?.cartCount ?? 0}`}>
            <CartIcon />
            <span className="deactivate-modal__cart-badge">{context?.cartCount ?? 0}</span>
          </span>
        </div>

        <div className="deactivate-modal__type-row">
          <label>
            <span>Order Type</span>
            <select value="Deactivate" disabled>
              <option>Deactivate</option>
            </select>
          </label>
          <div className="deactivate-modal__bulk">
            <span>Have multiple items?</span>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={busy}>
              Bulk Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              hidden
              onChange={(e) => void handleBulk(e.target.files?.[0])}
            />
          </div>
        </div>

        <Field label="Mobile Number">
          <input
            value={form.mobileNumber}
            onChange={(e) => update('mobileNumber', e.target.value)}
            placeholder="Free form field"
          />
        </Field>

        <h3>User Details</h3>
        <div className="deactivate-modal__grid">
          <Field label="User First Name">
            <input
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
              placeholder="Free form field"
            />
          </Field>
          <Field label="User Last Name">
            <input
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
              placeholder="Free form field"
            />
          </Field>
          <Field label="User Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="Free form field"
            />
          </Field>
          <Field label="RUI Nickname">
            <select
              value={form.ruiNickname1}
              onChange={(e) => update('ruiNickname1', e.target.value)}
            >
              <option value="">Dropdown</option>
              {(options?.ruiNickname ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="RUI Nickname">
            <select
              value={form.ruiNickname2}
              onChange={(e) => update('ruiNickname2', e.target.value)}
            >
              <option value="">Dropdown</option>
              {(options?.ruiNickname ?? []).map((o) => (
                <option key={`2-${o}`} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Bureau Designator">
            <select
              value={form.bureauDesignator}
              onChange={(e) => update('bureauDesignator', e.target.value)}
            >
              <option value="">Dropdown</option>
              {(options?.bureauDesignator ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Deactivate Date">
            <input
              type="date"
              value={form.deactivateDate}
              min={`${currentYear}-01-01`}
              max={`${currentYear}-12-31`}
              onChange={(e) => update('deactivateDate', e.target.value)}
              title="Select from Current Year Calendar"
            />
            <span className="deactivate-modal__hint">Select from Current Year Calendar</span>
          </Field>
        </div>

        <div className="deactivate-modal__cost">
          <span>
            Unit Cost: <strong>{context?.unitCostFormatted ?? '—'}</strong>
          </span>
          <span>
            Total Remaining for CLIN:{' '}
            <strong>{context?.costRemainingForClinFormatted ?? '—'}</strong>
          </span>
        </div>

        {error ? <p className="deactivate-modal__error">{error}</p> : null}
        {status ? <p className="deactivate-modal__status">{status}</p> : null}

        <div className="deactivate-modal__footer">
          <button type="button" className="deactivate-modal__back" onClick={onBack}>
            Back
          </button>
          <div className="deactivate-modal__footer-actions">
            <button
              type="button"
              className="deactivate-modal__btn"
              disabled={busy}
              onClick={() => void submitItem(false)}
            >
              Add More
            </button>
            <button
              type="button"
              className="deactivate-modal__btn"
              disabled={busy}
              onClick={() => void submitItem(true)}
            >
              Go to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="deactivate-modal__field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 7h13l-1.4 8.2a1.5 1.5 0 0 1-1.5 1.3H9.2a1.5 1.5 0 0 1-1.5-1.2L6 4.5H3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="20" r="1.3" fill="currentColor" />
      <circle cx="17" cy="20" r="1.3" fill="currentColor" />
    </svg>
  )
}
