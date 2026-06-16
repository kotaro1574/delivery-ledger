export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-6">
          <div className="font-serif text-2xl font-bold tracking-wide">
            配達収支台帳
          </div>
          <div className="mt-1 text-xs tracking-[0.18em] text-muted-foreground">
            UBER DELIVERY · 青色申告対応
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
