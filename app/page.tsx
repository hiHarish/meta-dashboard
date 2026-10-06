import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-4xl text-center">
        <div className="mb-8 inline-flex items-center rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm font-medium text-blue-300">
          NDC Digital Platform
        </div>

        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          NDC Meta Leads Dashboard
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
          Manage, track and assign your Meta leads from one centralized
          dashboard.
        </p>

        <div className="mt-10 flex justify-center">
          <Link
            href="/login"
            className="rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          >
            Login to Dashboard
          </Link>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          National Dental Care · Internal Lead Management System
        </p>
      </div>
    </main>
  );
}

