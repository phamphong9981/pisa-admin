export const runtime = 'edge';

// Next Imports
import type { Metadata } from 'next'

// Component Imports
import ScheduleRequests from '@views/schedule/schedule-requests'

export const metadata: Metadata = {
  title: 'Yêu cầu đổi lịch',
  description: 'Quản lý yêu cầu đổi lịch của học sinh'
}

const ScheduleRequestsPage = () => {
  return <ScheduleRequests />
}

export default ScheduleRequestsPage
