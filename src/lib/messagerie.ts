import { prisma } from "@/lib/prisma";
import { creerNotifications } from "@/lib/notifications";

/**
 * Participants attendus du canal d'échange d'un enfant : ses parents, la
 * direction/responsable(s) de la garderie, et les professionnels qui lui
 * sont actuellement affectés. Recalculé à chaque accès pour suivre les
 * changements d'affectation sans action manuelle.
 */
async function participantsAttendus(enfantId: string, garderieId: string) {
  const [parents, direction, affectations] = await Promise.all([
    prisma.parentEnfant.findMany({ where: { enfantId }, select: { userId: true } }),
    prisma.user.findMany({
      where: { garderieId, role: { in: ["DIRECTION", "RESPONSABLE"] } },
      select: { id: true },
    }),
    prisma.affectation.findMany({ where: { enfantId, actif: true }, select: { professionnelId: true } }),
  ]);

  return new Set([
    ...parents.map((p) => p.userId),
    ...direction.map((d) => d.id),
    ...affectations.map((a) => a.professionnelId),
  ]);
}

/**
 * Retrouve (ou crée) le canal unique de l'enfant et synchronise ses
 * participants sur l'ensemble attendu — ajoute les nouveaux (ex. tatie
 * venant d'être affectée), retire ceux qui n'ont plus leur place (ex.
 * réaffectation). N'est jamais appelé avec un enfant hors du périmètre de
 * l'appelant : la vérification d'accès est faite par le code appelant.
 */
export async function obtenirConversationEnfant(enfantId: string) {
  const enfant = await prisma.enfant.findUniqueOrThrow({
    where: { id: enfantId },
    select: { garderieId: true },
  });

  const conversation = await prisma.conversation.upsert({
    where: { enfantId },
    create: { enfantId, garderieId: enfant.garderieId },
    update: {},
    include: { participants: true },
  });

  const attendus = await participantsAttendus(enfantId, enfant.garderieId);
  const actuels = new Set(conversation.participants.map((p) => p.userId));

  const aAjouter = [...attendus].filter((userId) => !actuels.has(userId));
  const aRetirer = conversation.participants.filter((p) => !attendus.has(p.userId));

  await Promise.all([
    aAjouter.length > 0
      ? prisma.conversationParticipant.createMany({
          data: aAjouter.map((userId) => ({ conversationId: conversation.id, userId })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
    aRetirer.length > 0
      ? prisma.conversationParticipant.deleteMany({ where: { id: { in: aRetirer.map((p) => p.id) } } })
      : Promise.resolve(),
  ]);

  return conversation.id;
}

/**
 * Liste les enfants (parmi ceux passés en paramètre, déjà filtrés par
 * l'appelant selon le rôle) avec leur conversation — crée celle-ci à la
 * volée si elle n'existe pas encore, pour que la liste des canaux soit
 * toujours complète dès le premier affichage. `nonLu` indique si un
 * message est arrivé depuis la dernière lecture de `userId`.
 */
export async function listerConversations(enfantIds: string[], userId: string) {
  if (enfantIds.length === 0) return [];

  await Promise.all(enfantIds.map((id) => obtenirConversationEnfant(id)));

  const conversations = await prisma.conversation.findMany({
    where: { enfantId: { in: enfantIds } },
    include: {
      enfant: { select: { id: true, prenom: true, nom: true, photoUrl: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, include: { auteur: { select: { prenom: true, nom: true } } } },
      participants: { where: { userId }, select: { dernierLuLe: true } },
    },
  });

  const avecNonLu = conversations.map((c) => {
    const dernierMessage = c.messages[0];
    const dernierLuLe = c.participants[0]?.dernierLuLe ?? null;
    return { ...c, nonLu: !!dernierMessage && (!dernierLuLe || dernierMessage.createdAt > dernierLuLe) };
  });

  // Les plus récemment actives en premier (dernier message, ou date de
  // création du canal s'il n'y a encore aucun message).
  return avecNonLu.sort((a, b) => {
    const dateA = a.messages[0]?.createdAt ?? a.createdAt;
    const dateB = b.messages[0]?.createdAt ?? b.createdAt;
    return dateB.getTime() - dateA.getTime();
  });
}

export async function marquerConversationLue(enfantId: string, userId: string) {
  const conversationId = await obtenirConversationEnfant(enfantId);
  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId },
    data: { dernierLuLe: new Date() },
  });
}

/**
 * Fil de discussion complet d'un enfant pour l'affichage du canal. Ne
 * renvoie rien si `userId` n'est pas (ou plus) participant — l'appelant
 * doit malgré tout vérifier en amont que l'enfant est dans son périmètre
 * (même garderie / lien parent / affectation), cette fonction ne fait que
 * refléter l'état réel des participants du canal.
 */
export async function obtenirFilDiscussion(enfantId: string, userId: string) {
  const conversationId = await obtenirConversationEnfant(enfantId);

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) return null;

  return prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      enfant: { select: { id: true, prenom: true, nom: true, photoUrl: true } },
      messages: { orderBy: { createdAt: "asc" }, include: { auteur: { select: { id: true, prenom: true, nom: true, role: true } } } },
    },
  });
}

export async function envoyerMessage(enfantId: string, auteurId: string, contenu: string) {
  const texte = contenu.trim();
  if (!texte) return null;

  const conversationId = await obtenirConversationEnfant(enfantId);
  const message = await prisma.message.create({
    data: { conversationId, auteurId, contenu: texte },
    include: { auteur: { select: { prenom: true, nom: true, role: true } } },
  });

  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: auteurId },
    data: { dernierLuLe: message.createdAt },
  });

  const [destinataires, enfant] = await Promise.all([
    prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: auteurId } },
      include: { user: { select: { id: true, role: true } } },
    }),
    prisma.enfant.findUniqueOrThrow({ where: { id: enfantId }, select: { prenom: true, nom: true } }),
  ]);

  const contenuNotif = `${message.auteur.prenom} : nouveau message au sujet de ${enfant.prenom} ${enfant.nom}`;
  const parParente = (role: string) => destinataires.filter((d) => d.user.role === role).map((d) => d.user.id);

  await Promise.all([
    creerNotifications(parParente("PARENT"), { type: "MESSAGE", contenu: contenuNotif, lien: `/parent/messages/${enfantId}` }),
    creerNotifications(parParente("PROFESSIONNEL"), { type: "MESSAGE", contenu: contenuNotif, lien: `/pro/messages/${enfantId}` }),
    creerNotifications(
      [...parParente("DIRECTION"), ...parParente("RESPONSABLE")],
      { type: "MESSAGE", contenu: contenuNotif, lien: `/direction/messages/${enfantId}` }
    ),
  ]);

  return message;
}
