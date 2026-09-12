import {
  LayoutDashboard,
  Swords,
  CalendarClock,
  Target,
  FolderKanban,
  ListChecks,
  Crosshair,
  User,
  Trophy,
  Coins,
  BarChart3,
  Settings,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  group: 'command' | 'progression' | 'insights' | 'settings'
  exact?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, group: 'command', exact: true },
  { to: '/missions', label: 'Missions', icon: Swords, group: 'command' },
  { to: '/deadlines', label: 'Deadlines', icon: CalendarClock, group: 'command' },
  { to: '/tasks', label: 'Tasks', icon: ListChecks, group: 'command' },
  { to: '/goals', label: 'Goals', icon: Crosshair, group: 'command' },
  { to: '/planner', label: 'Planner', icon: Target, group: 'command' },
  { to: '/projects', label: 'Projects', icon: FolderKanban, group: 'command' },
  { to: '/character', label: 'Character', icon: User, group: 'progression' },
  { to: '/achievements', label: 'Achievements', icon: Trophy, group: 'progression' },
  { to: '/rewards', label: 'Rewards', icon: Coins, group: 'progression' },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, group: 'insights' },
  { to: '/settings', label: 'Settings', icon: Settings, group: 'settings' },
  { to: '/profile', label: 'Profile', icon: UserRound, group: 'settings' },
]

export const GROUP_LABELS: Record<NavItem['group'], string> = {
  command: 'COMMANDER',
  progression: 'PROGRESSION',
  insights: 'INSIGHTS',
  settings: 'SYSTEM',
}

/** Mobile bottom-nav subset. "More" opens a sheet with the remainder. */
export const MOBILE_PRIMARY: NavItem[] = ['/', '/missions', '/deadlines', '/planner'].map((to) => NAV_ITEMS.find((n) => n.to === to)!)

export const MOBILE_SECONDARY: NavItem[] = [
  '/character',
  '/achievements',
  '/rewards',
  '/analytics',
  '/projects',
  '/tasks',
  '/goals',
  '/settings',
  '/profile',
].map((to) => NAV_ITEMS.find((n) => n.to === to)!)