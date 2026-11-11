import { requireUser, ROLES_PARENT } from "@/lib/session";
import { getEnfantsDuParent } from "@/lib/data";
import { listerConversations } from "@/lib/messagerie";
import { ListeConversations } from "@/components/messagerie/ListeConversations";

export default async function MessagesParentPage() {
  const user = await requireUser(ROLES_PARENT);
  const enfants = await getEnfantsDuParent(user.id);
  const conversations = await listerConversations(enfants.map((e) => e.id), user.id);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Messages</h1>
      <ListeConversations conversations={conversations} basePath="/parent/messages" />
    </div>
  );
}
