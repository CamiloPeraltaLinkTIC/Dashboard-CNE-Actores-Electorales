import { VerticalSync } from "@/components/layout/VerticalSync";
import { RrssModule } from "@/components/modules/rrss/RrssModule";

export default function AeRrssPage() {
  return (
    <>
      <VerticalSync id="ae" />
      <RrssModule vertical="ae" />
    </>
  );
}
