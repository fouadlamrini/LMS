export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* --- HEADER --- */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold text-foreground tracking-tight">
            LMS<span className="text-secondary">Platform</span>
          </div>

          <div className="flex gap-4">
            <button className="text-sm font-semibold px-4 py-2 hover:text-primary transition">Log in</button>
            <button className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-primary-hover transition shadow-sm">
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
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

      {/* --- FOOTER --- */}
      <footer className="bg-surface border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xl font-bold text-foreground">
            LMS<span className="text-secondary">Platform</span>
          </div>

          <p className="text-sm text-muted">
            © {new Date().getFullYear()} LMS Inc. All rights reserved.
          </p>

          <div className="flex gap-6">
            <a href="#" className="text-muted hover:text-primary transition-colors text-sm">Privacy</a>
            <a href="#" className="text-muted hover:text-primary transition-colors text-sm">Terms</a>
            <a href="#" className="text-muted hover:text-primary transition-colors text-sm">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}