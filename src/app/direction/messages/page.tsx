import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { listerConversations } from "@/lib/messagerie";
import { ListeConversations } from "@/components/messagerie/ListeConversations";

export default async function MessagesDirectionPage() {
  const user = await requireUser(ROLES_DIRECTION);
  const enfants = await prisma.enfant.findMany({
    where: { garderieId: user.garderieId!, statut: "ACTIF" },
    select: { id: true },
  });
  const conversations = await listerConversations(enfants.map((e) => e.id), user.id);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Messages</h1>
      <ListeConversations conversations={conversations} basePath="/direction/messages" />
    </div>
  );
}
