export const runtime = 'edge';

// Next Imports
import type { Metadata } from 'next'

// Component Imports
import EditClassForm from '@views/classes/EditClassForm'

export const metadata: Metadata = {
  title: 'Chỉnh sửa lớp học',
  description: 'Cập nhật thông tin lớp học'
}

interface EditClassPageProps {
  params: {
    id: string
  }
}

const EditClassPage = ({ params }: EditClassPageProps) => {
  return <EditClassForm classId={params.id} />
}

export default EditClassPage 
