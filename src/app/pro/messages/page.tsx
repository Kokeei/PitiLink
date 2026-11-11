import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_PRO } from "@/lib/session";
import { listerConversations } from "@/lib/messagerie";
import { ListeConversations } from "@/components/messagerie/ListeConversations";

// La direction/responsable voit les canaux de tous les enfants de la
// garderie (elle est toujours participante, cf. lib/messagerie) ; une
// professionnelle ne voit que les enfants qui lui sont actuellement
// affectés, pour ne pas la noyer dans des conversations hors de son groupe.
async function enfantIdsAccessibles(userId: string, role: string, garderieId: string) {
  if (role !== "PROFESSIONNEL") {
    const enfants = await prisma.enfant.findMany({ where: { garderieId, statut: "ACTIF" }, select: { id: true } });
    return enfants.map((e) => e.id);
  }
  const affectations = await prisma.affectation.findMany({
    where: { professionnelId: userId, actif: true, enfant: { statut: "ACTIF" } },
    select: { enfantId: true },
  });
  return affectations.map((a) => a.enfantId);
}

export default async function MessagesProPage() {
  const user = await requireUser(ROLES_PRO);
  const enfantIds = await enfantIdsAccessibles(user.id, user.role, user.garderieId!);
  const conversations = await listerConversations(enfantIds, user.id);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Messages</h1>
      <ListeConversations conversations={conversations} basePath="/pro/messages" />
    </div>
  );
}
