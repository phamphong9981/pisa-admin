export const runtime = 'edge';

// Next Imports
import type { Metadata } from 'next'

// Component Imports
import TeacherScheduleView from '@views/teachers/TeacherScheduleView'

export const metadata: Metadata = {
  title: 'Lịch dạy của tôi',
  description: 'Xem lịch giảng dạy trong tuần'
}

const MySchedulePage = () => {
  return <TeacherScheduleView />
}

export default MySchedulePage

