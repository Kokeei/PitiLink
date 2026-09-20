import { formatDate } from "@/lib/format";

type PhotoAction = (formData: FormData) => void | Promise<void>;
type SupprimerAction = (photoId: string) => void | Promise<void>;

export function GaleriePhotos({
  photos,
  ajouterAction,
  supprimerAction,
}: {
  photos: { id: string; url: string; legende: string | null; createdAt: Date }[];
  ajouterAction?: PhotoAction;
  supprimerAction?: SupprimerAction;
}) {
  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold">📷 Quelques souvenirs</p>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl bg-stone-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.legende ?? ""} className="h-full w-full object-cover" />
              {supprimerAction && (
                <form action={supprimerAction.bind(null, p.id)} className="absolute right-1 top-1">
                  <button className="rounded-full bg-white/90 px-2 py-0.5 text-xs text-red-600 opacity-0 group-hover:opacity-100">
                    ✕
                  </button>
                </form>
              )}
              <p className="absolute inset-x-0 bottom-0 truncate bg-black/40 px-2 py-1 text-[10px] text-white">
                {p.legende || formatDate(p.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
      {photos.length === 0 && <p className="text-sm text-stone-500">Aucune photo pour le moment.</p>}

      {ajouterAction && (
        <form action={ajouterAction} className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
          <input type="file" name="photo" accept="image/*" required className="text-sm" />
          <input name="legende" placeholder="Légende (optionnel)" className="input-large flex-1 text-sm" />
          <button className="btn-secondary text-sm">+ Ajouter une photo</button>
        </form>
      )}
    </div>
  );
}
