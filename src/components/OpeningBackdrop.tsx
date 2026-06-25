/** Locked cinematic background for app open + sign-in only */
export function OpeningBackdrop() {
  return (
    <div
      className="opening-backdrop absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden
    >
      <div className="auth-bg-base" />
      <div className="auth-bg-aurora" />
      <div className="auth-bg-aurora auth-bg-aurora-alt" />
      <div className="auth-bg-rays" />
      <div className="auth-bg-horizon" />
      <div className="auth-bg-floor" />
      <div className="auth-bg-shimmer" />
      <div className="auth-bg-beam" />
      <div className="auth-bg-ring" />
      <div className="auth-bg-ring auth-bg-ring-delay-2" />
      <div className="auth-bg-ring auth-bg-ring-delay-4" />
      <div className="auth-bg-streak" />
      <div className="auth-bg-particles" />
      <div className="auth-bg-scanlines" />
      <div className="auth-grid absolute inset-0" />
      <div className="auth-vignette" />
    </div>
  );
}
