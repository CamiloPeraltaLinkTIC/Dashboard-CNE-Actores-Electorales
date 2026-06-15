import { cookies, headers } from "next/headers";
import { LayoutProvider } from "@/context/LayoutContext";
import { VerticalProvider } from "@/context/VerticalContext";
import { ToastProvider } from "@/context/ToastContext";
import { PresentationProvider } from "@/context/PresentationContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { isVerticalId, DEFAULT_VERTICAL } from "@/lib/verticals";

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const headersList = await headers();

  const role = headersList.get("x-user-role") ?? "viewer";
  const vCookie = cookieStore.get("vertical")?.value;
  const vertical = isVerticalId(vCookie) ? vCookie : DEFAULT_VERTICAL;

  return (
    <LayoutProvider initialRole={role}>
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
