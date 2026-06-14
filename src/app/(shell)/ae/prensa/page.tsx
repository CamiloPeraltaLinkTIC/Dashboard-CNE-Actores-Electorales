import { VerticalSync } from "@/components/layout/VerticalSync";
import { PrensaDashboardView } from "@/components/modules/prensa/PrensaDashboardView";

export default function AePrensaPage() {
  return (
    <>
      <VerticalSync id="ae" />
      <PrensaDashboardView />
    </>
  );
}
