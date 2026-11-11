import { formatDate, formatHeure } from "@/lib/format";

type MessageAffiche = {
  id: string;
  contenu: string;
  createdAt: Date;
  auteur: { id: string; prenom: string; nom: string };
};

export function FilDiscussion({
  messages,
  userId,
  envoyerAction,
}: {
  messages: MessageAffiche[];
  userId: string;
  envoyerAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="card flex flex-col gap-3">
        {messages.length === 0 && <p className="text-sm text-stone-500">Aucun message. Écrivez le premier !</p>}
        {messages.map((m) => {
          const estMoi = m.auteur.id === userId;
          return (
            <div key={m.id} className={`flex ${estMoi ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  estMoi ? "bg-orange-100 text-orange-900" : "bg-stone-100 text-stone-800"
                }`}
              >
                {!estMoi && <p className="text-xs font-semibold text-stone-500">{m.auteur.prenom} {m.auteur.nom}</p>}
                <p className="whitespace-pre-wrap">{m.contenu}</p>
                <p className="mt-1 text-right text-[10px] text-stone-400">
                  {formatDate(m.createdAt)} {formatHeure(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form action={envoyerAction} className="card flex gap-2">
        <textarea name="contenu" placeholder="Écrire un message..." className="input-large flex-1 resize-none" rows={2} required />
        <button className="btn-primary self-end">Envoyer</button>
      </form>
    </div>
  );
}
