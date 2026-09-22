import { signOut, auth } from "@/auth";
import { nettoyerDelegationAvantDeconnexion } from "@/app/admin/actions";

export function DeconnexionButton() {
  return (
    <form
      action={async () => {
        "use server";
        const session = await auth();
        if (session?.user?.role === "ADMIN_PLATEFORME") {
          await nettoyerDelegationAvantDeconnexion();
        }
        await signOut({ redirectTo: "/connexion" });
      }}
    >
      <button type="submit" className="text-sm font-medium text-stone-500 hover:text-stone-800">
        Déconnexion
      </button>
    </form>
  );
}
