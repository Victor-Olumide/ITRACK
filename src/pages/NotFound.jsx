
import {
  ArrowLeft,
  ArrowRight,
  Home,
  MonitorX,
  Ticket,
  Headphones,
  CircleHelp
} from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0c194d] p-5">

      {/* Background decoration */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-lime-400/10 blur-3xl" />

      <section className="relative w-full max-w-6xl overflow-hidden rounded-[30px] bg-[#f4f6fc] px-6 py-16 sm:px-12 lg:px-20">

        {/* Branding */}
        <div className="absolute left-7 top-7 flex items-center gap-2 sm:left-10 sm:top-9">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3155ff] text-white">
            <MonitorX size={20} />
          </div>
          <span className="text-lg font-bold text-[#101a3b]">
            IT Desk
          </span>
        </div>

        <div className="grid items-center gap-12 pt-8 lg:grid-cols-2 lg:gap-8">

          {/* LEFT CONTENT */}
          <div className="order-2 text-center lg:order-1 lg:text-left">

            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-700">
              <CircleHelp size={15} />
              Error 404
            </span>

            <h1 className="mt-6 text-6xl font-black tracking-tighter text-[#101a3b] sm:text-7xl lg:text-8xl">
              Oops!
            </h1>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#101a3b] sm:text-3xl">
              This page went missing.
            </h2>

            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-500 lg:mx-0">
              We couldn't find the page you're looking for.
              It may have been moved, deleted, or the link
              might be incorrect.
            </p>

            {/* Actions */}
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">

              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3155ff] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                <Home size={17} />
                Back to dashboard
                <ArrowRight size={16} />
              </a>

              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3.5 text-sm font-bold text-[#101a3b] transition hover:bg-slate-50"
              >
                <ArrowLeft size={17} />
                Go back
              </button>

            </div>

            {/* Support */}
            <div className="mt-10 flex flex-col items-center gap-2 text-sm text-slate-500 sm:flex-row lg:justify-start">
              <Headphones size={17} />
              <span>Still need help?</span>
              <a
                href="/support"
                className="font-bold text-blue-600 hover:underline"
              >
                Contact IT support
              </a>
            </div>

          </div>

          {/* RIGHT ILLUSTRATION */}
          <div className="order-1 flex min-h-[280px] items-center justify-center lg:order-2 lg:min-h-[440px]">

            <div className="relative flex h-[290px] w-full max-w-[440px] items-center justify-center sm:h-[380px]">

              {/* Large 404 */}
              <span className="absolute select-none text-[150px] font-black tracking-tighter text-blue-100 sm:text-[210px]">
                404
              </span>

              {/* Illustration card */}
              <div className="relative z-10 flex h-52 w-64 -rotate-6 flex-col items-center justify-center rounded-[28px] border border-white bg-white shadow-2xl shadow-blue-900/10 sm:h-64 sm:w-80">

                <div className="flex h-24 w-24 items-center justify-center rounded-[26px] bg-blue-50 text-[#3155ff] sm:h-28 sm:w-28">
                  <MonitorX size={65} strokeWidth={1.3} />
                </div>

                <div className="mt-5 h-2.5 w-28 rounded-full bg-slate-100" />
                <div className="mt-2 h-2 w-20 rounded-full bg-slate-100" />

                <div className="absolute -right-4 -top-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-300 text-[#101a3b] shadow-lg">
                  <CircleHelp size={24} />
                </div>

              </div>

              {/* Floating ticket */}
              <div className="absolute bottom-5 left-0 z-20 flex items-center gap-3 rounded-2xl border border-white bg-white p-3 shadow-xl sm:bottom-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Ticket size={21} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#101a3b]">
                    Page not found
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Error code: 404
                  </p>
                </div>
              </div>

              {/* Floating status */}
              <div className="absolute right-0 top-5 z-20 flex items-center gap-2 rounded-full bg-white px-4 py-3 shadow-lg sm:right-2 sm:top-10">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="text-xs font-bold text-slate-700">
                  Lost connection
                </span>
              </div>

              {/* Decorative dots */}
              <div className="absolute right-8 bottom-2 h-5 w-5 rounded-full bg-lime-300" />
              <div className="absolute left-12 top-4 h-3 w-3 rounded-full bg-blue-400" />

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} IT Desk. All rights reserved.</p>
          <p>IT Management System</p>
        </div>

      </section>
    </main>
  );
}
