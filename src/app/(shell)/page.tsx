import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function ShellIndex() {
  const cookieStore = await cookies();
  const vertical = cookieStore.get("vertical")?.value === "ae" ? "ae" : "cne";
  redirect(`/${vertical}`);
}
