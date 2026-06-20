"use client";

import {
  BarChart3,
  Radio,
  Newspaper,
  Vote,
  LayoutGrid,
  CalendarRange,
  LifeBuoy,
  Landmark,
  Users,
  LayoutDashboard,
  ClipboardList,
  type LucideProps,
} from "lucide-react";

const MAP: Record<string, React.ComponentType<LucideProps>> = {
  BarChart3,
  Radio,
  Newspaper,
  Vote,
  LayoutGrid,
  CalendarRange,
  LifeBuoy,
  Landmark,
  Users,
  LayoutDashboard,
  ClipboardList,
};

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = MAP[name] ?? LayoutDashboard;
  return <Cmp {...props} />;
}
