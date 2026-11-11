import Link from "next/link";
import { formatDate, formatHeure } from "@/lib/format";

type ConversationApercu = {
  enfant: { id: string; prenom: string; nom: string; photoUrl: string | null };
  messages: { contenu: string; createdAt: Date; auteur: { prenom: string; nom: string } }[];
  nonLu: boolean;
};

export function ListeConversations({
  conversations,
  basePath,
}: {
  conversations: ConversationApercu[];
  basePath: string;
}) {
  if (conversations.length === 0) {
    return <p className="card text-sm text-stone-500">Aucune conversation pour le moment.</p>;
  }

  return (
    <div className="space-y-2">
      {conversations.map((c) => {
        const dernier = c.messages[0];
        return (
          <Link key={c.enfant.id} href={`${basePath}/${c.enfant.id}`} className="card flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-100 text-2xl">
              {c.enfant.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.enfant.photoUrl} alt={c.enfant.prenom} className="h-full w-full object-cover" />
              ) : (
                "👶"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold text-stone-900">
                  {c.enfant.prenom} {c.enfant.nom}
                </p>
                {dernier && (
                  <span className="shrink-0 text-xs text-stone-400">
                    {formatDate(dernier.createdAt)} {formatHeure(dernier.createdAt)}
                  </span>
                )}
              </div>
              <p className={`truncate text-sm ${c.nonLu ? "font-medium text-stone-700" : "text-stone-500"}`}>
                {dernier ? `${dernier.auteur.prenom} : ${dernier.contenu}` : "Aucun message — démarrez la conversation"}
              </p>
            </div>
            {c.nonLu && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500" aria-label="Non lu" />}
          </Link>
        );
      })}
    </div>
  );
}
