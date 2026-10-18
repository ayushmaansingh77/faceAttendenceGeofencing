export default function Button({ variant = "primary", loading = false, disabled, children, className = "", ...rest }) {
  const classes = ["btn", `btn-${variant}`, className].filter(Boolean).join(" ");
  return (
    <button className={classes} disabled={disabled || loading} aria-busy={loading} {...rest}>
      {loading ? "Working…" : children}
    </button>
  );
}
