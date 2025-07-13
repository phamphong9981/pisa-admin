export const runtime = 'edge';

// Next Imports
import type { Metadata } from 'next'

// Component Imports
import CoursesList from '@views/courses/CoursesList'

export const metadata: Metadata = {
  title: 'Quản lý khóa học',
  description: 'Quản lý danh sách các khóa học tại trung tâm'
}

const CoursesPage = () => {
  return <CoursesList />
}

export default CoursesPage 
