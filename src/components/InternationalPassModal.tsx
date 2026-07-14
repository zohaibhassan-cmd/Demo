import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  fetchInternationalPassContext,
  fetchInternationalPassOptions,
  submitBulkUpload,
  submitInternationalPassItem,
  type HistoricalPassRow,
  type InternationalPassContext,
  type InternationalPassItemInput,
  type InternationalPassOptions,
} from '../api/placeOrderApi'
import './InternationalPassModal.css'

type InternationalPassModalProps = {
  open: boolean
  draftId: string | null
  onClose: () => void
  onBack: () => void
  onGoToCart: (draftId: string, cartCount: number) => void
}

const emptyForm: InternationalPassItemInput = {
  mobileNumber: '',
  firstName: '',
  lastName: '',
  email: '',
  piuNickname1: '',
  piuNickname2: '',
  bureauDesignator: '',
  sameEmailDomain: false,
  requireWithinWindow: false,
  passStartDate: '',
  passEndDate: '',
  unitCost: 89,
}

export function InternationalPassModal({
  open,
  draftId,
  onClose,
  onBack,
  onGoToCart,
}: InternationalPassModalProps) {
  const [options, setOptions] = useState<InternationalPassOptions | null>(null)
  const [context, setContext] = useState<InternationalPassContext | null>(null)
  const [history, setHistory] = useState<HistoricalPassRow[]>([])
  const [form, setForm] = useState<InternationalPassItemInput>(emptyForm)
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
          fetchInternationalPassOptions(),
          fetchInternationalPassContext(draftId!),
        ])
        if (cancelled) return
        setOptions(opts)
        setContext(ctx)
        setHistory(ctx.historicalPasses)
        setForm((prev) => ({ ...prev, unitCost: opts.unitCost }))
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load International Pass form')
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, draftId])

  if (!open || !draftId) return null

  function update<K extends keyof InternationalPassItemInput>(
    key: K,
    value: InternationalPassItemInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function submitItem(thenGoToCart: boolean) {
    if (!draftId) return
    setBusy(true)
    setError(null)
    setStatus(null)
    try {
      const result = await submitInternationalPassItem(draftId, form)
      setContext((prev) =>
        prev
          ? {
              ...prev,
              cartCount: result.cartCount,
              costRemainingForPopFormatted: result.costRemainingForPopFormatted,
            }
          : prev,
      )
      if (thenGoToCart) {
        onGoToCart(draftId, result.cartCount)
      } else {
        setStatus(result.message)
        setForm((prev) => ({
          ...emptyForm,
          unitCost: prev.unitCost,
          requireWithinWindow: prev.requireWithinWindow,
        }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save pass item')
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

  return (
    <div className="intl-pass-overlay" role="presentation" onClick={onClose}>
      <div
        className="intl-pass-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="intl-pass-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="intl-pass-modal__chrome">Order - International Pass</div>
        <button type="button" className="intl-pass-modal__close" aria-label="Close" onClick={onClose}>
          ×
        </button>

        <h2 id="intl-pass-title" className="intl-pass-modal__title">
          Order for CLIN {context?.clin ?? '###'}
        </h2>

        <div className="intl-pass-modal__funding">
          <span>
            Total Funding Available Before Order:{' '}
            <strong>{context?.fundingAvailableBeforeFormatted ?? '—'}</strong>
          </span>
          <span className="intl-pass-modal__cart" aria-label={`Cart ${context?.cartCount ?? 0}`}>
            <CartIcon />
            <span className="intl-pass-modal__cart-badge">{context?.cartCount ?? 0}</span>
          </span>
        </div>

        <div className="intl-pass-modal__type-row">
          <label>
            <span>Order Type</span>
            <select value="International Pass" disabled>
              <option>International Pass</option>
            </select>
          </label>
          <div className="intl-pass-modal__bulk">
            <span>Have multiple users?</span>
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
            placeholder="Free Form Field"
          />
        </Field>

        <h3>User Details</h3>
        <div className="intl-pass-modal__grid">
          <Field label="User First Name">
            <input
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
              placeholder="Free Form Field"
            />
          </Field>
          <Field label="User Last Name">
            <input
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
              placeholder="Free Form Field"
            />
          </Field>
          <Field label="User Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="Free Form Field"
            />
          </Field>
          <Field label="PIU Nickname">
            <select
              value={form.piuNickname1}
              onChange={(e) => update('piuNickname1', e.target.value)}
            >
              <option value="">Dropdown</option>
              {(options?.piuNickname ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="PIU Nickname">
            <select
              value={form.piuNickname2}
              onChange={(e) => update('piuNickname2', e.target.value)}
            >
              <option value="">Dropdown</option>
              {(options?.piuNickname ?? []).map((o) => (
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
        </div>

        <label className="intl-pass-modal__check">
          <input
            type="checkbox"
            checked={form.sameEmailDomain}
            onChange={(e) => update('sameEmailDomain', e.target.checked)}
          />
          Same email domain for PIU nickname field
        </label>

        <label className="intl-pass-modal__check">
          <input
            type="checkbox"
            checked={form.requireWithinWindow}
            onChange={(e) => update('requireWithinWindow', e.target.checked)}
          />
          Pass Start Date/End Date must be within the next 90 days
        </label>

        <div className="intl-pass-modal__grid">
          <Field label="Pass Start Date">
            <input
              type="date"
              value={form.passStartDate}
              onChange={(e) => update('passStartDate', e.target.value)}
            />
          </Field>
          <Field label="Pass End Date">
            <input
              type="date"
              value={form.passEndDate}
              onChange={(e) => update('passEndDate', e.target.value)}
            />
          </Field>
        </div>

        <div className="intl-pass-modal__cost">
          <span>
            Unit Cost: <strong>{context?.unitCostFormatted ?? '—'}</strong>
          </span>
          <span>
            Cost Remaining for PoP:{' '}
            <strong>{context?.costRemainingForPopFormatted ?? '—'}</strong>
          </span>
        </div>

        <h3>Historical Pass Dates</h3>
        <div className="intl-pass-modal__table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Order #</th>
                <th scope="col">Pass Start Date</th>
                <th scope="col">Pass End Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.orderNumber}>
                  <td>{row.orderNumber}</td>
                  <td>{row.passStartDate}</td>
                  <td>{row.passEndDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error ? <p className="intl-pass-modal__error">{error}</p> : null}
        {status ? <p className="intl-pass-modal__status">{status}</p> : null}

        <div className="intl-pass-modal__footer">
          <button type="button" className="intl-pass-modal__back" onClick={onBack}>
            Back
          </button>
          <div className="intl-pass-modal__footer-actions">
            <button
              type="button"
              className="intl-pass-modal__btn"
              disabled={busy}
              onClick={() => void submitItem(false)}
            >
              Add More
            </button>
            <button
              type="button"
              className="intl-pass-modal__btn"
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
    <label className="intl-pass-modal__field">
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
