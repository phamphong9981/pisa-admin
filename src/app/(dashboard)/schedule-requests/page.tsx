export const runtime = 'edge';

// Next Imports
import type { Metadata } from 'next'

// Component Imports
import ScheduleRequests from '@views/schedule/schedule-requests'

export const metadata: Metadata = {
  title: 'Xin nghỉ',
  description: 'Quản lý yêu cầu xin nghỉ của học sinh'
}

const ScheduleRequestsPage = () => {
  return <ScheduleRequests />
}

export default ScheduleRequestsPage
