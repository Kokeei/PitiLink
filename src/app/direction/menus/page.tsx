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

  const menu = await prisma.menuJour.findUnique({
    where: { garderieId_date: { garderieId: user.garderieId!, date: debutJournee(date) } },
  });

  const menusAVenir = await prisma.menuJour.findMany({
    where: { garderieId: user.garderieId!, date: { gte: debutJournee() } },
    orderBy: { date: "asc" },
    take: 7,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Menus</h1>

      <div className="card space-y-3">
        <p className="font-semibold">Menu du {formatDate(date)}</p>
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
        <ul className="space-y-2 text-sm">
          {menusAVenir.map((m) => (
            <li key={m.id} className="border-b border-stone-100 pb-2 last:border-0">
              <p className="font-medium">{formatDate(m.date)}</p>
              <p className="text-stone-500">{[m.petitDejeuner, m.dejeuner, m.gouter].filter(Boolean).join(" · ")}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
