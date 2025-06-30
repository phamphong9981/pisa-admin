// Next Imports
import type { Metadata } from 'next'

// Component Imports
import ClassDetail from '@views/classes/ClassDetail'

export const metadata: Metadata = {
  title: 'Chi tiết lớp học',
  description: 'Thông tin chi tiết về lớp học và danh sách học sinh'
}

interface ClassDetailPageProps {
  params: {
    id: string
  }
}

const ClassDetailPage = ({ params }: ClassDetailPageProps) => {
  return <ClassDetail classId={params.id} />
}

export default ClassDetailPage 
