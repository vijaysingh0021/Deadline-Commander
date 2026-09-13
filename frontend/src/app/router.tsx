import { lazy } from 'react'
import { createBrowserRouter, isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/Login'
import { SignupPage } from '@/pages/Signup'

/** Route-level code splitting — each page loads on demand. */
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.DashboardPage })))
const Missions = lazy(() => import('@/pages/Missions').then((m) => ({ default: m.MissionsPage })))
const Deadlines = lazy(() => import('@/pages/Deadlines').then((m) => ({ default: m.DeadlinesPage })))
const DeadlineDetail = lazy(() => import('@/pages/DeadlineDetail').then((m) => ({ default: m.DeadlineDetailPage })))
const Planner = lazy(() => import('@/pages/Planner').then((m) => ({ default: m.PlannerPage })))
const Character = lazy(() => import('@/pages/Character').then((m) => ({ default: m.CharacterPage })))
const Achievements = lazy(() => import('@/pages/Achievements').then((m) => ({ default: m.AchievementsPage })))
const Rewards = lazy(() => import('@/pages/Rewards').then((m) => ({ default: m.RewardsPage })))
const Analytics = lazy(() => import('@/pages/Analytics').then((m) => ({ default: m.AnalyticsPage })))
const Projects = lazy(() => import('@/pages/Projects').then((m) => ({ default: m.ProjectsPage })))
const Profile = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.ProfilePage })))
const Goals = lazy(() => import('@/pages/Goals').then((m) => ({ default: m.GoalsPage })))
const Tasks = lazy(() => import('@/pages/Tasks').then((m) => ({ default: m.TasksPage })))
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.SettingsPage })))
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFoundPage })))

/** Keeps a failed route module or loader from producing an empty application. */
function RouterErrorBoundary() {
  const error = useRouteError()
  const detail = isRouteErrorResponse(error) ? error.statusText : error instanceof Error ? error.message : 'Unexpected route error'
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-crit-500/25 bg-crit-500/[0.04] px-6 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-crit-500">Navigation interrupted</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-tx-100">Command view unavailable</h1>
      <p className="mt-2 max-w-md text-sm text-tx-500">{detail}</p>
      <Link to="/" className="mt-5 rounded-lg bg-command-500 px-4 py-2 text-sm font-semibold text-ink-950">Return to command center</Link>
    </div>
  )
}

export const router = createBrowserRouter([
  /* Standalone auth — no command shell around these. */
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },

  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouterErrorBoundary />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'missions', element: <Missions /> },
      { path: 'quests', element: <Missions /> },
      { path: 'deadlines', element: <Deadlines /> },
      { path: 'deadline/:id', element: <DeadlineDetail /> },
      { path: 'deadlines/:id', element: <DeadlineDetail /> },
      { path: 'tasks', element: <Tasks /> },
      { path: 'goals', element: <Goals /> },
      { path: 'planner', element: <Planner /> },
      { path: 'calendar', element: <Planner /> },
      { path: 'projects', element: <Projects /> },
      { path: 'character', element: <Character /> },
      { path: 'achievements', element: <Achievements /> },
      { path: 'rewards', element: <Rewards /> },
      { path: 'treasury', element: <Rewards /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'profile', element: <Profile /> },
      { path: 'settings', element: <Settings /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
