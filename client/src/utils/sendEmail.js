const sendWithBrevo = async ({ to, subject, text, html }) => {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "TaskFlow", email: process.env.EMAIL_FROM },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });
  if (!response.ok) {
    console.error("Brevo error:", response.status, await response.text());
    throw new Error("EMAIL_FAILED");
  }
};

const sendWithResend = async ({ to, subject, text, html }) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "TaskFlow <" + process.env.EMAIL_FROM + ">",
      to: [to],
      subject,
      text,
      html,
    }),
  });
  if (!response.ok) {
    console.error("Resend error:", response.status, await response.text());
    throw new Error("EMAIL_FAILED");
  }
};

const sendWithGmail = async ({ to, subject, text, html }) => {
  const nodemailer = (await import("nodemailer")).default;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  await transporter.sendMail({
    from: "TaskFlow <" + process.env.GMAIL_USER + ">",
    to,
    subject,
    text,
    html,
  });
};

export const sendEmail = async (message) => {
  const provider = (process.env.EMAIL_PROVIDER || "brevo").toLowerCase();

  const configured =
    provider === "gmail"
      ? process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
      : provider === "resend"
      ? process.env.RESEND_API_KEY
      : process.env.BREVO_API_KEY;

  if (!configured) {
    console.log("EMAIL NOT SENT (" + provider + " is not configured). To: " + message.to);
    console.log(message.text);
    return;
  }

  try {
    if (provider === "gmail") await sendWithGmail(message);
    else if (provider === "resend") await sendWithResend(message);
    else await sendWithBrevo(message);
  } catch (error) {
    if (error.message !== "EMAIL_FAILED") {
      console.error("Email error:", error.message);
    }
    throw new Error("EMAIL_FAILED");
  }
};