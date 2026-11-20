import { CheckCircle2, LayoutGrid, ListChecks, ShieldCheck } from "lucide-react";

export default function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <aside className="auth-side">
        <div className="auth-brand">
          <ListChecks size={26} /> TaskFlow
        </div>

        <div className="auth-pitch">
          <h2>Plan it. Track it. Finish it.</h2>
          <p>
            Organise your projects, set deadlines and see your progress at a
            glance, all in one place.
          </p>

          <div className="mock-card">
            <div className="mock-top">
              <span>Design landing page</span>
              <span className="mock-badge">High</span>
            </div>
            <div className="mock-bar">
              <div />
            </div>
            <small>60% complete</small>
          </div>

          <ul>
            <li>
              <LayoutGrid size={18} /> Drag-and-drop board and list views
            </li>
            <li>
              <CheckCircle2 size={18} /> Projects, deadlines and progress tracking
            </li>
            <li>
              <ShieldCheck size={18} /> Secure sign-in and protected projects
            </li>
          </ul>
        </div>

        <p className="auth-foot">© TaskFlow</p>
      </aside>

      <main className="auth-main">
        <div className="auth-brand mobile">
          <ListChecks size={22} /> TaskFlow
        </div>
        {children}
      </main>
    </div>
  );
}
