export const runtime = 'edge';

// Next Imports
import type { Metadata } from 'next'

// Component Imports
import ScheduleHistory from '@views/schedule/schedule-history'

export const metadata: Metadata = {
  title: 'Lịch sử xếp lịch',
  description: 'Xem lịch sử thay đổi của các buổi học'
}

const ScheduleHistoryPage = () => {
  return <ScheduleHistory />
}

export default ScheduleHistoryPage

