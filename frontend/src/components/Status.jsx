export default function Status({ status, onDismiss }) {
  if (!status) return null;
  return (
    <div className={`alert alert-${status.type} alert-dismissible fade show`} role="alert">
      {status.message}
      <button type="button" className="btn-close" aria-label="Close" onClick={onDismiss} />
    </div>
  );
}
