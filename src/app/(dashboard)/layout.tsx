// Type Imports
import type { ChildrenType } from '@core/types'

// Layout Imports
import LayoutWrapper from '@layouts/LayoutWrapper'
import VerticalLayout from '@layouts/VerticalLayout'

// Component Imports
import Providers from '@components/Providers'
import Navigation from '@components/layout/vertical/Navigation'
import Navbar from '@components/layout/vertical/Navbar'
import VerticalFooter from '@components/layout/vertical/Footer'
import ProtectedRoute from '@components/ProtectedRoute'
import { getMode, getSettingsFromCookie } from '@core/utils/serverHelpers'

const Layout = async ({ children }: ChildrenType) => {
  // Vars
  const direction = 'ltr'
  const mode = getMode()
  const settingsCookie = getSettingsFromCookie()

  return (
    <Providers direction={direction} mode={mode} settingsCookie={settingsCookie}>
      <ProtectedRoute requireAdmin={false} allowTeacher={true}>
        <LayoutWrapper
          verticalLayout={
            <VerticalLayout navigation={<Navigation />} navbar={<Navbar />} footer={<VerticalFooter />}>
              {children}
            </VerticalLayout>
          }
        />
      </ProtectedRoute>
    </Providers>
  )
}

export default Layout
