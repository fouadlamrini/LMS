export default function ColorsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans p-8">
            <main className="mx-auto max-w-4xl space-y-10">
                {/* Header */}
                <header>
                    <h1 className="text-4xl font-bold">
                        LMS Theme Preview
                    </h1>
                    <p className="mt-2 text-muted">
                        Visual check of your color palette
                    </p>
                </header>

                {/* Color blocks */}
                <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <ColorCard
                        title="Primary"
                        className="bg-primary text-white"
                        value="#261144"
                    />
                    <ColorCard
                        title="Secondary"
                        className="bg-secondary text-primary"
                        value="#ad82de"
                    />
                    <ColorCard
                        title="Background"
                        className="bg-background border border-border"
                        value="--background"
                    />
                    <ColorCard
                        title="Surface"
                        className="bg-surface border border-border"
                        value="--surface"
                    />
                </section>

                {/* Feedback Colors */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">Feedback Colors</h2>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="rounded-lg bg-[#10b981] p-4 text-white text-center">
                            <div className="font-semibold">Success</div>
                            <div className="text-sm opacity-90">Grade: A+</div>
                        </div>
                        <div className="rounded-lg bg-[#f59e0b] p-4 text-white text-center">
                            <div className="font-semibold">Warning</div>
                            <div className="text-sm opacity-90">Review</div>
                        </div>
                        <div className="rounded-lg bg-[#ef4444] p-4 text-white text-center">
                            <div className="font-semibold">Error</div>
                            <div className="text-sm opacity-90">Failed</div>
                        </div>
                        <div className="rounded-lg bg-[#3b82f6] p-4 text-white text-center">
                            <div className="font-semibold">Info</div>
                            <div className="text-sm opacity-90">Notice</div>
                        </div>
                    </div>
                </section>

                {/* Example UI */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">UI Examples</h2>

                    <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
                        <h3 className="text-lg font-semibold">Course Card</h3>
                        <p className="text-muted">
                            Learn Next.js with a clean LMS design system.
                        </p>

                        <div className="flex gap-3">
                            <button className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-[#3a1a5e] transition">
                                Enroll
                            </button>
                            <button className="rounded-lg border border-border px-4 py-2 text-foreground hover:bg-background transition">
                                Details
                            </button>
                        </div>
                    </div>

                    {/* Progress Example */}
                    <div className="rounded-xl border border-border bg-surface p-6 space-y-3">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Course Progress</h3>
                            <span className="text-sm font-medium text-[#10b981]">75%</span>
                        </div>
                        <div className="w-full bg-[#e3d9f3] rounded-full h-2.5">
                            <div className="bg-[#10b981] h-2.5 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                    </div>

                    {/* Alert Examples */}
                    <div className="space-y-3">
                        <div className="rounded-lg border border-[#10b981] bg-[#10b981]/10 p-4 flex items-start gap-3">
                            <span className="text-[#10b981] text-xl">✓</span>
                            <div>
                                <div className="font-medium text-[#10b981]">Assignment Submitted</div>
                                <div className="text-sm text-muted">Your work has been received successfully.</div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-[#f59e0b] bg-[#f59e0b]/10 p-4 flex items-start gap-3">
                            <span className="text-[#f59e0b] text-xl">⚠</span>
                            <div>
                                <div className="font-medium text-[#f59e0b]">Deadline Approaching</div>
                                <div className="text-sm text-muted">Assignment due in 2 days.</div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-[#3b82f6] bg-[#3b82f6]/10 p-4 flex items-start gap-3">
                            <span className="text-[#3b82f6] text-xl">ℹ</span>
                            <div>
                                <div className="font-medium text-[#3b82f6]">New Course Available</div>
                                <div className="text-sm text-muted">Check out Advanced React Patterns.</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="pt-10 text-sm text-muted">
                    Tip: try switching your system to dark mode 🌙
                </footer>
            </main>
        </div>
    );
}

function ColorCard({
    title,
    value,
    className,
}: {
    title: string;
    value: string;
    className: string;
}) {
    return (
        <div
            className={`rounded-xl p-6 shadow-sm flex flex-col justify-between ${className}`}
        >
            <span className="text-sm font-medium opacity-80">{title}</span>
            <span className="text-lg font-semibold">{value}</span>
        </div>
    );
}