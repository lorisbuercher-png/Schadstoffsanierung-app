import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7f6] p-5">
      <section className="w-full max-w-lg rounded-[26px] border border-red-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl font-black text-red-700">!</div>
        <h1 className="mt-5 text-2xl font-black text-slate-900">Anmeldung nicht möglich</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Verwende ein freigegebenes B&B-Microsoft-365-Konto mit der Adresse
          @bb-schadstoffsanierung.ch.
        </p>
        <Link href="/login" className="mt-7 inline-flex rounded-xl bg-[#e77818] px-5 py-3 font-black text-white hover:bg-[#c96210]">
          Erneut anmelden
        </Link>
      </section>
    </main>
  );
}
