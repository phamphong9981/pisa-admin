'use client'

// React Imports
import { useMemo, useState } from 'react'



// MUI Imports
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { styled } from '@mui/material/styles'

// Hooks
import { useExport } from '@/@core/hooks/useExport'
import { SCHEDULE_TIME, useGetAllSchedule } from '@/@core/hooks/useSchedule'
import { useTeacherList } from '@/@core/hooks/useTeacher'

// Components
import ScheduleDetailPopup from './ScheduleDetailPopup'


const StyledHeaderCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.875rem',
  padding: theme.spacing(1.5),
  backgroundColor: '#f5f5f5',
  color: '#424242',
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
  backgroundColor: '#fafafa',
  color: '#424242',
  border: `1px solid ${theme.palette.divider}`,
  textAlign: 'center',
  minWidth: '100px',
  position: 'sticky',
  left: 0,
  zIndex: 1
}))

const ScheduleCell = styled(TableCell, {
  shouldForwardProp: (prop) => prop !== 'isBusy' && prop !== 'isTeaching'
})<{ isBusy?: boolean; isTeaching?: boolean }>(({ theme, isBusy, isTeaching }) => ({
  padding: theme.spacing(0.5),
  border: `1px solid ${theme.palette.divider}`,
  textAlign: 'center',
  cursor: isTeaching ? 'pointer' : 'default',
  minWidth: '120px',
  minHeight: '60px',
  backgroundColor: isTeaching
    ? '#e3f2fd' // Light blue for teaching
    : isBusy
      ? '#ffebee' // Light red for busy
      : '#f1f8e9', // Light green for free
  '&:hover': {
    backgroundColor: isTeaching
      ? '#bbdefb' // Darker blue on hover
      : isBusy
        ? '#ffcdd2' // Darker red on hover
        : '#dcedc8', // Darker green on hover
  },
  transition: 'background-color 0.2s ease',
  position: 'relative'
}))

const TeachingInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5),
  '& .class-name': {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#1976d2',
    textAlign: 'center',
    lineHeight: 1.2,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  '& .lesson-info': {
    fontSize: '0.65rem',
    color: '#666',
    backgroundColor: '#fff',
    padding: '2px 6px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0'
  }
}))


const getDayInVietnamese = (englishDay: string) => {
  const dayMap: { [key: string]: string } = {
    'Monday': 'Thứ 2',
    'Tuesday': 'Thứ 3',
    'Wednesday': 'Thứ 4',
    'Thursday': 'Thứ 5',
    'Friday': 'Thứ 6',
    'Saturday': 'Thứ 7',
    'Sunday': 'Chủ nhật'
  }

  return dayMap[englishDay] || englishDay
}

const TeachersSchedule = () => {
  const { data: teachers, isLoading, error } = useTeacherList()
  const { data: schedules, isLoading: isSchedulesLoading } = useGetAllSchedule(true)
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

  // States for filtering
  const [selectedTeachers, setSelectedTeachers] = useState<any[]>([])
  const [selectedDay, setSelectedDay] = useState<string>('all')

  // States for schedule detail popup
  const [scheduleDetailPopup, setScheduleDetailPopup] = useState<{
    open: boolean
    classId: string
    lesson: number
    teacherName: string
    className: string
    scheduleTime: number
  }>({
    open: false,
    classId: '',
    lesson: 0,
    teacherName: '',
    className: '',
    scheduleTime: 0
  })

  // Generate time slots for all 7 days
  const allTimeSlots = useMemo(() => {
    const slots: { day: string; time: string; slot: number }[] = []

    SCHEDULE_TIME.forEach((timeSlot, index) => {
      const parts = timeSlot.split(' ')
      const time = parts[0] // "8:00-10:00"
      const englishDay = parts[1] // "Monday"

      slots.push({
        day: getDayInVietnamese(englishDay),
        time: time,
        slot: index
      })
    })

    return slots
  }, [])

  // Filter teachers based on selected teachers
  const filteredTeachers = useMemo(() => {
    if (!teachers) return []

    if (selectedTeachers.length === 0) return teachers

    return teachers.filter(teacher =>
      selectedTeachers.some(selected => selected.id === teacher.id)
    )
  }, [teachers, selectedTeachers])

  // Filter time slots based on selected day
  const filteredTimeSlots = useMemo(() => {
    if (selectedDay === 'all') return allTimeSlots

    return allTimeSlots.filter(slot => slot.day === selectedDay)
  }, [allTimeSlots, selectedDay])

  // Get unique days for filter dropdown
  const uniqueDays = useMemo(() => {
    const days = allTimeSlots.map(slot => slot.day)


    return ['all', ...Array.from(new Set(days))]
  }, [allTimeSlots])

  // Check if teacher is busy at specific slot
  const isTeacherBusy = (teacherSchedule: number[], slotIndex: number) => {
    return teacherSchedule.includes(slotIndex + 1)
  }

  // Check if teacher is teaching at specific slot
  const isTeacherTeaching = (teacherId: string, slotIndex: number) => {
    if (!schedules) return false

    return schedules.some(schedule =>
      schedule.teacher_id === teacherId && schedule.schedule_time === slotIndex + 1
    )
  }

  // Get teaching info for a teacher at specific slot
  const getTeachingInfo = (teacherId: string, slotIndex: number) => {
    if (!schedules) return null

    return schedules.find(schedule =>
      schedule.teacher_id === teacherId && schedule.schedule_time === slotIndex + 1
    )
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

  // Handle click on teaching cell
  const handleTeachingCellClick = (classId: string, lesson: number, teacherName: string, className: string, scheduleTime: number) => {
    setScheduleDetailPopup({
      open: true,
      classId,
      lesson,
      teacherName,
      className,
      scheduleTime
    })
  }

  // Handle close schedule detail popup
  const handleCloseScheduleDetailPopup = () => {
    setScheduleDetailPopup(prev => ({ ...prev, open: false }))
  }

  if (isLoading || isSchedulesLoading) {
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
      {/* Lịch rảnh giáo viên */}
      <Card>
        <CardHeader
          title="Lịch rảnh giáo viên"
          subheader="Quản lý lịch rảnh của tất cả giáo viên theo từng khung giờ trong tuần"
          action={
            <Box display="flex" gap={1} alignItems="center">
              <Chip
                size="small"
                label="Rảnh"
                sx={{
                  backgroundColor: '#f1f8e9',
                  color: '#2e7d32',
                  border: '1px solid #c8e6c9'
                }}
              />
              <Chip
                size="small"
                label="Bận"
                sx={{
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  border: '1px solid #ffcdd2'
                }}
              />
              <Chip
                size="small"
                label="Đang dạy"
                sx={{
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  border: '1px solid #bbdefb'
                }}
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
          {/* Filter Section */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Autocomplete
                  multiple
                  options={teachers || []}
                  getOptionLabel={(option) => option.name}
                  value={selectedTeachers}
                  onChange={(event, newValue) => {
                    setSelectedTeachers(newValue)
                  }}
                  filterOptions={(options, { inputValue }) => {
                    return options.filter(option =>
                      option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
                      option.skills.some((skill: string) =>
                        skill.toLowerCase().includes(inputValue.toLowerCase())
                      )
                    )
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Chọn giáo viên để lọc..."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <i className="ri-search-line" style={{ color: '#666', marginRight: 8 }} />
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                          '&:hover fieldset': {
                            borderColor: '#1976d2',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#1976d2',
                          },
                        }
                      }}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option.id}
                        label={option.name}
                        size="small"
                        sx={{
                          backgroundColor: '#e3f2fd',
                          color: '#1976d2',
                          border: '1px solid #bbdefb'
                        }}
                      />
                    ))
                  }
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.skills?.length || 0} kỹ năng: {option.skills?.join(', ') || 'Không có'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  noOptionsText="Không tìm thấy giáo viên"
                  clearOnBlur={false}
                  selectOnFocus
                  handleHomeEndKeys
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Lọc theo ngày</InputLabel>
                  <Select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    label="Lọc theo ngày"
                  >
                    {uniqueDays.map((day) => (
                      <MenuItem key={day} value={day}>
                        {day === 'all' ? 'Tất cả các ngày' : day}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Selected Teachers Display */}
            {selectedTeachers.length > 0 && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <i className="ri-filter-line" style={{ marginRight: 8 }} />
                  Giáo viên đã chọn ({selectedTeachers.length}):
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {selectedTeachers.map((teacher) => (
                    <Chip
                      key={teacher.id}
                      label={teacher.name}
                      size="small"
                      onDelete={() => {
                        setSelectedTeachers(prev => prev.filter(t => t.id !== teacher.id))
                      }}
                      sx={{
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        border: '1px solid #bbdefb'
                      }}
                    />
                  ))}
                  <Chip
                    label="Xóa tất cả"
                    size="small"
                    variant="outlined"
                    onClick={() => setSelectedTeachers([])}
                    sx={{
                      color: '#d32f2f',
                      borderColor: '#d32f2f',
                      '&:hover': {
                        backgroundColor: '#ffebee'
                      }
                    }}
                  />
                </Box>
              </Box>
            )}

            {/* Filter Summary */}
            {selectedDay !== 'all' && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
                <Typography variant="body2" color="text.secondary">
                  <i className="ri-filter-line" style={{ marginRight: 8 }} />
                  Đang lọc:
                  <Chip
                    label={`Ngày: ${selectedDay}`}
                    size="small"
                    sx={{ ml: 1 }}
                    onDelete={() => setSelectedDay('all')}
                  />
                </Typography>
              </Box>
            )}
          </Box>

          <TableContainer sx={{
            maxHeight: '70vh',
            overflow: 'auto',
            border: '1px solid #e0e0e0',
            borderRadius: '8px'
          }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <StyledHeaderCell sx={{ minWidth: '150px' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Khung giờ
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {selectedDay === 'all' ? 'Theo tuần' : selectedDay}
                      </Typography>
                    </Box>
                  </StyledHeaderCell>
                  {filteredTeachers.map((teacher) => (
                    <StyledHeaderCell key={teacher.id}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {teacher.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {teacher.skills?.length || 0} kỹ năng
                        </Typography>
                      </Box>
                    </StyledHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTimeSlots.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={filteredTeachers.length + 1} align="center" sx={{ py: 4 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                        <i className="ri-calendar-line" style={{ fontSize: '48px', color: '#ccc' }} />
                        <Typography variant="h6" color="text.secondary">
                          Không có dữ liệu phù hợp
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Thử thay đổi bộ lọc để xem kết quả khác
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTimeSlots.map((slot, index) => (
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
                      {filteredTeachers.map((teacher) => {
                        const isBusy = isTeacherBusy(teacher.registeredBusySchedule, slot.slot)
                        const isTeaching = isTeacherTeaching(teacher.id, slot.slot)
                        const teachingInfo = getTeachingInfo(teacher.id, slot.slot)

                        return (
                          <ScheduleCell
                            key={`${teacher.id}-${slot.slot}`}
                            isBusy={isBusy}
                            isTeaching={isTeaching}
                            onClick={isTeaching && teachingInfo ? () => handleTeachingCellClick(
                              teachingInfo.class_id,
                              teachingInfo.lesson,
                              teacher.name,
                              teachingInfo.class_name,
                              teachingInfo.schedule_time
                            ) : undefined}
                          >
                            {isTeaching && teachingInfo ? (
                              <TeachingInfo>
                                <Box className="class-name" title={teachingInfo.class_name}>
                                  {teachingInfo.class_name}
                                </Box>
                                <Box className="lesson-info">
                                  Buổi {teachingInfo.lesson}
                                </Box>
                              </TeachingInfo>
                            ) : (
                              <Tooltip
                                title={
                                  isBusy
                                    ? `${teacher.name} bận vào ${slot.day} ${slot.time}`
                                    : `${teacher.name} rảnh vào ${slot.day} ${slot.time}`
                                }
                              >
                                <IconButton size="small">
                                  {isBusy ? (
                                    <i className="ri-close-line" style={{ color: '#c62828', fontSize: '18px' }} />
                                  ) : (
                                    <i className="ri-check-line" style={{ color: '#2e7d32', fontSize: '18px' }} />
                                  )}
                                </IconButton>
                              </Tooltip>
                            )}
                          </ScheduleCell>
                        )
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Summary */}
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Thống kê {filteredTeachers.length !== teachers?.length && `(${filteredTeachers.length}/${teachers?.length} giáo viên)`}
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              {filteredTeachers.map((teacher) => {
                const busySlots = teacher.registeredBusySchedule.length
                const teachingSlots = schedules?.filter(s => s.teacher_id === teacher.id).length || 0
                const totalSlots = SCHEDULE_TIME.length
                const freeSlots = totalSlots - busySlots - teachingSlots

                return (
                  <Card key={teacher.id} variant="outlined" sx={{ minWidth: 200 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {teacher.name}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="body2" sx={{ color: '#2e7d32' }}>
                          Rảnh: {freeSlots}/{totalSlots}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#c62828' }}>
                          Bận: {busySlots}/{totalSlots}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mt={0.5}>
                        <Typography variant="body2" sx={{ color: '#1976d2' }}>
                          Đang dạy: {teachingSlots}/{totalSlots}
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

      {/* Schedule Detail Popup */}
      <ScheduleDetailPopup
        open={scheduleDetailPopup.open}
        onClose={handleCloseScheduleDetailPopup}
        classId={scheduleDetailPopup.classId}
        lesson={scheduleDetailPopup.lesson}
        teacherName={scheduleDetailPopup.teacherName}
        className={scheduleDetailPopup.className}
        scheduleTime={scheduleDetailPopup.scheduleTime}
      />
    </>
  )
}

export default TeachersSchedule 
