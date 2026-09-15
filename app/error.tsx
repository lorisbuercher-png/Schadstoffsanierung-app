"use client";
export default function ErrorPage({reset}: {error: Error & {digest?: string}; reset: () => void}) {
  return <main className="mx-auto max-w-lg p-8"><h1 className="text-2xl font-semibold">Die Seite konnte nicht geladen werden</h1><p className="my-4">Bitte erneut versuchen. Falls der Fehler bestehen bleibt, kontaktiere die Geschäftsleitung.</p><button className="bb-primary-button" onClick={reset}>Erneut versuchen</button></main>;
}
