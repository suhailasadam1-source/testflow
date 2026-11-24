import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  autoComplete,
  describedBy,
  invalid,
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="tf-field">
      <label htmlFor={id}>{label}</label>
      <div className="tf-input has-action">
        <input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
          required
        />
        <button
          type="button"
          className={"tf-eye" + (show ? " on" : "")}
          onClick={() => setShow(!show)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
        >
          <Eye size={18} className="eye-open" />
          <EyeOff size={18} className="eye-closed" />
        </button>
      </div>
    </div>
  );
}