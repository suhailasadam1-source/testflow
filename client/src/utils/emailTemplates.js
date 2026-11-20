function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function verificationEmail({ name, otp }) {
  const safeName = escapeHtml(name || "there");
  const safeOtp = escapeHtml(otp);

  return {
    subject: "Your TaskFlow verification code",
    html: `<p>Hello ${safeName},</p><p>Your TaskFlow verification code is <strong>${safeOtp}</strong>.</p><p>This code expires in 5 minutes. If you did not request it, you can ignore this email.</p>`,
    text: `Hello ${name || "there"},\n\nYour TaskFlow verification code is ${otp}.\n\nThis code expires in 5 minutes. If you did not request it, you can ignore this email.`,
  };
}
