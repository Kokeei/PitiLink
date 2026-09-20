export function ageEnMois(dateNaissance: Date): number {
  const maintenant = new Date();
  let mois =
    (maintenant.getFullYear() - dateNaissance.getFullYear()) * 12 +
    (maintenant.getMonth() - dateNaissance.getMonth());
  if (maintenant.getDate() < dateNaissance.getDate()) mois -= 1;
  return Math.max(0, mois);
}

export function calculerAge(dateNaissance: Date): string {
  const mois = ageEnMois(dateNaissance);
  const maintenant = new Date();

  if (mois < 1) {
    const jours = Math.max(
      0,
      Math.floor((maintenant.getTime() - dateNaissance.getTime()) / (1000 * 60 * 60 * 24))
    );
    return `${jours} jour${jours > 1 ? "s" : ""}`;
  }
  if (mois < 24) {
    return `${mois} mois`;
  }
  const ans = Math.floor(mois / 12);
  const moisRestants = mois % 12;
  return moisRestants > 0 ? `${ans} ans ${moisRestants} mois` : `${ans} ans`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatHeure(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateLongue(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export function debutJournee(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function finJournee(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
