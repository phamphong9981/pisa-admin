export const runtime = 'edge';

// Next Imports
import type { Metadata } from 'next'

// Component Imports
import ScheduleChanges from '@views/teachers/ScheduleChanges'

export const metadata: Metadata = {
  title: 'Biến động ca học',
  description: 'Danh sách các buổi học có ghi chú từ giáo viên'
}

const ScheduleChangesPage = () => {
  return <ScheduleChanges />
}

export default ScheduleChangesPage

