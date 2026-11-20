export const getPasswordChecks = (password) => [
  { label: "At least 10 characters", ok: password.length >= 10 },
  { label: "One uppercase letter", ok: /[A-Z]/.test(password) },
  { label: "One lowercase letter", ok: /[a-z]/.test(password) },
  { label: "One number", ok: /[0-9]/.test(password) },
  { label: "One symbol (for example ! @ # $)", ok: /[^A-Za-z0-9]/.test(password) },
];

export const isStrongPassword = (password) =>
  getPasswordChecks(password).every((check) => check.ok);