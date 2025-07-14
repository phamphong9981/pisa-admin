// Next Imports
import type { Metadata } from 'next'

// Component Imports
import UnscheduledStudents from '@views/students/UnscheduledStudents'

export const metadata: Metadata = {
  title: 'Quản lý học sinh',
  description: 'Quản lý học sinh có tiết học chưa được sắp xếp lịch'
}

const StudentsPage = () => {
  return <UnscheduledStudents />
}

export default StudentsPage 
