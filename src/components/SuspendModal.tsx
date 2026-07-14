import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  fetchSuspendContext,
  fetchSuspendOptions,
  submitBulkUpload,
  submitSuspendItem,
  type HistoricalSuspendRow,
  type SuspendContext,
  type SuspendItemInput,
  type SuspendOptions,
} from '../api/placeOrderApi'
import './SuspendModal.css'

type SuspendModalProps = {
  open: boolean
  draftId: string | null
  onClose: () => void
  onBack: () => void
  onGoToCart: (draftId: string, cartCount: number) => void
}

const emptyForm: SuspendItemInput = {
  mobileNumber: '',
  firstName: '',
  lastName: '',
  email: '',
  ru1Nickname: '',
  ru2Nickname: '',
  devicesDesignator: '',
  useEmailForNotifications: false,
  suspendStartDate: '',
  suspendEndDate: '',
  unitCost: 88888,
}

export function SuspendModal({
  open,
  draftId,
  onClose,
  onBack,
  onGoToCart,
}: SuspendModalProps) {
  const [options, setOptions] = useState<SuspendOptions | null>(null)
  const [context, setContext] = useState<SuspendContext | null>(null)
  const [history, setHistory] = useState<HistoricalSuspendRow[]>([])
  const [form, setForm] = useState<SuspendItemInput>(emptyForm)
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
          fetchSuspendOptions(),
          fetchSuspendContext(draftId!),
        ])
        if (cancelled) return
        setOptions(opts)
        setContext(ctx)
        setHistory(ctx.historicalSuspends)
        setForm((prev) => ({
          ...prev,
          unitCost: opts.unitCost,
          devicesDesignator: opts.devicesDesignator[0] ?? '',
        }))
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load Suspend form')
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, draftId])

  if (!open || !draftId) return null

  function update<K extends keyof SuspendItemInput>(key: K, value: SuspendItemInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function submitItem(thenGoToCart: boolean) {
    if (!draftId) return
    setBusy(true)
    setError(null)
    setStatus(null)
    try {
      const result = await submitSuspendItem(draftId, form)
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
          devicesDesignator: options?.devicesDesignator[0] ?? '',
        }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save suspend item')
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
    <div className="suspend-overlay" role="presentation" onClick={onClose}>
      <div
        className="suspend-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="suspend-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="suspend-modal__chrome">Order - Suspend</div>
        <button type="button" className="suspend-modal__close" aria-label="Close" onClick={onClose}>
          ×
        </button>

        <h2 id="suspend-title" className="suspend-modal__title">
          Order for CLIN {context?.clin ?? '###'}
        </h2>

        <div className="suspend-modal__funding">
          <span>
            Total Funding Available (Before Order){' '}
            <strong>{context?.fundingAvailableBeforeFormatted ?? '—'}</strong>
          </span>
          <span className="suspend-modal__cart" aria-label={`Cart ${context?.cartCount ?? 0}`}>
            <CartIcon />
            <span className="suspend-modal__cart-badge">{context?.cartCount ?? 0}</span>
          </span>
        </div>

        <div className="suspend-modal__type-row">
          <label>
            <span>Order Type</span>
            <select value="Suspend" disabled>
              <option>Suspend</option>
            </select>
          </label>
          <div className="suspend-modal__bulk">
            <span>Need to bulk load?</span>
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
            placeholder="Type Item Info"
          />
        </Field>

        <h3>User Details</h3>
        <div className="suspend-modal__grid">
          <Field label="User First Name">
            <input
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
              placeholder="Type Item Info"
            />
          </Field>
          <Field label="User Last Name">
            <input
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
              placeholder="Type Item Info"
            />
          </Field>
          <Field label="User Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="Type Item Info"
            />
          </Field>
          <Field label="RU1 Nickname">
            <select
              value={form.ru1Nickname}
              onChange={(e) => update('ru1Nickname', e.target.value)}
            >
              <option value="">Dropdown</option>
              {(options?.ru1Nickname ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="RU2 Nickname">
            <select
              value={form.ru2Nickname}
              onChange={(e) => update('ru2Nickname', e.target.value)}
            >
              <option value="">Dropdown</option>
              {(options?.ru2Nickname ?? []).map((o) => (
                <option key={`2-${o}`} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Devices Designator">
            <select
              value={form.devicesDesignator}
              onChange={(e) => update('devicesDesignator', e.target.value)}
            >
              <option value="">Dropdown</option>
              {(options?.devicesDesignator ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <label className="suspend-modal__check">
          <input
            type="checkbox"
            checked={form.useEmailForNotifications}
            onChange={(e) => update('useEmailForNotifications', e.target.checked)}
          />
          Use User Email for all notifications
        </label>

        <div className="suspend-modal__grid">
          <Field label="Suspend Start Date">
            <input
              type="date"
              value={form.suspendStartDate}
              onChange={(e) => update('suspendStartDate', e.target.value)}
              title="Select Start Date (Up to 15 days in advance)"
            />
            <span className="suspend-modal__hint">Select Start Date (Up to 15 days in advance)</span>
          </Field>
          <Field label="Suspend End Date">
            <input
              type="date"
              value={form.suspendEndDate}
              onChange={(e) => update('suspendEndDate', e.target.value)}
              title="Perspective Exception Date (Up to 12 months in advance)"
            />
            <span className="suspend-modal__hint">
              Perspective Exception Date (Up to 12 months in advance)
            </span>
          </Field>
        </div>

        <div className="suspend-modal__cost">
          <span>
            Unit Cost: <strong>{context?.unitCostFormatted ?? '—'}</strong>
          </span>
          <span>
            Cost Remaining for PoP:{' '}
            <strong>{context?.costRemainingForPopFormatted ?? '—'}</strong>
          </span>
        </div>

        <h3>Historical Suspend Dates</h3>
        <div className="suspend-modal__table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Order #</th>
                <th scope="col">Suspend Days</th>
                <th scope="col">Start Date</th>
                <th scope="col">Resume Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.orderNumber}>
                  <td>{row.orderNumber}</td>
                  <td>{row.suspendDays}</td>
                  <td>{row.startDate}</td>
                  <td>{row.resumeDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error ? <p className="suspend-modal__error">{error}</p> : null}
        {status ? <p className="suspend-modal__status">{status}</p> : null}

        <div className="suspend-modal__footer">
          <button type="button" className="suspend-modal__back" onClick={onBack}>
            Back
          </button>
          <div className="suspend-modal__footer-actions">
            <button
              type="button"
              className="suspend-modal__btn"
              disabled={busy}
              onClick={() => void submitItem(false)}
            >
              Add More
            </button>
            <button
              type="button"
              className="suspend-modal__btn"
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
    <label className="suspend-modal__field">
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
