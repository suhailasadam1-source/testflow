import { getPasswordChecks } from "../../utils/passwordRules";

const labels = ["", "Weak", "Fair", "Good", "Strong"];

export default function PasswordStrength({ password, id }) {
  const checks = getPasswordChecks(password);
  const passed = checks.filter((check) => check.ok).length;
  const level = password
    ? Math.max(1, Math.round((passed / checks.length) * 4))
    : 0;
  const missing = checks.find((check) => !check.ok);

  return (
    <div id={id} aria-live="polite">
      <div className="tf-strength" data-level={level}>
        <span />
        <span />
        <span />
        <span />
      </div>
      <p className="tf-hint">
        <span>
          {missing
            ? "Needs: " + missing.label.toLowerCase()
            : "All requirements met"}
        </span>
        <strong className={"lv" + level}>{labels[level]}</strong>
      </p>
    </div>
  );
}
