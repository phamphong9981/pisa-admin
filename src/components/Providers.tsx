"use client"; // Provider phải là một Client Component
// Type Imports
import { useState } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import type { ChildrenType, Direction } from '@core/types'

// Context Imports
import { VerticalNavProvider } from '@menu/contexts/verticalNavContext'
import { SettingsProvider } from '@core/contexts/settingsContext'
import ThemeProvider from '@components/theme'

// Component Imports
import UpgradeToProButton from '@components/upgrade-to-pro-button'

// Util Imports

type Props = ChildrenType & {
  direction: Direction
  mode: any
  settingsCookie: any
}

const Providers = (props: Props) => {
  // Props
  const { children, direction, mode, settingsCookie } = props
  const [queryClient] = useState(() => new QueryClient());

  return (
    <VerticalNavProvider>
      <SettingsProvider settingsCookie={settingsCookie} mode={mode}>
        <ThemeProvider direction={direction}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
          <UpgradeToProButton />
        </ThemeProvider>
      </SettingsProvider>
    </VerticalNavProvider>
  )
}

export default Providers
