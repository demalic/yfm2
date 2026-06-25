/** Simple background for table views — horizon line + scrolling floor */
export function TableBackdrop() {
  return (
    <div
      className="table-backdrop absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden
    >
      <div className="table-bg-base" />
      <div className="auth-bg-horizon" />
      <div className="auth-bg-floor" />
    </div>
  );
}
