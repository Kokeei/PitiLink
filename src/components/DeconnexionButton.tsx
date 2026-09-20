import { signOut } from "@/auth";

export function DeconnexionButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/connexion" });
      }}
    >
      <button type="submit" className="text-sm font-medium text-stone-500 hover:text-stone-800">
        Déconnexion
      </button>
    </form>
  );
}
