export const runtime = 'edge';

// Next Imports
import type { Metadata } from 'next'

// Component Imports
import EditSchedule from '@/views/schedule/EditTeacherSchedule/EditSchedule'

export const metadata: Metadata = {
  title: 'Chỉnh sửa lịch',
  description: 'Quản lý và chỉnh sửa lịch của học sinh và giáo viên'
}

const EditSchedulePage = () => {
  return <EditSchedule />
}

export default EditSchedulePage
