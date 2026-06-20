import { getContentTracking } from "@/lib/campana/seguimiento";
import { CONTENT_TRACKING_FIELDS, type ContentTrackingField } from "@/lib/campana/types";
import { PageHeader } from "@/components/campana/ui/page-header";
import { EmptyState } from "@/components/campana/ui/empty-state";
import { ContentTrackingEditor } from "@/components/campana/content-tracking-editor";
import { VerticalSync } from "@/components/layout/VerticalSync";
import { getServerAccess } from "@/lib/auth/access";
import { canEdit } from "@/lib/auth/rbac";
import { saveContentTrackingAction } from "../actions";

export default async function SeguimientoPage() {
  const [data, access] = await Promise.all([getContentTracking(), getServerAccess()]);

  // Sin campaña base: no hay a qué asociar el seguimiento.
  if (!data) return <><VerticalSync id="campana" /><EmptyState /></>;

  const initialValues = Object.fromEntries(
    CONTENT_TRACKING_FIELDS.map((f) => [f, data[f]]),
  ) as Record<ContentTrackingField, number>;

  return (
    <div className="space-y-6 pb-12">
      <VerticalSync id="campana" />
      <PageHeader
        title="Seguimiento de Contenidos"
        description="Consolidado de piezas pautadas para segunda vuelta 2026."
      />
      <ContentTrackingEditor
        campaignId={data.campaignId}
        canEdit={canEdit(access?.role)}
        initialValues={initialValues}
        action={saveContentTrackingAction}
      />
    </div>
  );
}
