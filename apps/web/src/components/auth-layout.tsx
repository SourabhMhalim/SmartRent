import { Brand } from "@/components/brand";

type AuthLayoutProps = {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
};

export function AuthLayout({
  children,
  eyebrow,
  title,
  description,
}: AuthLayoutProps) {
  return (
    <main className="auth-grid">
      <aside className="auth-visual">
        <div className="relative z-10">
          <Brand dark />
        </div>

        <div className="relative z-10 max-w-[540px]">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#99F6E4]">
            {eyebrow}
          </p>
          <h2 className="font-display text-4xl font-extrabold leading-tight tracking-normal md:text-5xl">
            {title}
          </h2>
          <p className="mt-4 max-w-[460px] text-base leading-7 text-[#CCFBF1]">
            {description}
          </p>
        </div>

        <div className="building-scene" aria-hidden="true">
          <div className="building">
            <div className="building-roof" />
            <div className="window-grid">
              {Array.from({ length: 12 }).map((_, index) => (
                <span className="window" key={index} />
              ))}
            </div>
          </div>
        </div>
      </aside>

      <section className="auth-main">{children}</section>
    </main>
  );
}
