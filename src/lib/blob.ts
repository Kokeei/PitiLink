import { put } from "@vercel/blob";

/**
 * Upload un fichier vers Vercel Blob et retourne son URL publique.
 * Retourne null si aucun fichier valide n'a été fourni (input laissé vide).
 *
 * Nécessite le store Vercel Blob connecté au projet (variable
 * BLOB_READ_WRITE_TOKEN) — voir README pour la configuration.
 */
export async function uploaderFichier(fichier: File | null, dossier: string): Promise<string | null> {
  if (!fichier || fichier.size === 0) return null;

  const extension = fichier.name.split(".").pop() || "jpg";
  const nomFichier = `${dossier}/${crypto.randomUUID()}.${extension}`;

  try {
    const blob = await put(nomFichier, fichier, {
      access: "public",
      addRandomSuffix: false,
    });
    return blob.url;
  } catch (erreur) {
    // Le store Vercel Blob n'est pas encore configuré (BLOB_READ_WRITE_TOKEN
    // absent) : on dégrade silencieusement plutôt que de faire planter la
    // page — voir README pour l'activer.
    console.error("Upload Vercel Blob impossible :", erreur);
    return null;
  }
}
