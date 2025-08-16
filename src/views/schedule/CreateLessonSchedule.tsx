'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Grid
} from '@mui/material'

// Hooks
import { useCreateLessonSchedule } from '@/@core/hooks/useSchedule'

interface CreateLessonScheduleProps {
  open: boolean
  onClose: () => void
  selectedSlot: {
    day: string
    time: string
    slotIndex: number
  } | null
  availableStudents: Array<{
    id: string
    fullname: string
  }>
  courseClasses: Array<{
    id: string
    name: string
    teacherId: string
    teacher: {
      id: string
      name: string
      skills: string[]
    }
  }>
  weekId?: string
}

const CreateLessonSchedule = ({
  open,
  onClose,
  selectedSlot,
  availableStudents,
  courseClasses,
  weekId = "08a60c9a-b3f8-42f8-8ff8-c7015d4ef3e7"
}: CreateLessonScheduleProps) => {
  const createLessonScheduleMutation = useCreateLessonSchedule()

  // Form states
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [lessonNumber, setLessonNumber] = useState(1)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  // Messages
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Reset form when modal opens/closes or slot changes
  useEffect(() => {
    if (open && selectedSlot) {
      setSelectedStudents([])
      setSelectedClassId('')
      setSelectedTeacherId('')
      setLessonNumber(1)
      
      // Parse time from slot
      const timeParts = selectedSlot.time.split('-')

      if (timeParts.length === 2) {
        setStartTime(timeParts[0])
        setEndTime(timeParts[1])
      }
    }
  }, [open, selectedSlot])

  // Handle form submission
  const handleSubmit = async () => {
    if (selectedStudents.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một học sinh')
      
return
    }

    if (!selectedClassId) {
      setErrorMessage('Vui lòng chọn lớp học')
      
return
    }

    if (!selectedTeacherId) {
      setErrorMessage('Vui lòng chọn giáo viên')
      
return
    }

    if (!startTime || !endTime) {
      setErrorMessage('Vui lòng nhập thời gian bắt đầu và kết thúc')
      
return
    }

    try {
      await createLessonScheduleMutation.mutateAsync({
        weekId,
        scheduleTime: selectedSlot!.slotIndex + 1, // Convert to 1-based index
        startTime,
        endTime,
        classId: selectedClassId,
        lesson: lessonNumber,
        teacherId: selectedTeacherId,
        profileIds: selectedStudents
      })

      setSuccessMessage('Tạo lịch học thành công!')
      setErrorMessage('')

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        setSuccessMessage('')
      }, 2000)

    } catch (error) {
      setErrorMessage('Có lỗi xảy ra khi tạo lịch học')
      setSuccessMessage('')
    }
  }

  // Handle student selection
  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  // Handle close
  const handleClose = () => {
    setSelectedStudents([])
    setSelectedClassId('')
    setSelectedTeacherId('')
    setLessonNumber(1)
    setStartTime('')
    setEndTime('')
    setSuccessMessage('')
    setErrorMessage('')
    onClose()
  }

  if (!selectedSlot) return null

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <i className="ri-calendar-schedule-line" style={{ fontSize: '24px', color: '#1976d2' }} />
          <Typography variant="h6" fontWeight={600}>
            Tạo lịch học mới
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Slot Information */}
          <Box sx={{ mb: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              Thông tin khung giờ
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Ngày: <strong>{selectedSlot.day}</strong>
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Giờ: <strong>{selectedSlot.time}</strong>
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Grid container spacing={3}>
            {/* Lesson Number */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Số buổi học"
                type="number"
                value={lessonNumber}
                onChange={(e) => setLessonNumber(parseInt(e.target.value) || 1)}
                inputProps={{ min: 1, max: 50 }}
                required
              />
            </Grid>

            {/* Class Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Lớp học</InputLabel>
                <Select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value)

                    // Auto-select teacher when class is selected
                    const selectedClass = courseClasses.find(cls => cls.id === e.target.value)

                    if (selectedClass) {
                      setSelectedTeacherId(selectedClass.teacherId)
                    }
                  }}
                  label="Lớp học"
                >
                  {courseClasses.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <i className="ri-book-line" style={{ color: '#1976d2' }} />
                        <span>{cls.name}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Teacher Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Giáo viên</InputLabel>
                <Select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  label="Giáo viên"
                  disabled={!selectedClassId}
                >
                  {selectedClassId && (() => {
                    const selectedClass = courseClasses.find(cls => cls.id === selectedClassId)

                    if (!selectedClass) return null
                    
                    return (
                      <MenuItem value={selectedClass.teacherId}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <i className="ri-user-star-line" style={{ color: '#1976d2' }} />
                          <span>{selectedClass.teacher.name}</span>
                          <Chip 
                            size="small" 
                            label={selectedClass.teacher.skills.join(', ')} 
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </Box>
                      </MenuItem>
                    )
                  })()}
                </Select>
              </FormControl>
            </Grid>

            {/* Start Time */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Thời gian bắt đầu"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* End Time */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Thời gian kết thúc"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Student Selection */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Chọn học sinh ({selectedStudents.length} đã chọn)
            </Typography>
            
            {availableStudents.length === 0 ? (
              <Alert severity="info">
                Không có học sinh nào rảnh trong khung giờ này
              </Alert>
            ) : (
              <Box sx={{ 
                maxHeight: '300px', 
                overflowY: 'auto', 
                border: '1px solid #eee', 
                borderRadius: 1,
                p: 2
              }}>
                <Grid container spacing={1}>
                  {availableStudents.map((student) => (
                    <Grid item xs={12} sm={6} md={4} key={student.id}>
                      <Chip
                        label={student.fullname}
                        onClick={() => handleStudentToggle(student.id)}
                        color={selectedStudents.includes(student.id) ? 'primary' : 'default'}
                        variant={selectedStudents.includes(student.id) ? 'filled' : 'outlined'}
                        sx={{ 
                          cursor: 'pointer',
                          width: '100%',
                          justifyContent: 'center'
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>

          {/* Messages */}
          {successMessage && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {successMessage}
            </Alert>
          )}
          {errorMessage && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorMessage}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            createLessonScheduleMutation.isPending || 
            selectedStudents.length === 0 || 
            !selectedTeacherId ||
            !startTime ||
            !endTime
          }
          startIcon={
            createLessonScheduleMutation.isPending ? 
              <CircularProgress size={16} /> : 
              <i className="ri-save-line" />
          }
        >
          {createLessonScheduleMutation.isPending ? 'Đang tạo...' : 'Tạo lịch học'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateLessonSchedule
