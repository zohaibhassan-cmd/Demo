import { useEffect, useState } from 'react'
import {
  deleteItemizationLine,
  fetchItemization,
  updateItemizationLine,
  type ItemizationLine,
  type ItemizationPayload,
} from '../api/itemizationApi'
import './ItemizationModal.css'

type ItemizationModalProps = {
  open: boolean
  orderId: string | null
  onClose: () => void
}

export function ItemizationModal({ open, orderId, onClose }: ItemizationModalProps) {
  const [data, setData] = useState<ItemizationPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<ItemizationLine>>({})

  useEffect(() => {
    if (!open || !orderId) return
    let cancelled = false
    setError(null)
    setEditingId(null)
    setData(null)

    async function load() {
      try {
        const payload = await fetchItemization(orderId!)
        if (!cancelled) setData(payload)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load itemization')
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, orderId])

  if (!open || !orderId) return null

  async function refresh(action: () => Promise<ItemizationPayload>) {
    setBusy(true)
    setError(null)
    try {
      const payload = await action()
      setData(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  function startEdit(line: ItemizationLine) {
    setEditingId(line.id)
    setEditDraft({ ...line })
  }

  async function saveEdit() {
    if (!editingId || !orderId) return
    await refresh(() => updateItemizationLine(orderId, editingId, editDraft))
    setEditingId(null)
    setEditDraft({})
  }

  return (
    <div className="itemization-overlay" role="presentation" onClick={onClose}>
      <div
        className="itemization-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="itemization-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="itemization-modal__close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        <h2 id="itemization-title" className="itemization-modal__title">
          {data?.title ?? 'Itemization of Order XXXX CLIN XXXX'}
        </h2>
        <p className="itemization-modal__status">
          Order Status: {data?.orderStatus ?? 'Pending/Complete'}
        </p>

        <div className="itemization-modal__table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col" />
                <th scope="col">Type</th>
                <th scope="col">NID</th>
                <th scope="col">POC</th>
                <th scope="col">Designator Code</th>
                <th scope="col">STAT1</th>
                <th scope="col">STAT2</th>
              </tr>
            </thead>
            <tbody>
              {(data?.lines ?? []).map((line) => {
                const editing = editingId === line.id
                return (
                  <tr key={line.id}>
                    <td className="itemization-modal__actions">
                      <button
                        type="button"
                        title={editing ? 'Save' : 'Edit'}
                        aria-label={editing ? `Save ${line.id}` : `Edit ${line.id}`}
                        disabled={busy}
                        onClick={() => (editing ? void saveEdit() : startEdit(line))}
                      >
                        {editing ? <SaveIcon /> : <EditIcon />}
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        aria-label={`Delete ${line.id}`}
                        disabled={busy}
                        onClick={() =>
                          void refresh(() => deleteItemizationLine(orderId, line.id))
                        }
                      >
                        <DeleteIcon />
                      </button>
                    </td>
                    {editing ? (
                      <>
                        <td>
                          <input
                            value={editDraft.type ?? ''}
                            onChange={(e) =>
                              setEditDraft((d) => ({ ...d, type: e.target.value }))
                            }
                          />
                        </td>
                        <td>
                          <input
                            value={editDraft.nid ?? ''}
                            onChange={(e) =>
                              setEditDraft((d) => ({ ...d, nid: e.target.value }))
                            }
                          />
                        </td>
                        <td>
                          <input
                            value={editDraft.poc ?? ''}
                            onChange={(e) =>
                              setEditDraft((d) => ({ ...d, poc: e.target.value }))
                            }
                          />
                        </td>
                        <td>
                          <input
                            value={editDraft.designatorCode ?? ''}
                            onChange={(e) =>
                              setEditDraft((d) => ({
                                ...d,
                                designatorCode: e.target.value,
                              }))
                            }
                          />
                        </td>
                        <td>
                          <input
                            value={editDraft.stat1 ?? ''}
                            onChange={(e) =>
                              setEditDraft((d) => ({ ...d, stat1: e.target.value }))
                            }
                          />
                        </td>
                        <td>
                          <input
                            value={editDraft.stat2 ?? ''}
                            onChange={(e) =>
                              setEditDraft((d) => ({ ...d, stat2: e.target.value }))
                            }
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{line.type}</td>
                        <td>{line.nid}</td>
                        <td>{line.poc}</td>
                        <td>{line.designatorCode}</td>
                        <td>{line.stat1}</td>
                        <td>{line.stat2}</td>
                      </>
                    )}
                  </tr>
                )
              })}
              {(data?.lines.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={7} className="itemization-modal__empty">
                    No line items for this order.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="itemization-modal__total">
          Total Items: {data?.totalItems ?? 0} for {data?.orderTotalFormatted ?? '$0'}
        </div>

        <div className="itemization-modal__categories">
          {(data?.categories ?? []).map((category) => (
            <div key={category.label} className="itemization-modal__category">
              {category.label}: {category.count} for {category.amountFormatted}
            </div>
          ))}
        </div>

        {error ? <p className="itemization-modal__error">{error}</p> : null}

        <div className="itemization-modal__footer">
          <button type="button" className="itemization-modal__close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
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
