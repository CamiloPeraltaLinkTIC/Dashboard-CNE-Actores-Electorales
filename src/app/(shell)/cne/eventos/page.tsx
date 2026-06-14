import { VerticalSync } from "@/components/layout/VerticalSync";
import { EventosModule } from "@/components/modules/eventos/EventosModule";

export default function CneEventosPage() {
  return (
    <>
      <VerticalSync id="cne" />
      <EventosModule />
    </>
  );
}
