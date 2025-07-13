'use client'

import { useSearchParams } from 'next/navigation'

// Component Imports
import CreateClassForm from '@views/classes/CreateClassForm'

const CreateClassPage = () => {
  const searchParams = useSearchParams()
  const courseId = searchParams.get('course')

  return <CreateClassForm courseId={courseId || undefined} />
}

export default CreateClassPage 
