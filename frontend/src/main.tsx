import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'
import { router } from '@/app/router'
import { queryClient } from '@/app/queryClient'
import { ToastViewport } from '@/components/ui/Toast'
import { initAppearance } from '@/services/settings'
import '@/styles/theme.css'

// Restore persisted appearance (glow / motion / density) before first paint.
initAppearance()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <RouterProvider router={router} />
        <ToastViewport />
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
)