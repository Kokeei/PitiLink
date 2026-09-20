import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { debutJournee, formatDate } from "@/lib/format";
import { enregistrerMenu } from "./actions";

export default async function MenusPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await requireUser(ROLES_DIRECTION);
  const { date: dateParam } = await searchParams;
  const date = dateParam ? new Date(dateParam) : new Date();
  const estAujourdhui = debutJournee(date).getTime() === debutJournee().getTime();

  const veille = new Date(date);
  veille.setDate(veille.getDate() - 1);
  const lendemain = new Date(date);
  lendemain.setDate(lendemain.getDate() + 1);

  const [menu, menusAVenir] = await Promise.all([
    prisma.menuJour.findUnique({
      where: { garderieId_date: { garderieId: user.garderieId!, date: debutJournee(date) } },
    }),
    prisma.menuJour.findMany({
      where: { garderieId: user.garderieId!, date: { gte: debutJournee() } },
      orderBy: { date: "asc" },
      take: 7,
    }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Menus</h1>

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <Link href={`?date=${veille.toISOString().slice(0, 10)}`} className="text-sm text-orange-600">
            ← Veille
          </Link>
          <p className="font-semibold">{estAujourdhui ? "Aujourd'hui" : formatDate(date)}</p>
          <Link href={`?date=${lendemain.toISOString().slice(0, 10)}`} className="text-sm text-orange-600">
            Lendemain →
          </Link>
        </div>
        <form action={enregistrerMenu} className="space-y-2">
          <input type="hidden" name="date" value={date.toISOString().slice(0, 10)} />
          <input
            name="petitDejeuner"
            placeholder="Petit-déjeuner"
            defaultValue={menu?.petitDejeuner ?? ""}
            className="input-large"
          />
          <input
            name="dejeuner"
            placeholder="Déjeuner"
            defaultValue={menu?.dejeuner ?? ""}
            className="input-large"
          />
          <input name="gouter" placeholder="Goûter" defaultValue={menu?.gouter ?? ""} className="input-large" />
          <button className="btn-primary w-full">Enregistrer</button>
        </form>
      </div>

      <div className="card">
        <p className="mb-2 font-semibold">Menus à venir</p>
        {menusAVenir.length === 0 && <p className="text-sm text-stone-500">Aucun menu planifié pour le moment.</p>}
        <ul className="space-y-2 text-sm">
          {menusAVenir.map((m) => (
            <li key={m.id} className="border-b border-stone-100 pb-2 last:border-0">
              <Link href={`?date=${m.date.toISOString().slice(0, 10)}`} className="block hover:bg-stone-50">
                <p className="font-medium text-orange-700">{formatDate(m.date)}</p>
                <p className="text-stone-500">{[m.petitDejeuner, m.dejeuner, m.gouter].filter(Boolean).join(" · ")}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
