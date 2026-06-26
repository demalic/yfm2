/** Simple background for table views — horizon line + scrolling floor */
interface TableBackdropProps {
  showHorizon?: boolean;
  showFloor?: boolean;
}

export function TableBackdrop({ showHorizon = true, showFloor = true }: TableBackdropProps) {
  return (
    <div
      className="table-backdrop absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden
    >
      <div className="table-bg-base" />
      {showHorizon && <div className="auth-bg-horizon" />}
      {showFloor && <div className="auth-bg-floor" />}
    </div>
  );
}
