import { cloneElement, useId } from "react";

/**
 * Wraps a form control with a real <label htmlFor> — the previous UI used
 * placeholder text as the only label, which screen readers don't announce
 * as a label at all.
 */
export default function FormField({ label, children, hint }) {
  const generatedId = useId();
  const childId = children.props.id || generatedId;

  return (
    <div className="form-field">
      <label htmlFor={childId}>{label}</label>
      {cloneElement(children, { id: childId })}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}
