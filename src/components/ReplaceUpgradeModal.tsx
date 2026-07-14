import { useEffect, useState, type ReactNode } from 'react'
import {
  fetchReplaceUpgradeContext,
  fetchReplaceUpgradeOptions,
  lookupZip,
  submitReplaceUpgradeItem,
  type ReplaceUpgradeContext,
  type ReplaceUpgradeItemInput,
  type ReplaceUpgradeOptions,
} from '../api/placeOrderApi'
import './ReplaceUpgradeModal.css'

type ReplaceUpgradeModalProps = {
  open: boolean
  draftId: string | null
  onClose: () => void
  onBack: () => void
  onGoToCart: (draftId: string, cartCount: number) => void
}

const emptyForm: ReplaceUpgradeItemInput = {
  firstName: '',
  lastName: '',
  email: '',
  puiNickname1: '',
  puiNickname2: '',
  bureauDesignator: '',
  eca1: '',
  eca2: '',
  eca3: '',
  restrictedReporting: 'No (default)',
  requestedDeliveryDate: '',
  shipAddress1: '',
  shipAddress2: '',
  shipZip: '',
  shipCity: '',
  shipState: '',
  setAsStandardAddress: false,
  setAsShipToDefault: false,
  signatureRequired: 'No (default)',
  deliveryInstructions: '',
  unitCost: 33333,
}

export function ReplaceUpgradeModal({
  open,
  draftId,
  onClose,
  onBack,
  onGoToCart,
}: ReplaceUpgradeModalProps) {
  const [options, setOptions] = useState<ReplaceUpgradeOptions | null>(null)
  const [context, setContext] = useState<ReplaceUpgradeContext | null>(null)
  const [form, setForm] = useState<ReplaceUpgradeItemInput>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState<{ title: string; message: string } | null>(null)

  useEffect(() => {
    if (!open || !draftId) return
    let cancelled = false
    setError(null)
    setStatus(null)
    setForm(emptyForm)
    setInfo(null)

    async function load() {
      try {
        const [opts, ctx] = await Promise.all([
          fetchReplaceUpgradeOptions(),
          fetchReplaceUpgradeContext(draftId!),
        ])
        if (cancelled) return
        setOptions(opts)
        setContext(ctx)
        setForm((prev) => ({ ...prev, unitCost: opts.unitCost }))
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load Replace-Upgrade form')
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, draftId])

  if (!open || !draftId) return null

  function update<K extends keyof ReplaceUpgradeItemInput>(
    key: K,
    value: ReplaceUpgradeItemInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleZipChange(zip: string) {
    update('shipZip', zip)
    update('shipCity', '')
    update('shipState', '')
    if (!zip) return
    try {
      const result = await lookupZip(zip)
      setForm((prev) => ({
        ...prev,
        shipZip: zip,
        shipCity: result.city,
        shipState: result.state,
      }))
    } catch {
      // allow manual city/state
    }
  }

  async function submitItem(thenGoToCart: boolean) {
    if (!draftId) return
    setBusy(true)
    setError(null)
    setStatus(null)
    try {
      const result = await submitReplaceUpgradeItem(draftId, form)
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

  return (
    <div className="replace-overlay" role="presentation" onClick={onClose}>
      <div
        className="replace-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="replace-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="replace-modal__chrome">Order - Replace-Upgrade</div>
        <button type="button" className="replace-modal__close" aria-label="Close" onClick={onClose}>
          ×
        </button>

        <h2 id="replace-title" className="replace-modal__title">
          Order for CLIN {context?.clin ?? '###'}
        </h2>

        <div className="replace-modal__funding">
          <span>
            Total Funding Available Before Order:{' '}
            <strong>{context?.fundingAvailableBeforeFormatted ?? '—'}</strong>
          </span>
          <span className="replace-modal__cart" aria-label={`Cart ${context?.cartCount ?? 0}`}>
            <CartIcon />
            <span className="replace-modal__cart-badge">{context?.cartCount ?? 0}</span>
          </span>
        </div>

        <div className="replace-modal__type-row">
          <label>
            <span>Order Type</span>
            <select value="Replace-Upgrade" disabled>
              <option>Replace-Upgrade</option>
            </select>
          </label>
          <div className="replace-modal__links">
            <button
              type="button"
              onClick={() =>
                setInfo({
                  title: 'What does this mean?',
                  message:
                    context?.whatThisMeans ??
                    'Replace-Upgrade swaps or upgrades an existing device under the selected CLIN.',
                })
              }
            >
              What does this mean?
            </button>
            <button
              type="button"
              onClick={() =>
                setInfo({
                  title: 'Note',
                  message:
                    context?.note ??
                    'Ensure PUI nicknames and delivery dates align with the active Period of Performance.',
                })
              }
            >
              Note
            </button>
          </div>
        </div>

        <h3>User Details</h3>
        <div className="replace-modal__grid">
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
          <Field label="PUI Nickname">
            <select
              value={form.puiNickname1}
              onChange={(e) => update('puiNickname1', e.target.value)}
            >
              <option value="">Dropdown</option>
              {(options?.puiNickname ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="PUI Nickname">
            <select
              value={form.puiNickname2}
              onChange={(e) => update('puiNickname2', e.target.value)}
            >
              <option value="">Dropdown</option>
              {(options?.puiNickname ?? []).map((o) => (
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

        <h3>Item Details</h3>
        <div className="replace-modal__cost">
          <span>
            Unit Cost: <strong>{context?.unitCostFormatted ?? '—'}</strong>
          </span>
          <span>
            Initial Maintenance Unit Cost:{' '}
            <strong>{context?.initialMaintenanceUnitCostFormatted ?? '—'}</strong>
          </span>
        </div>
        <div className="replace-modal__grid">
          <Field label="ECA#1">
            <select value={form.eca1} onChange={(e) => update('eca1', e.target.value)}>
              <option value="">Dropdown</option>
              {(options?.eca1 ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ECA#2">
            <select value={form.eca2} onChange={(e) => update('eca2', e.target.value)}>
              <option value="">Dropdown</option>
              {(options?.eca2 ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ECA#3">
            <select value={form.eca3} onChange={(e) => update('eca3', e.target.value)}>
              <option value="">Dropdown</option>
              {(options?.eca3 ?? []).map((o) => (
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
        <div className="replace-modal__grid">
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
            <select value={form.shipZip} onChange={(e) => void handleZipChange(e.target.value)}>
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

        <div className="replace-modal__checks">
          <label>
            <input
              type="checkbox"
              checked={form.setAsStandardAddress}
              onChange={(e) => update('setAsStandardAddress', e.target.checked)}
            />
            Set as standard address
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.setAsShipToDefault}
              onChange={(e) => update('setAsShipToDefault', e.target.checked)}
            />
            Set as &quot;Ship To&quot; default
          </label>
        </div>

        <Field label="Delivery Instructions">
          <textarea
            rows={3}
            value={form.deliveryInstructions}
            onChange={(e) => update('deliveryInstructions', e.target.value)}
            placeholder="Free Form Field"
          />
        </Field>

        {error ? <p className="replace-modal__error">{error}</p> : null}
        {status ? <p className="replace-modal__status-msg">{status}</p> : null}

        <div className="replace-modal__footer">
          <button type="button" className="replace-modal__back" onClick={onBack}>
            Back
          </button>
          <div className="replace-modal__footer-actions">
            <button
              type="button"
              className="replace-modal__btn"
              disabled={busy}
              onClick={() => void submitItem(false)}
            >
              Add More
            </button>
            <button
              type="button"
              className="replace-modal__btn"
              disabled={busy}
              onClick={() => void submitItem(true)}
            >
              Go to Cart
            </button>
          </div>
        </div>

        {info ? (
          <div className="replace-modal__info" role="status">
            <strong>{info.title}</strong>
            <p>{info.message}</p>
            <button type="button" onClick={() => setInfo(null)}>
              OK
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="replace-modal__field">
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
