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
          <SubMenu label='Kế toán' icon={<i className='ri-calculator-line' />}>
            <MenuItem href='/accounting/statistics' icon={<i className='ri-bar-chart-line' />}>Thống kê học sinh</MenuItem>
            <MenuItem href='/accounting/orders' icon={<i className='ri-bill-line' />}>Quản lý hóa đơn</MenuItem>
            <MenuItem href='/accounting/wallets' icon={<i className='ri-wallet-3-line' />}>Quản lý ví học sinh</MenuItem>
            <MenuItem href='/accounting/reports' icon={<i className='ri-file-excel-2-line' />}>Xuất báo cáo</MenuItem>
            <MenuItem href='/schedule-planner' icon={<i className='ri-calendar-event-line' />}>Xếp lịch học</MenuItem>
            <MenuItem href='/attendance' icon={<i className='ri-checkbox-circle-line' />}>Điểm danh</MenuItem>
          </SubMenu>
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
            <MenuItem href='/schedule-changes' icon={<i className='ri-file-list-3-line' />}>Biến động ca học</MenuItem>
            <MenuItem href='/attendance' icon={<i className='ri-checkbox-circle-line' />}>Điểm danh</MenuItem>
          </SubMenu>
        )}
        {canAccessUser && (
          <MenuItem href='/users' icon={<i className='ri-user-line' />}>Quản lý người dùng</MenuItem>
        )}
        {isTeacherUser && (
          <MenuItem href='/my-schedule' icon={<i className='ri-calendar-time-line' />}>Lịch dạy của tôi</MenuItem>
        )}
        {isTeacherUser && (
          <MenuItem href='/schedule-planner' icon={<i className='ri-calendar-time-line' />}>Xem lịch lớp</MenuItem>
        )}
        <MenuItem href='/schedule-history' icon={<i className='ri-history-line' />}>Lịch sử xếp lịch</MenuItem>
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
