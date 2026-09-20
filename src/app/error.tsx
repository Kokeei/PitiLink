"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <h1 className="text-3xl font-bold text-orange-600">PitiLink</h1>
        </div>
        <div className="card space-y-3">
          <p className="text-4xl">😕</p>
          <p className="font-semibold">Une erreur est survenue.</p>
          <p className="text-sm text-stone-500">
            Ce n&apos;est pas grave, réessayez — si le problème persiste, contactez la direction de votre garderie.
          </p>
          <button onClick={() => reset()} className="btn-primary w-full">
            Réessayer
          </button>
        </div>
      </div>
    </div>
  );
}
