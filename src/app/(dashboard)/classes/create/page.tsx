// Next Imports
import type { Metadata } from 'next'

// Component Imports
import CreateClassForm from '@views/classes/CreateClassForm'

export const metadata: Metadata = {
  title: 'Tạo lớp học mới',
  description: 'Tạo lớp học mới tại trung tâm'
}

const CreateClassPage = () => {
  return <CreateClassForm />
}

export default CreateClassPage 
