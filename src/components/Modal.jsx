// Simple confirmation modal
export default function Modal({ open, title, children, confirmText = "Confirm", onConfirm, onClose, danger }) {
  if (!open) return null;
  return (
    <>
      <div className="modal d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title h6 mb-0">{title}</h5>
              <button className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">{children}</div>
            <div className="modal-footer">
              <button className="btn btn-light" onClick={onClose}>Cancel</button>
              <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show"></div>
    </>
  );
}
