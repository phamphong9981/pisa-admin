// Type Imports
import type { ChildrenType } from '@core/types'

// Component Imports
import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'

// Util Imports
import { getMode, getSettingsFromCookie } from '@core/utils/serverHelpers'


const Layout = ({ children }: ChildrenType) => {
  // Vars
  const direction = 'ltr'
  const mode = getMode()
  const settingsCookie = getSettingsFromCookie()

  return (
    <Providers direction={direction} mode={mode} settingsCookie={settingsCookie}>
      <BlankLayout>{children}</BlankLayout>
    </Providers>
  )
}

export default Layout
