import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  fetchNewOrderContext,
  fetchNewOrderOptions,
  lookupZip,
  submitBulkUpload,
  submitNewOrderItem,
  type NewOrderContext,
  type NewOrderItemInput,
  type NewOrderOptions,
} from '../api/placeOrderApi'
import './NewOrderModal.css'

type NewOrderModalProps = {
  open: boolean
  draftId: string | null
  onClose: () => void
  onBack: () => void
  onGoToCart: (draftId: string, cartCount: number) => void
}

const emptyForm: NewOrderItemInput = {
  firstName: '',
  lastName: '',
  email: '',
  ru1: '',
  ru2: '',
  bureauDesignator: '',
  ccat1: '',
  ccat2: '',
  ccat3: '',
  restrictedReporting: 'No (default)',
  requestedDeliveryDate: '',
  shipAddress1: '',
  shipAddress2: '',
  shipZip: '',
  shipCity: '',
  shipState: '',
  addToAddressBook: false,
  setAsDefault: false,
  sameAsShipping: false,
  dutyAddress1: '',
  dutyAddress2: '',
  dutyZip: '',
  dutyCity: '',
  dutyState: '',
  signatureRequired: 'No (default)',
  deliveryInstructions: '',
  unitCost: 250,
}

export function NewOrderModal({
  open,
  draftId,
  onClose,
  onBack,
  onGoToCart,
}: NewOrderModalProps) {
  const [options, setOptions] = useState<NewOrderOptions | null>(null)
  const [context, setContext] = useState<NewOrderContext | null>(null)
  const [form, setForm] = useState<NewOrderItemInput>(emptyForm)
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
          fetchNewOrderOptions(),
          fetchNewOrderContext(draftId!),
        ])
        if (cancelled) return
        setOptions(opts)
        setContext(ctx)
        setForm((prev) => ({ ...prev, unitCost: opts.unitCost }))
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load New Order form')
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, draftId])

  useEffect(() => {
    if (!form.sameAsShipping) return
    setForm((prev) => ({
      ...prev,
      dutyAddress1: prev.shipAddress1,
      dutyAddress2: prev.shipAddress2,
      dutyZip: prev.shipZip,
      dutyCity: prev.shipCity,
      dutyState: prev.shipState,
    }))
  }, [
    form.sameAsShipping,
    form.shipAddress1,
    form.shipAddress2,
    form.shipZip,
    form.shipCity,
    form.shipState,
  ])

  if (!open || !draftId) return null

  function update<K extends keyof NewOrderItemInput>(key: K, value: NewOrderItemInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleZipChange(kind: 'ship' | 'duty', zip: string) {
    if (kind === 'ship') {
      update('shipZip', zip)
      update('shipCity', '')
      update('shipState', '')
    } else {
      update('dutyZip', zip)
      update('dutyCity', '')
      update('dutyState', '')
    }
    if (!zip) return
    try {
      const result = await lookupZip(zip)
      if (kind === 'ship') {
        setForm((prev) => ({
          ...prev,
          shipZip: zip,
          shipCity: result.city,
          shipState: result.state,
        }))
      } else {
        setForm((prev) => ({
          ...prev,
          dutyZip: zip,
          dutyCity: result.city,
          dutyState: result.state,
        }))
      }
    } catch {
      // keep manual city/state entry
    }
  }

  async function submitItem(thenGoToCart: boolean) {
    if (!draftId) return
    setBusy(true)
    setError(null)
    setStatus(null)
    try {
      const result = await submitNewOrderItem(draftId, form)
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
        setForm((prev) => ({
          ...emptyForm,
          unitCost: prev.unitCost,
          restrictedReporting: prev.restrictedReporting,
          signatureRequired: prev.signatureRequired,
        }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save item')
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
    <div className="new-order-overlay" role="presentation" onClick={onClose}>
      <div
        className="new-order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-order-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="new-order-modal__chrome">Order - New Order</div>
        <button type="button" className="new-order-modal__close" aria-label="Close" onClick={onClose}>
          ×
        </button>

        <h2 id="new-order-title" className="new-order-modal__title">
          Order for CLIN {context?.clin ?? '###'}
        </h2>

        <div className="new-order-modal__funding">
          <span>
            Total Funding Available Before Order:{' '}
            <strong>{context?.fundingAvailableBeforeFormatted ?? '—'}</strong>
          </span>
          <span className="new-order-modal__cart" aria-label={`Cart ${context?.cartCount ?? 0}`}>
            <CartIcon />
            <span className="new-order-modal__cart-badge">{context?.cartCount ?? 0}</span>
          </span>
        </div>

        <div className="new-order-modal__type-row">
          <label>
            <span>Order Type</span>
            <select value="New Order" disabled>
              <option>New Order</option>
            </select>
          </label>
          <div className="new-order-modal__bulk">
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

        <h3>User Details</h3>
        <div className="new-order-modal__grid">
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
          <Field label="RU1 Nickname">
            <select value={form.ru1} onChange={(e) => update('ru1', e.target.value)}>
              <option value="">Dropdown</option>
              {(options?.ru1 ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="RU2 Nickname">
            <select value={form.ru2} onChange={(e) => update('ru2', e.target.value)}>
              <option value="">Dropdown</option>
              {(options?.ru2 ?? []).map((o) => (
                <option key={o} value={o}>
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

        <h3>Item Details</h3>
        <div className="new-order-modal__item-banner">
          <span>
            Unit Cost: <strong>{context?.unitCostFormatted ?? '—'}</strong>
          </span>
          <span>
            Cost Remaining for CLIN:{' '}
            <strong>{context?.costRemainingForClinFormatted ?? '—'}</strong>
          </span>
        </div>
        <div className="new-order-modal__grid">
          <Field label="CCAT1">
            <select value={form.ccat1} onChange={(e) => update('ccat1', e.target.value)}>
              <option value="">Dropdown</option>
              {(options?.ccat1 ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="CCAT2">
            <select value={form.ccat2} onChange={(e) => update('ccat2', e.target.value)}>
              <option value="">Dropdown</option>
              {(options?.ccat2 ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="CCAT3">
            <select value={form.ccat3} onChange={(e) => update('ccat3', e.target.value)}>
              <option value="">Dropdown</option>
              {(options?.ccat3 ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Restricted Reporting">
            <select
              value={form.restrictedReporting}
              onChange={(e) => update('restrictedReporting', e.target.value)}
            >
              {(options?.restrictedReporting ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Requested Delivery Date">
            <input
              type="date"
              value={form.requestedDeliveryDate}
              onChange={(e) => update('requestedDeliveryDate', e.target.value)}
            />
          </Field>
        </div>

        <h3>Address Details</h3>
        <h4>Shipping Address</h4>
        <div className="new-order-modal__grid">
          <Field label="Address Line 1">
            <select
              value={form.shipAddress1}
              onChange={(e) => update('shipAddress1', e.target.value)}
            >
              <option value="">Dropdown</option>
              {(options?.addressLine1 ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Address Line 2">
            <select
              value={form.shipAddress2}
              onChange={(e) => update('shipAddress2', e.target.value)}
            >
              <option value="">Dropdown</option>
              {(options?.addressLine2 ?? []).map((o) => (
                <option key={o || 'blank'} value={o}>
                  {o || '(none)'}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Zip">
            <select
              value={form.shipZip}
              onChange={(e) => void handleZipChange('ship', e.target.value)}
            >
              <option value="">Dropdown</option>
              {(options?.zips ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="City">
            <input
              value={form.shipCity}
              onChange={(e) => update('shipCity', e.target.value)}
              placeholder="Populate based on Zip, Free Form Field"
            />
          </Field>
          <Field label="State">
            <input
              value={form.shipState}
              onChange={(e) => update('shipState', e.target.value)}
              placeholder="Populate based on Zip, Free Form Field"
            />
          </Field>
        </div>
        <div className="new-order-modal__checks">
          <label>
            <input
              type="checkbox"
              checked={form.addToAddressBook}
              onChange={(e) => update('addToAddressBook', e.target.checked)}
            />
            Add to Address Book
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.setAsDefault}
              onChange={(e) => update('setAsDefault', e.target.checked)}
            />
            Set as Default for RU1/RU2
          </label>
        </div>

        <h4>Duty Address</h4>
        <label className="new-order-modal__same">
          <input
            type="checkbox"
            checked={form.sameAsShipping}
            onChange={(e) => update('sameAsShipping', e.target.checked)}
          />
          Same as shipping address
        </label>
        <div className="new-order-modal__grid">
          <Field label="Address Line 1">
            <input
              value={form.dutyAddress1}
              disabled={form.sameAsShipping}
              onChange={(e) => update('dutyAddress1', e.target.value)}
              placeholder="Populate if not checked Free Form Field"
            />
          </Field>
          <Field label="Address Line 2">
            <input
              value={form.dutyAddress2}
              disabled={form.sameAsShipping}
              onChange={(e) => update('dutyAddress2', e.target.value)}
              placeholder="Populate if not checked Free Form Field"
            />
          </Field>
          <Field label="Zip">
            <select
              value={form.dutyZip}
              disabled={form.sameAsShipping}
              onChange={(e) => void handleZipChange('duty', e.target.value)}
            >
              <option value="">Dropdown</option>
              {(options?.zips ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="City">
            <input
              value={form.dutyCity}
              disabled={form.sameAsShipping}
              onChange={(e) => update('dutyCity', e.target.value)}
              placeholder="Populate based on Zip, Free Form Field"
            />
          </Field>
          <Field label="State">
            <input
              value={form.dutyState}
              disabled={form.sameAsShipping}
              onChange={(e) => update('dutyState', e.target.value)}
              placeholder="Populate based on Zip, Free Form Field"
            />
          </Field>
          <Field label="Signature Required">
            <select
              value={form.signatureRequired}
              onChange={(e) => update('signatureRequired', e.target.value)}
            >
              {(options?.signatureRequired ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Delivery Instructions">
          <textarea
            rows={3}
            value={form.deliveryInstructions}
            onChange={(e) => update('deliveryInstructions', e.target.value)}
            placeholder="Free Form Field"
          />
        </Field>

        {error ? <p className="new-order-modal__error">{error}</p> : null}
        {status ? <p className="new-order-modal__status">{status}</p> : null}

        <div className="new-order-modal__footer">
          <button type="button" className="new-order-modal__back" onClick={onBack}>
            Back
          </button>
          <div className="new-order-modal__footer-actions">
            <button
              type="button"
              className="new-order-modal__btn"
              disabled={busy}
              onClick={() => void submitItem(false)}
            >
              Add More
            </button>
            <button
              type="button"
              className="new-order-modal__btn"
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
    <label className="new-order-modal__field">
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
