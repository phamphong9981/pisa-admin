export const runtime = 'edge';

// Next Imports
import type { Metadata } from 'next'

// Component Imports
import TeachersSchedule from '@views/teachers/TeachersSchedule'

export const metadata: Metadata = {
  title: 'Lịch rảnh giáo viên',
  description: 'Quản lý lịch rảnh của tất cả giáo viên theo từng khung giờ'
}

const TeachersSchedulePage = () => {
  return <TeachersSchedule />
}

export default TeachersSchedulePage 
