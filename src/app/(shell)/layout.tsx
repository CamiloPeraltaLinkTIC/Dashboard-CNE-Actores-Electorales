import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { LayoutProvider } from "@/context/LayoutContext";
import { VerticalProvider } from "@/context/VerticalContext";
import { ToastProvider } from "@/context/ToastContext";
import { PresentationProvider } from "@/context/PresentationContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { isVerticalId, DEFAULT_VERTICAL } from "@/lib/verticals";
import { getServerAccess } from "@/lib/auth/access";
import { isPathAllowed } from "@/lib/auth/rbac";

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const access = await getServerAccess();
  if (!access) redirect("/login");

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "/";

  // Control de acceso por pantalla. Los overviews y la raíz siempre se permiten,
  // así que redirigir aquí no genera bucle.
  if (!isPathAllowed(access, pathname)) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const vCookie = cookieStore.get("vertical")?.value;
  const vertical = isVerticalId(vCookie) ? vCookie : DEFAULT_VERTICAL;

  return (
    <LayoutProvider
      role={access.role}
      allowedScreens={access.screens}
      userName={access.name}
      email={access.email}
    >
      <VerticalProvider initialVertical={vertical}>
        <ToastProvider>
          <PresentationProvider>
            <DashboardLayout>{children}</DashboardLayout>
          </PresentationProvider>
        </ToastProvider>
      </VerticalProvider>
    </LayoutProvider>
  );
}
