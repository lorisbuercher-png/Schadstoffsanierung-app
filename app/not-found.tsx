import Link from "next/link";
export default function NotFound() {
  return <main className="mx-auto max-w-lg p-8"><h1 className="text-2xl font-semibold">Seite nicht gefunden</h1><p className="my-4">Dieser Link ist nicht mehr gültig.</p><Link className="bb-primary-button" href="/">Zur Übersicht</Link></main>;
}
