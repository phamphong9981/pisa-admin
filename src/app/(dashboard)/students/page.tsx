export const runtime = 'edge';

// Next Imports
import type { Metadata } from 'next'

// Component Imports
import ScheduleManagement from '@views/students/ScheduleManagement'

export const metadata: Metadata = {
  title: 'Quản lý lịch học',
  description: 'Quản lý lịch học và học sinh chưa được sắp xếp lịch'
}

const StudentsPage = () => {
  return <ScheduleManagement />
}

export default StudentsPage 
