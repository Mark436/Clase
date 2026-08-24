import type { BottomNavigationItem } from "@/components/layout/BottomNavigation";
import { CalendarIcon, ClipboardListIcon, UserIcon } from "@/components/ui/icons";

export type TabId = "schedule" | "grades" | "student";

export const NAV_ITEMS: ReadonlyArray<BottomNavigationItem<TabId>> = [
  { id: "schedule", label: "Horario", icon: <CalendarIcon size={22} /> },
  { id: "grades", label: "Calificaciones", icon: <ClipboardListIcon size={22} /> },
  { id: "student", label: "Alumno", icon: <UserIcon size={22} /> },
];

// Single home-selection point (architecture invariant): once grades exist,
// Grades becomes Home; until then Schedule is. The real hasGrades() check
// arrives with the grades feature and must only be wired here.
export function getHomeTab(hasGrades = false): TabId {
  return hasGrades ? "grades" : "schedule";
}
