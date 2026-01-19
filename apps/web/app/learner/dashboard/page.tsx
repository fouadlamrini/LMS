export default function Home() {
    return (
        <div>
            {/* --- HERO SECTION --- */}
            <main className="grow h-2/3 flex flex-col justify-center">
                <section className="relative py-20 lg:py-32 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center">

                        {/* Updated Heading: Focus on Professional Skills & Roles */}
                        <h1 className="text-5xl lg:text-7xl font-extrabold text-foreground mb-6 leading-tight">
                            Elevate Professional <br />
                            <span className="text-secondary italic">Learning & Teaching.</span>
                        </h1>

                        {/* Updated Subtext: Reference the "Trainer" and "Learner" focus of your brief */}
                        <p className="max-w-2xl text-lg text-muted mb-10">
                            The complete platform for corporate training. Empowers instructors to manage
                            curricula and students to master new skills through a controlled,
                            data-driven learning path.
                        </p>

                        {/* Updated CTA: More "Business" oriented labels */}
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <button className="bg-primary text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-hover transition-all shadow-lg hover:shadow-primary/20">
                                Access Learning Space
                            </button>
                            <button className="bg-surface border border-border text-foreground px-8 py-4 rounded-xl font-bold text-lg hover:bg-background transition-all">
                                Instructor Dashboard
                            </button>
                        </div>

                    </div>
                </section>
            </main>
        </div>
    );
}