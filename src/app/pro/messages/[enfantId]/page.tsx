import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_PRO } from "@/lib/session";
import { obtenirFilDiscussion, marquerConversationLue } from "@/lib/messagerie";
import { FilDiscussion } from "@/components/messagerie/FilDiscussion";
import { envoyerMessagePro } from "../actions";

export default async function FilMessagesProPage({ params }: { params: Promise<{ enfantId: string }> }) {
  const { enfantId } = await params;
  const user = await requireUser(ROLES_PRO);

  const enfant = await prisma.enfant.findFirst({ where: { id: enfantId, garderieId: user.garderieId! } });
  if (!enfant) notFound();

  const conversation = await obtenirFilDiscussion(enfantId, user.id);
  if (!conversation) notFound();

  await marquerConversationLue(enfantId, user.id);

  return (
    <div className="space-y-4">
      <Link href="/pro/messages" className="text-sm text-orange-700">
        ← Toutes les conversations
      </Link>
      <h1 className="text-xl font-bold">
        💬 {conversation.enfant.prenom} {conversation.enfant.nom}
      </h1>
      <FilDiscussion messages={conversation.messages} userId={user.id} envoyerAction={envoyerMessagePro.bind(null, enfantId)} />
    </div>
  );
}
