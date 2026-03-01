import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const runtime = 'edge';
export const revalidate = 300;

export default function Home() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <div className="mx-auto flex max-w-5xl flex-col gap-12">
                <header className="space-y-6">
                    <Badge variant="muted" className="w-fit rounded-full px-4 py-2 text-xs font-semibold uppercase">
                        Next.js App Router • React Server Components
                    </Badge>
                    <h1 className="text-5xl font-bold leading-tight text-foreground">
                        ScientistShield on Next.js: instant, SEO-friendly content with zero client JavaScript for
                        readers.
                    </h1>
                    <p className="max-w-3xl text-lg text-muted-foreground">
                        Tutorials and coding problems now stream from the server. Interactivity stays client-side only
                        where you need it (editors, runners, dashboards).
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Button asChild className="shadow-lg shadow-primary/30">
                            <Link href="/tutorials">Browse Tutorials</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/problems">Solve Problems</Link>
                        </Button>
                    </div>
                </header>

                <div className="grid gap-6 sm:grid-cols-2">
                    <Highlight
                        title="Edge-ready pages"
                        body="App Router routes default to the Edge runtime for fast global TTFB. Static parts are cached; data revalidates every 5 minutes."
                    />
                    <Highlight
                        title="RSC data fetching"
                        body="Tutorials and problem lists render on the server using plain fetch calls to the Express API, eliminating client bundles for read-only views."
                    />
                    <Highlight
                        title="Tailwind + shadcn/ui ready"
                        body="Tailwind CSS is already wired. Drop shadcn/ui components for consistent desktop-style surfaces without custom CSS bloat."
                    />
                    <Highlight
                        title="Side-by-side migration"
                        body="Vite SPA stays intact while Next.js grows in /client-next. Swap the primary frontend once parity is verified."
                    />
                </div>
            </div>
        </main>
    );
}

const Highlight = ({ title, body }: { title: string; body: string }) => (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-lg">
        <CardHeader className="pb-2">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{body}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
            <div className="h-1.5 w-16 rounded-full bg-primary/50" aria-hidden />
        </CardContent>
    </Card>
);
