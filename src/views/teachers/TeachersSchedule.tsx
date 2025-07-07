'use client'

// React Imports
import { useMemo, useState } from 'react'

// MUI Imports
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
  IconButton,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  Alert,
  Snackbar
} from '@mui/material'
import { styled } from '@mui/material/styles'

// Hooks
import { useTeacherList } from '@/@core/hooks/useTeacher'
import useExport from '@/@core/hooks/useExport'

// Styled Components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 500,
  fontSize: '0.875rem',
  padding: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
  textAlign: 'center',
  minWidth: '120px'
}))

const StyledHeaderCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.875rem',
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.grey[100],
  border: `1px solid ${theme.palette.divider}`,
  textAlign: 'center',
  position: 'sticky',
  top: 0,
  zIndex: 1
}))

const StyledTimeCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.75rem',
  padding: theme.spacing(1),
  backgroundColor: theme.palette.grey[50],
  border: `1px solid ${theme.palette.divider}`,
  textAlign: 'center',
  minWidth: '100px',
  position: 'sticky',
  left: 0,
  zIndex: 1
}))

const ScheduleCell = styled(TableCell, {
  shouldForwardProp: (prop) => prop !== 'isBusy'
})<{ isBusy?: boolean }>(({ theme, isBusy }) => ({
  padding: theme.spacing(0.5),
  border: `1px solid ${theme.palette.divider}`,
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: isBusy ? theme.palette.error.light : theme.palette.success.light,
  '&:hover': {
    backgroundColor: isBusy ? theme.palette.error.main : theme.palette.success.main,
  },
  transition: 'background-color 0.2s ease'
}))

// Constants
const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
const TIME_SLOTS = [
  '8:00-10:00',
  '10:00-12:00', 
  '13:00-15:00',
  '15:00-17:00',
  '18:00-20:00',
  '20:00-22:00'
]

const TeachersSchedule = () => {
  const theme = useTheme()
  const { data: teachers, isLoading, error } = useTeacherList()
  const { exportToExcel, exportToCSV, exportSummary } = useExport()
  
  // States for export menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [notification, setNotification] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Generate time slots for all 7 days
  const allTimeSlots = useMemo(() => {
    const slots: { day: string; time: string; slot: number }[] = []
    let slotIndex = 0
    
    DAYS.forEach((day) => {
      TIME_SLOTS.forEach((time) => {
        slots.push({
          day,
          time,
          slot: slotIndex
        })
        slotIndex++
      })
    })
    
    return slots
  }, [])

  // Check if teacher is busy at specific slot
  const isTeacherBusy = (teacherSchedule: number[], slotIndex: number) => {
    return teacherSchedule.includes(slotIndex)
  }

  // Handle export menu
  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleExportClose = () => {
    setAnchorEl(null)
  }

  // Export handlers
  const handleExportExcel = () => {
    if (!teachers) return
    
    const result = exportToExcel(teachers)
    setNotification({
      open: true,
      message: result.message,
      severity: result.success ? 'success' : 'error'
    })
    handleExportClose()
  }

  const handleExportCSV = () => {
    if (!teachers) return
    
    const result = exportToCSV(teachers)
    setNotification({
      open: true,
      message: result.message,
      severity: result.success ? 'success' : 'error'
    })
    handleExportClose()
  }

  const handleExportSummary = () => {
    if (!teachers) return
    
    const result = exportSummary(teachers)
    setNotification({
      open: true,
      message: result.message,
      severity: result.success ? 'success' : 'error'
    })
    handleExportClose()
  }

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }))
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Đang tải dữ liệu giáo viên...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          Lỗi khi tải dữ liệu: {error.message}
        </Typography>
      </Box>
    )
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Lịch rảnh giáo viên"
          subheader="Quản lý lịch rảnh của tất cả giáo viên theo từng khung giờ trong tuần"
          action={
            <Box display="flex" gap={1} alignItems="center">
              <Chip 
                size="small" 
                label="Rảnh" 
                sx={{ backgroundColor: theme.palette.success.light }}
              />
              <Chip 
                size="small" 
                label="Bận" 
                sx={{ backgroundColor: theme.palette.error.light }}
              />
              
              {/* Export Button */}
              <Button
                variant="contained"
                startIcon={<i className="ri-download-line" />}
                onClick={handleExportClick}
                disabled={!teachers || teachers.length === 0}
              >
                Xuất file
              </Button>
              
              {/* Export Menu */}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleExportClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={handleExportExcel}>
                  <i className="ri-file-excel-line" style={{ marginRight: 8 }} />
                  Xuất Excel (.xlsx)
                </MenuItem>
                <MenuItem onClick={handleExportCSV}>
                  <i className="ri-file-text-line" style={{ marginRight: 8 }} />
                  Xuất CSV (.csv)
                </MenuItem>
                <MenuItem onClick={handleExportSummary}>
                  <i className="ri-bar-chart-line" style={{ marginRight: 8 }} />
                  Xuất thống kê
                </MenuItem>
              </Menu>
            </Box>
          }
        />
        <CardContent>
          <TableContainer sx={{ maxHeight: '70vh', overflow: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <StyledHeaderCell sx={{ minWidth: '150px' }}>
                    Khung giờ
                  </StyledHeaderCell>
                  {teachers?.map((teacher) => (
                    <StyledHeaderCell key={teacher.id}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {teacher.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {teacher.skills.length} kỹ năng
                        </Typography>
                      </Box>
                    </StyledHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {allTimeSlots.map((slot, index) => (
                  <TableRow key={index}>
                    <StyledTimeCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {slot.day}
                        </Typography>
                        <Typography variant="caption" color="primary">
                          {slot.time}
                        </Typography>
                      </Box>
                    </StyledTimeCell>
                    {teachers?.map((teacher) => (
                      <ScheduleCell
                        key={`${teacher.id}-${slot.slot}`}
                        isBusy={isTeacherBusy(teacher.registeredBusySchedule, slot.slot)}
                      >
                        <Tooltip 
                          title={
                            isTeacherBusy(teacher.registeredBusySchedule, slot.slot) 
                              ? `${teacher.name} bận vào ${slot.day} ${slot.time}`
                              : `${teacher.name} rảnh vào ${slot.day} ${slot.time}`
                          }
                        >
                          <IconButton size="small">
                            {isTeacherBusy(teacher.registeredBusySchedule, slot.slot) ? (
                              <i className="ri-close-line" style={{ color: theme.palette.error.main }} />
                            ) : (
                              <i className="ri-check-line" style={{ color: theme.palette.success.main }} />
                            )}
                          </IconButton>
                        </Tooltip>
                      </ScheduleCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Summary */}
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Thống kê
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              {teachers?.map((teacher) => {
                const busySlots = teacher.registeredBusySchedule.length
                const freeSlots = 42 - busySlots
                
                return (
                  <Card key={teacher.id} variant="outlined" sx={{ minWidth: 200 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {teacher.name}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="body2" color="success.main">
                          Rảnh: {freeSlots}/42
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          Bận: {busySlots}/42
                        </Typography>
                      </Box>
                      <Box display="flex" gap={0.5} mt={1}>
                        {teacher.skills.map((skill, index) => (
                          <Chip 
                            key={index}
                            label={skill} 
                            size="small" 
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                )
              })}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Export Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default TeachersSchedule 
