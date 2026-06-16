import { Card, CardBody, CardHeader } from "@/components/campana/ui/card";
import { PageHeader } from "@/components/campana/ui/page-header";
import { ImportForm } from "./import-form";
import { VerticalSync } from "@/components/layout/VerticalSync";

export default function ImportarPage() {
  return (
    <div className="space-y-6 pb-12">
      <VerticalSync id="campana" />
      <PageHeader
        title="Importar Excel"
        description="Carga masiva del plan de pauta. Sube tu archivo .xlsx con el formato del template."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Subir plan de pauta"
              subtitle="El archivo reemplaza los datos de la campaña actual (la inversión real registrada se conserva)."
            />
            <CardBody>
              <ImportForm />
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Formato esperado" />
          <CardBody className="space-y-4 text-sm text-[var(--text-dim)]">
            <p>El Excel debe contener estas hojas:</p>
            <ul className="space-y-2">
              <li className="flex gap-2"><Dot /><span><b>Resumen Ejecutivo</b> — presupuesto, duración, % / CPM / CTR por canal.</span></li>
              <li className="flex gap-2"><Dot /><span><b>Distribución x Canal</b> — objetivo, público y KPI por canal.</span></li>
              <li className="flex gap-2"><Dot /><span><b>Desglose Diario</b> — fecha de inicio y factor de peso por día.</span></li>
              <li className="flex gap-2"><Dot /><span><b>Proyecciones</b> — frecuencia estimada por canal.</span></li>
            </ul>
            <div className="rounded-lg bg-amber-500/10 px-3 py-2.5 text-xs text-amber-400">
              Las métricas se <b>calculan</b> en el dashboard a partir de estos parámetros.
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Dot() {
  return <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />;
}
