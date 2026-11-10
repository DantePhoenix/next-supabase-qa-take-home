import { Suspense } from "react";
import { CoffeeExplorer } from "@/components/coffee-explorer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight" data-testid="page-title">
            Coffee &amp; Health Explorer
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse 10,000 synthetic records of coffee consumption and health
            indicators. Use the search box and filters to narrow the results.
          </p>
        </header>
        <Suspense fallback={null}>
          <CoffeeExplorer />
        </Suspense>
      </div>
    </main>
  );
}
