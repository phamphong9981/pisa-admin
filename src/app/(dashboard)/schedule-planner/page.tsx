export const runtime = 'edge';

// Next Imports
import type { Metadata } from 'next'

// Component Imports
import SchedulePlanner from '@views/schedule/schedule-planner'

export const metadata: Metadata = {
  title: 'Xếp lịch học',
  description: 'Xếp lịch học theo khóa học'
}

const SchedulePlannerPage = () => {
  return <SchedulePlanner />
}

export default SchedulePlannerPage 


