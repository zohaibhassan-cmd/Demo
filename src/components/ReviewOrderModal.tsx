import { useEffect, useState } from 'react'
import {
  deleteReviewItem,
  fetchReviewOrder,
  placeReviewOrder,
  updateReviewItem,
  type DraftLineItem,
  type ReviewOrderPayload,
} from '../api/placeOrderApi'
import './ReviewOrderModal.css'

type ReviewOrderModalProps = {
  open: boolean
  draftId: string | null
  onClose: () => void
  onAddMore: (orderType: string | null) => void
  onPlaced?: (review: ReviewOrderPayload) => void
  onLoaded?: (review: ReviewOrderPayload) => void
}

export function ReviewOrderModal({
  open,
  draftId,
  onClose,
  onAddMore,
  onPlaced,
  onLoaded,
}: ReviewOrderModalProps) {
  const [review, setReview] = useState<ReviewOrderPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<DraftLineItem>>({})
  const [placedMessage, setPlacedMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !draftId) return
    let cancelled = false
    setError(null)
    setPlacedMessage(null)
    setEditingId(null)

    async function load() {
      try {
        const data = await fetchReviewOrder(draftId!)
        if (!cancelled) {
          setReview(data)
          onLoaded?.(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load review')
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, draftId])

  if (!open || !draftId) return null

  async function refresh(action: () => Promise<ReviewOrderPayload>) {
    setBusy(true)
    setError(null)
    try {
      const data = await action()
      setReview(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
      return null
    } finally {
      setBusy(false)
    }
  }

  function startEdit(item: DraftLineItem) {
    setEditingId(item.id)
    setEditDraft({ ...item })
  }

  async function saveEdit() {
    if (!editingId || !draftId) return
    const data = await refresh(() => updateReviewItem(draftId, editingId, editDraft))
    if (data) {
      setEditingId(null)
      setEditDraft({})
    }
  }

  async function handlePlaceOrder() {
    if (!draftId) return
    const data = await refresh(() => placeReviewOrder(draftId))
    if (data) {
      setPlacedMessage(data.message ?? `Order ${data.orderNumber} placed.`)
      onPlaced?.(data)
    }
  }

  return (
    <div className="review-order-overlay" role="presentation" onClick={onClose}>
      <div
        className="review-order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-order-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="review-order-modal__chrome">Order - Review Order</div>

        <button
          type="button"
          className="review-order-modal__close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        <h2 id="review-order-title" className="review-order-modal__title">
          Review Order for CLIN {review?.clin ?? 'XXXX'}
        </h2>

        <div className="review-order-modal__funding">
          <span>
            Total Funding Available Before Order:{' '}
            <strong>{review?.fundingAvailableBeforeFormatted ?? '—'}</strong>
          </span>
          <span className="review-order-modal__cart" aria-label={`${review?.cartCount ?? 0} items`}>
            <CartIcon />
            <span className="review-order-modal__cart-badge">{review?.cartCount ?? 0}</span>
          </span>
        </div>

        <div className="review-order-modal__table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col" />
                <th scope="col">Type</th>
                <th scope="col">RU1</th>
                <th scope="col">RU2</th>
                <th scope="col">Designator Code</th>
                <th scope="col">CCAT1</th>
                <th scope="col">CCAT2</th>
              </tr>
            </thead>
            <tbody>
              {(review?.items ?? []).map((item) => {
                const editing = editingId === item.id
                return (
                  <tr key={item.id}>
                    <td className="review-order-modal__actions-cell">
                      <button
                        type="button"
                        aria-label={editing ? `Save ${item.id}` : `Edit ${item.id}`}
                        title={editing ? 'Save' : 'Edit'}
                        disabled={busy || Boolean(placedMessage)}
                        onClick={() => (editing ? void saveEdit() : startEdit(item))}
                      >
                        {editing ? <SaveIcon /> : <EditIcon />}
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${item.id}`}
                        title="Delete"
                        disabled={busy || Boolean(placedMessage)}
                        onClick={() => void refresh(() => deleteReviewItem(draftId, item.id))}
                      >
                        <DeleteIcon />
                      </button>
                    </td>
                    {editing ? (
                      <>
                        <td>
                          <input
                            value={editDraft.type ?? ''}
                            onChange={(e) => setEditDraft((d) => ({ ...d, type: e.target.value }))}
                          />
                        </td>
                        <td>
                          <input
                            value={editDraft.ru1 ?? ''}
                            onChange={(e) => setEditDraft((d) => ({ ...d, ru1: e.target.value }))}
                          />
                        </td>
                        <td>
                          <input
                            value={editDraft.ru2 ?? ''}
                            onChange={(e) => setEditDraft((d) => ({ ...d, ru2: e.target.value }))}
                          />
                        </td>
                        <td>
                          <input
                            value={editDraft.designatorCode ?? ''}
                            onChange={(e) =>
                              setEditDraft((d) => ({ ...d, designatorCode: e.target.value }))
                            }
                          />
                        </td>
                        <td>
                          <input
                            value={editDraft.ccat1 ?? ''}
                            onChange={(e) => setEditDraft((d) => ({ ...d, ccat1: e.target.value }))}
                          />
                        </td>
                        <td>
                          <input
                            value={editDraft.ccat2 ?? ''}
                            onChange={(e) => setEditDraft((d) => ({ ...d, ccat2: e.target.value }))}
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{item.type}</td>
                        <td>{item.ru1}</td>
                        <td>{item.ru2}</td>
                        <td>{item.designatorCode}</td>
                        <td>{item.ccat1}</td>
                        <td>{item.ccat2}</td>
                      </>
                    )}
                  </tr>
                )
              })}
              {(review?.items.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={7} className="review-order-modal__empty">
                    No line items. Use Add More to add one.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="review-order-modal__summary">
          <span>CLIN {review?.clin ?? '########'}</span>
          <div>
            <strong>Order Total: {review?.orderTotalFormatted ?? '$0'}</strong>
            <p>{review?.emailMessage}</p>
          </div>
        </div>

        <div className="review-order-modal__after">
          Total Funding Available After Order:{' '}
          <strong>{review?.fundingAvailableAfterFormatted ?? '—'}</strong>
        </div>

        {error ? <p className="review-order-modal__error">{error}</p> : null}
        {placedMessage ? <p className="review-order-modal__placed">{placedMessage}</p> : null}

        <div className="review-order-modal__footer">
          <button type="button" className="review-order-modal__cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="review-order-modal__btn"
            disabled={busy || Boolean(placedMessage)}
            onClick={() => onAddMore(review?.orderType ?? null)}
          >
            Add More
          </button>          <button
            type="button"
            className="review-order-modal__btn"
            disabled={busy || Boolean(placedMessage) || (review?.items.length ?? 0) === 0}
            onClick={() => void handlePlaceOrder()}
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
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

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20h4l10.5-10.5-4-4L4 16v4z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12.5 5.5l4 4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function SaveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 7h14M10 7V5h4v2m-6 0l.7 12h5.6L15 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
