export const runtime = 'edge';

// Next Imports
import type { Metadata } from 'next'

// Component Imports
import ScheduleOverview from '@views/schedule/schedule-overview'

export const metadata: Metadata = {
  title: 'Tổng quan lịch học',
  description: 'Tổng quan lịch học'
}

const ScheduleOverviewPage = () => {
  return <ScheduleOverview />
}

export default ScheduleOverviewPage 
