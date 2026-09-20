import Link from "next/link";
import { requireUser, ROLES_PARENT } from "@/lib/session";
import { DeconnexionButton } from "@/components/DeconnexionButton";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(ROLES_PARENT);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3">
        <div>
          <p className="font-bold text-orange-600">PitiLink</p>
          <p className="text-xs text-stone-500">{user.name} · Espace parent</p>
        </div>
        <DeconnexionButton />
      </header>

      <nav className="flex border-b border-stone-200 bg-white text-sm font-medium">
        <Link href="/parent" className="flex-1 px-4 py-3 text-center hover:bg-stone-50">
          👶 Mes enfants
        </Link>
        <Link href="/parent/absences" className="flex-1 px-4 py-3 text-center hover:bg-stone-50">
          🏖️ Absences
        </Link>
      </nav>

      <main className="mx-auto w-full max-w-2xl flex-1 bg-stone-50 px-4 py-4 pb-16">{children}</main>
    </div>
  );
}
