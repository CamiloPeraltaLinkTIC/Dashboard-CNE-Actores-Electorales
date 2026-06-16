import { redirect } from "next/navigation";
import { getServerAccess } from "@/lib/auth/access";
import { UsersAdminView } from "@/components/modules/admin/UsersAdminView";

export default async function UsuariosAdminPage() {
  const access = await getServerAccess();
  if (!access || access.role !== "superadmin") redirect("/");
  return <UsersAdminView />;
}
