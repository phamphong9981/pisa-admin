'use client'
// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import { Menu, MenuItem, SubMenu } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import useAuth from '@/@core/hooks/useAuth'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }: { scrollMenu: (container: any, isPerfectScrollbar: boolean) => void }) => {
  // Hooks
  const theme = useTheme()
  const { isBreakpointReached, transitionDuration } = useVerticalNav()
  const { hasPermission, isTeacher } = useAuth()

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  const canAccessClasses = hasPermission('class')
  const canAccessAccounting = hasPermission('accounting')
  const canAccessSchedule = hasPermission('schedule')
  const canAccessTeacher = hasPermission('teacher')
  const canAccessUser = hasPermission('user')
  const isTeacherUser = isTeacher()

  return (
    // eslint-disable-next-line lines-around-comment
    /* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
          className: 'bs-full overflow-y-auto overflow-x-hidden',
          onScroll: container => scrollMenu(container, false)
        }
        : {
          options: { wheelPropagation: false, suppressScrollX: true },
          onScrollY: container => scrollMenu(container, true)
        })}
    >
      {/* Incase you also want to scroll NavHeader to scroll with Vertical Menu, remove NavHeader from above and paste it below this comment */}
      {/* Vertical Menu */}
      <Menu
        menuItemStyles={menuItemStyles(theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-line' /> }}
        menuSectionStyles={menuSectionStyles(theme)}
      >
        {/* <MenuItem href='/' icon={<i className='ri-dashboard-line' />}>Analytics</MenuItem> */}
        {canAccessClasses && (
          <MenuItem href='/courses' icon={<i className='ri-book-open-line' />}>Quản lý lớp học</MenuItem>
        )}
        {canAccessAccounting && (
          <MenuItem href='/accounting' icon={<i className='ri-calculator-line' />}>Kế toán</MenuItem>
        )}
        {canAccessSchedule && (
          <SubMenu label='Quản lý lịch học' icon={<i className='ri-calendar-schedule-line' />}>
            <MenuItem href='/edit-schedule' icon={<i className='ri-calendar-edit-line' />}>Lịch rảnh/bận</MenuItem>
            <MenuItem href='/schedule-planner' icon={<i className='ri-calendar-event-line' />}>Xếp lịch học</MenuItem>
            <MenuItem href='/schedule-requests' icon={<i className='ri-user-forbid-line' />}>Yêu cầu đổi lịch</MenuItem>
            <MenuItem href='/unscheduled-students' icon={<i className='ri-user-forbid-line' />}>Danh sách học sinh đang thiếu</MenuItem>
          </SubMenu>
        )}
        {canAccessTeacher && (
          <SubMenu label='Quản lý giáo viên' icon={<i className='ri-user-star-line' />}>
            <MenuItem href='/teachers-info' icon={<i className='ri-user-settings-line' />}>Thông tin giáo viên</MenuItem>
            <MenuItem href='/teachers-schedule' icon={<i className='ri-calendar-time-line' />}>PISA TEACHER</MenuItem>
          </SubMenu>
        )}
        {canAccessUser && (
          <MenuItem href='/users' icon={<i className='ri-user-line' />}>Quản lý người dùng</MenuItem>
        )}
        {isTeacherUser && (
          <MenuItem href='/my-schedule' icon={<i className='ri-calendar-time-line' />}>Lịch dạy của tôi</MenuItem>
        )}
        {/* <MenuSection label='Apps & Pages'>
          <MenuItem href='/account-settings' icon={<i className='ri-user-settings-line' />}>
            Account Settings
          </MenuItem>
          <SubMenu label='Auth Pages' icon={<i className='ri-shield-keyhole-line' />}>
            <MenuItem href='/login' target='_blank'>
              Login
            </MenuItem>
            <MenuItem href='/register' target='_blank'>
              Register
            </MenuItem>
            <MenuItem href='/forgot-password' target='_blank'>
              Forgot Password
            </MenuItem>
          </SubMenu>
          <SubMenu label='Miscellaneous' icon={<i className='ri-question-line' />}>
            <MenuItem href='/error' target='_blank'>
              Error
            </MenuItem>
            <MenuItem href='/under-maintenance' target='_blank'>
              Under Maintenance
            </MenuItem>
          </SubMenu>
          <MenuItem href='/card-basic' icon={<i className='ri-bar-chart-box-line' />}>
            Cards
          </MenuItem>
        </MenuSection>
        <MenuSection label='Forms & Tables'>
          <MenuItem href='/form-layouts' icon={<i className='ri-layout-4-line' />}>
            Form Layouts
          </MenuItem>
          <MenuItem href='/react-table' icon={<i className='ri-table-alt-line' />}>
            React Table
          </MenuItem>
          <MenuItem href='/form-elements' icon={<i className='ri-radio-button-line' />}>
            Form Elements
          </MenuItem>
          <MenuItem href='/mui-table' icon={<i className='ri-table-2' />}>
            MUI Tables
          </MenuItem>
        </MenuSection>
        <MenuSection label='Misc'>
          <MenuItem
            href={`${process.env.NEXT_PUBLIC_DOCS_URL}/docs/user-interface/foundation`}
            icon={<i className='ri-pantone-line' />}
            suffix={<i className='ri-external-link-line text-xl' />}
            target='_blank'
          >
            Foundation
          </MenuItem>
          <MenuItem
            href={`${process.env.NEXT_PUBLIC_DOCS_URL}/docs/user-interface/components`}
            icon={<i className='ri-toggle-line' />}
            suffix={<i className='ri-external-link-line text-xl' />}
            target='_blank'
          >
            Components
          </MenuItem>
          <MenuItem
            href={`${process.env.NEXT_PUBLIC_DOCS_URL}/docs/menu-examples/overview`}
            icon={<i className='ri-menu-search-line' />}
            suffix={<i className='ri-external-link-line text-xl' />}
            target='_blank'
          >
            Menu Examples
          </MenuItem>
          <MenuItem
            href={`https://github.com/themeselection/${process.env.NEXT_PUBLIC_REPO_NAME}/issues`}
            icon={<i className='ri-lifebuoy-line' />}
            suffix={<i className='ri-external-link-line text-xl' />}
            target='_blank'
          >
            Raise Support
          </MenuItem>
          <MenuItem
            href={process.env.NEXT_PUBLIC_DOCS_URL}
            icon={<i className='ri-book-line' />}
            suffix={<i className='ri-external-link-line text-xl' />}
            target='_blank'
          >
            Documentation
          </MenuItem>
          <SubMenu label='Others' icon={<i className='ri-more-line' />}>
            <MenuItem suffix={<Chip label='New' size='small' color='info' />}>Item With Badge</MenuItem>
            <MenuItem
              href='https://themeselection.com'
              target='_blank'
              suffix={<i className='ri-external-link-line text-xl' />}
            >
              External Link
            </MenuItem>
            <SubMenu label='Menu Levels'>
              <MenuItem>Menu Level 2</MenuItem>
              <SubMenu label='Menu Level 2'>
                <MenuItem>Menu Level 3</MenuItem>
                <MenuItem>Menu Level 3</MenuItem>
              </SubMenu>
            </SubMenu>
            <MenuItem disabled>Disabled Menu</MenuItem>
          </SubMenu>
        </MenuSection> */}
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
