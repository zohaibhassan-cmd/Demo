import './SimpleDialog.css'

type SimpleDialogProps = {
  open: boolean
  title: string
  message: string
  onClose: () => void
}

export function SimpleDialog({ open, title, message, onClose }: SimpleDialogProps) {
  if (!open) return null

  return (
    <div className="simple-dialog-overlay" role="presentation" onClick={onClose}>
      <div
        className="simple-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="simple-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="simple-dialog__close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <h2 id="simple-dialog-title">{title}</h2>
        <p>{message}</p>
        <div className="simple-dialog__actions">
          <button type="button" className="simple-dialog__ok" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
