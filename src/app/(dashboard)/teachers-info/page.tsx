export const runtime = 'edge';

// Next Imports
import type { Metadata } from 'next'

// Component Imports
import TeacherInfo from '@views/teachers/TeacherInfo'

export const metadata: Metadata = {
  title: 'Thông tin giáo viên',
  description: 'Quản lý thông tin giáo viên'
}

const TeacherInfoPage = () => {
  return <TeacherInfo />
}

export default TeacherInfoPage 
