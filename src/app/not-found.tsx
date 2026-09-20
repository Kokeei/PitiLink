import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <h1 className="text-3xl font-bold text-orange-600">PitiLink</h1>
        </div>
        <div className="card space-y-3">
          <p className="text-4xl">🔍</p>
          <p className="font-semibold">Page introuvable.</p>
          <p className="text-sm text-stone-500">Cette page n&apos;existe pas ou plus.</p>
          <Link href="/" className="btn-primary block w-full">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
