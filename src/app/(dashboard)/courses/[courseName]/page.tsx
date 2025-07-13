export const runtime = 'edge';

// Next Imports
import type { Metadata } from 'next'

// Component Imports
import CourseDetail from '@views/courses/CourseDetail'

interface CourseDetailPageProps {
  params: {
    courseName: string
  }
}

export const metadata: Metadata = {
  title: 'Chi tiết khóa học',
  description: 'Xem chi tiết thông tin khóa học và các lớp học'
}

const CourseDetailPage = ({ params }: CourseDetailPageProps) => {
  const decodedCourseName = decodeURIComponent(params.courseName)
  
  return <CourseDetail courseName={decodedCourseName} />
}

export default CourseDetailPage 
