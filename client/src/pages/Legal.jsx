import { Link } from "react-router-dom";
import { Logo } from "../components/auth/BrandPanel";

function LegalPage({ title, children }) {
  return (
    <div className="tf-legal-wrap">
      <article className="tf-legal">
        <Logo />
        <h1>{title}</h1>
        <p className="tf-updated">Last updated: 24 November 2026</p>
        {children}
        <p style={{ marginTop: 28 }}>
          <Link to="/register" className="tf-back">
            Back to sign up
          </Link>
        </p>
      </article>
    </div>
  );
}

export function Terms() {
  return (
    <LegalPage title="Terms of Use">
      <h2>About TaskFlow</h2>
      <p>
        TaskFlow is a project management application built as a portfolio
        project. It is provided as is, for demonstration and personal use.
      </p>
      <h2>Your account</h2>
      <p>
        You are responsible for keeping your password private and for activity
        on your account. Please provide a real email address, because it is
        used to verify your account.
      </p>
      <h2>Acceptable use</h2>
      <p>
        Do not use TaskFlow to store unlawful or harmful content, to attack the
        service, or to access other users' data.
      </p>
      <h2>Availability</h2>
      <p>
        The service runs on free hosting, so it may be slow, unavailable, or
        reset without notice. Test data may be deleted at any time.
      </p>
      <h2>No warranty</h2>
      <p>
        TaskFlow is provided without warranties of any kind. Do not store
        sensitive or business-critical information in it.
      </p>
      <h2>Contact</h2>
      <p>For questions, contact the developer through the project's GitHub page.</p>
    </LegalPage>
  );
}

export function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <h2>What we collect</h2>
      <p>
        Your name, your email address, a hashed version of your password (never
        the password itself), and the tasks and projects you create.
      </p>
      <h2>How we use it</h2>
      <p>
        To run your account and show your own data. Your email address is used
        only to send verification codes.
      </p>
      <h2>Where it is stored</h2>
      <p>
        Data is stored in a MongoDB Atlas database. The app is hosted on Render
        and Netlify. An email delivery provider processes the verification
        emails we send.
      </p>
      <h2>Sharing</h2>
      <p>We do not sell your data or share it for advertising.</p>
      <h2>Security</h2>
      <p>
        Passwords are hashed, sessions use signed tokens, and verification
        codes are stored hashed and expire quickly.
      </p>
      <h2>Deleting your data</h2>
      <p>
        You can ask for your account and data to be deleted by contacting the
        developer through the project's GitHub page.
      </p>
    </LegalPage>
  );
}