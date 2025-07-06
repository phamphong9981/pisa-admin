export const runtime = 'edge';

// Next Imports
import type { Metadata } from 'next'

// Component Imports
import ClassesList from '@views/classes/ClassesList'

export const metadata: Metadata = {
  title: 'Danh sách lớp học',
  description: 'Quản lý danh sách các lớp học tại trung tâm'
}

const ClassesPage = () => {
  return <ClassesList />
}

export default ClassesPage 
