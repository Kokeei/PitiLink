import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { creerProfessionnel } from "./actions";

export default async function ProfessionnelsPage() {
  const user = await requireUser(ROLES_DIRECTION);
  const professionnels = await prisma.user.findMany({
    where: { garderieId: user.garderieId!, role: { in: ["PROFESSIONNEL", "RESPONSABLE"] } },
    include: { _count: { select: { affectations: true } } },
    orderBy: { prenom: "asc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Professionnels</h1>

      <div className="card space-y-3">
        <p className="font-semibold">Ajouter un professionnel</p>
        <form action={creerProfessionnel} className="grid grid-cols-2 gap-2">
          <input name="prenom" placeholder="Prénom" className="input-large" required />
          <input name="nom" placeholder="Nom" className="input-large" required />
          <input name="email" type="email" placeholder="Email" className="input-large col-span-2" required />
          <input
            name="motDePasse"
            type="password"
            placeholder="Mot de passe initial"
            className="input-large col-span-2"
            required
            minLength={8}
          />
          <button className="btn-primary col-span-2">Créer le compte</button>
        </form>
      </div>

      <div className="space-y-2">
        {professionnels.map((p) => (
          <div key={p.id} className="card flex items-center justify-between">
            <div>
              <p className="font-medium">{p.prenom} {p.nom}</p>
              <p className="text-sm text-stone-500">{p.email} · {p.role}</p>
            </div>
            <span className="pill bg-stone-100">{p._count.affectations} affectation(s)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
