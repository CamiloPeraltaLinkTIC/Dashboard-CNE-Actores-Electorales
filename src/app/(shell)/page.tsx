import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getServerAccess } from "@/lib/auth/access";
import { isVerticalId } from "@/lib/verticals";
import { landingPathFor } from "@/lib/auth/rbac";

export default async function ShellIndex() {
  const access = await getServerAccess();
  if (!access) redirect("/login");

  const cookieStore = await cookies();
  const vCookie = cookieStore.get("vertical")?.value;
  const preferred = isVerticalId(vCookie) ? vCookie : null;

  // Aterriza en un vertical que el usuario realmente pueda ver (no siempre CNE).
  redirect(landingPathFor(access, preferred));
}
