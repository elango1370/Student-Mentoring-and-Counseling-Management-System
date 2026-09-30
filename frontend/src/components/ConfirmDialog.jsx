import Modal from './Modal.jsx';
import { Spinner } from './States.jsx';

const ConfirmDialog = ({
  open, title = 'Are you sure?', message, confirmLabel = 'Confirm',
  cancelLabel = 'Cancel', onConfirm, onCancel, loading = false, destructive = true,
}) => (
  <Modal
    open={open}
    title={title}
    onClose={loading ? () => {} : onCancel}
    size="sm"
    footer={
      <>
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={destructive ? 'btn-danger' : 'btn-primary'}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading && <Spinner className="h-4 w-4" />}
          {confirmLabel}
        </button>
      </>
    }
  >
    <p className="text-sm text-ink-600">{message}</p>
  </Modal>
);

export default ConfirmDialog;
