import { VerticalSync } from "@/components/layout/VerticalSync";
import { ParrillasModule } from "@/components/modules/parrilla/ParrillasModule";

export default function CneParrillaPage() {
  return (
    <>
      <VerticalSync id="cne" />
      <ParrillasModule vertical="cne" />
    </>
  );
}
