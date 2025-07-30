export const runtime = 'edge';

// Next Imports
import type { Metadata } from 'next'

// Component Imports
import UnscheduledStudents from '@views/schedule/unschedule-students'

export const metadata: Metadata = {
  title: 'Học sinh chưa được sắp xếp lịch',
  description: 'Học sinh chưa được sắp xếp lịch'
}

const UnscheduledStudentsPage = () => {
  return <UnscheduledStudents />
}

export default UnscheduledStudentsPage 
