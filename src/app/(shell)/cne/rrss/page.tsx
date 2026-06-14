import { VerticalSync } from "@/components/layout/VerticalSync";
import { RrssModule } from "@/components/modules/rrss/RrssModule";

export default function CneRrssPage() {
  return (
    <>
      <VerticalSync id="cne" />
      <RrssModule vertical="cne" />
    </>
  );
}
