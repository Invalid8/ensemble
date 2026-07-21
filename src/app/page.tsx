export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <h1 className="font-heading text-4xl text-ink">TrueHue</h1>
      <p className="max-w-sm font-body text-base text-ink-secondary">
        One coordinated look — skin and outfit, together. Screens land here once the Pencil
        mockups in <code className="text-ink-muted">design/</code> are approved (see{" "}
        <code className="text-ink-muted">docs/DEVELOPMENT.md</code>).
      </p>
    </main>
  );
}
