'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Tab,
  Tabs,
  Typography
} from '@mui/material'

// Components
import EditTeacherSchedule from './EditTeacherSchedule'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`edit-schedule-tabpanel-${index}`}
      aria-labelledby={`edit-schedule-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `edit-schedule-tab-${index}`,
    'aria-controls': `edit-schedule-tabpanel-${index}`,
  }
}

const EditSchedule = () => {
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <Card>
      <CardHeader
        title="Chỉnh sửa lịch"
        subheader="Quản lý và chỉnh sửa lịch của học sinh và giáo viên"
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <i className="ri-calendar-edit-line" style={{ fontSize: '24px', color: '#1976d2' }} />
          </Box>
        }
      />
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="edit schedule tabs"
            sx={{
              px: 3,
              '& .MuiTab-root': {
                minHeight: '64px',
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none'
              }
            }}
          >
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <i className="ri-user-line" style={{ fontSize: '18px' }} />
                  <span>Học sinh</span>
                </Box>
              } 
              {...a11yProps(0)} 
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <i className="ri-user-star-line" style={{ fontSize: '18px' }} />
                  <span>Giáo viên</span>
                </Box>
              } 
              {...a11yProps(1)} 
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center" 
            minHeight="400px"
            sx={{ 
              backgroundColor: '#f8f9fa', 
              borderRadius: 2, 
              border: '2px dashed #dee2e6',
              mx: 3
            }}
          >
            <i className="ri-user-line" style={{ fontSize: '64px', color: '#adb5bd', marginBottom: '16px' }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Chỉnh sửa lịch học sinh
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Tính năng này sẽ được phát triển trong phiên bản tiếp theo
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <EditTeacherSchedule />
        </TabPanel>
      </CardContent>
    </Card>
  )
}

export default EditSchedule
