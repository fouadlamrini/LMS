import Link from 'next/link';

export default function PublicHeader() {
    return (
        <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold text-foreground tracking-tight hover:opacity-80 transition">
                    LMS<span className="text-secondary">Platform</span>
                </Link>

                <nav className="hidden md:flex gap-8">
                    <Link href="/about" className="text-sm font-medium text-muted hover:text-foreground transition">
                        About
                    </Link>
                    <Link href="/courses" className="text-sm font-medium text-muted hover:text-foreground transition">
                        Courses
                    </Link>
                    <Link href="/contact" className="text-sm font-medium text-muted hover:text-foreground transition">
                        Contact
                    </Link>
                </nav>

                <div className="flex gap-4">
                    <Link
                        href="/login"
                        className="text-sm font-semibold px-4 py-2 hover:text-primary transition"
                    >
                        Log in
                    </Link>
                    <Link
                        href="/register"
                        className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-primary-hover transition shadow-sm"
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </header>
    );
}