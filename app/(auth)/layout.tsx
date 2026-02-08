export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--surface-2)] px-4 py-10">
      <div className="mx-auto w-full max-w-md">{children}</div>
    </div>
  );
}
