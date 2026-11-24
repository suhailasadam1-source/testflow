import BrandPanel, { Logo } from "./BrandPanel";

export default function AuthShell({ children }) {
  return (
    <div className="tf-auth">
      <BrandPanel />
      <main className="tf-main">
        <div className="tf-mobile-brand">
          <Logo />
        </div>
        <div className="tf-card">{children}</div>
      </main>
    </div>
  );
}