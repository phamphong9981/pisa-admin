// Type Imports
import type { ChildrenType } from '@core/types'

// Component Imports
import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'

const Layout = ({ children }: ChildrenType) => {
  // Vars
  const direction = 'ltr'

  return (
    <Providers direction={direction} mode={undefined} settingsCookie={undefined}>
      <BlankLayout>{children}</BlankLayout>
    </Providers>
  )
}

export default Layout
