import { Check, CheckCircle2, Circle } from "lucide-react";

const benefits = [
  "Organize your work",
  "Track your progress",
  "Achieve more together",
];

export function Logo() {
  return (
    <span className="tf-logo">
      <span className="tf-logo-mark">
        <Check size={14} strokeWidth={3} />
      </span>
      TaskFlow
    </span>
  );
}

export default function BrandPanel() {
  return (
    <aside className="tf-brand" aria-label="About TaskFlow">
      <Logo />

      <div className="tf-brand-body">
        <h2 className="tf-headline">Make every task count.</h2>
        <p className="tf-sub">
          Bring your projects, people, and progress together in one organized
          workspace.
        </p>

        <div className="tf-preview" aria-hidden="true">
          <div className="tf-preview-head">
            <span>Launch checklist</span>
            <span>2 of 3</span>
          </div>
          <div className="tf-bar">
            <div />
          </div>
          <div className="tf-task done">
            <CheckCircle2 size={16} /> Design the landing page
          </div>
          <div className="tf-task done">
            <CheckCircle2 size={16} /> Connect the database
          </div>
          <div className="tf-task">
            <Circle size={16} /> Deploy to production
            <span className="tf-due">Due Fri</span>
          </div>
        </div>

        <ol className="tf-benefits">
          {benefits.map((text, i) => (
            <li key={text}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {text}
            </li>
          ))}
        </ol>
      </div>

      <p className="tf-foot">&copy; {new Date().getFullYear()} TaskFlow</p>
    </aside>
  );
}