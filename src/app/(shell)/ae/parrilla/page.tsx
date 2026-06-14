import { VerticalSync } from "@/components/layout/VerticalSync";
import { ParrillasModule } from "@/components/modules/parrilla/ParrillasModule";

export default function AeParrillaPage() {
  return (
    <>
      <VerticalSync id="ae" />
      <ParrillasModule vertical="ae" />
    </>
  );
}
