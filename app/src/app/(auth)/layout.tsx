export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-6">
          <div className="text-xl tracking-wider text-[var(--game-gold)] sm:text-2xl">
            はいたつ しゅうし だいちょう
          </div>
          <div className="mt-1 text-xs tracking-[0.18em] text-[var(--game-sub)]">
            UBER DELIVERY · 青色申告対応
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
