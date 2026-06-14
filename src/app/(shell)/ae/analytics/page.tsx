import { VerticalSync } from "@/components/layout/VerticalSync";
import { AnalyticsDashboardView } from "@/components/modules/analytics/AnalyticsDashboardView";

export default function AeAnalyticsPage() {
  return (
    <>
      <VerticalSync id="ae" />
      <AnalyticsDashboardView />
    </>
  );
}
