'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'

import {
  Grid,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Chip,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  Autocomplete,
  InputAdornment
} from '@mui/material'

import { ClassType } from '@/types/classes'
import type { CreateClassDto } from '@/@core/hooks/useClass';
import { useCreateClass } from '@/@core/hooks/useClass'
import { useTeacherList } from '@/@core/hooks/useTeacher'
import { SCHEDULE_TIME } from '@/@core/hooks/useSchedule'

interface CreateClassFormProps {
  courseId?: string
  onSuccess?: () => void
}

const CreateClassForm = ({ courseId, onSuccess }: CreateClassFormProps) => {
  const createClassMutation = useCreateClass(courseId || '')

  // Load all teachers once, no search term needed
  const { data: teachers, isLoading: isTeachersLoading, error: teachersError } = useTeacherList()

  const [formData, setFormData] = useState<CreateClassDto>({
    name: '',
    total_lesson_per_week: 1,
    class_type: ClassType.FT_LISTENING,
    teacher_id: '',
    course_id: courseId || '',
    auto_schedule: true,
    fixedSchedule: []
  })

  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')

  const handleChange = (field: keyof CreateClassDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFixedScheduleChange = (scheduleTime: number | null) => {
    setFormData(prev => ({
      ...prev,
      fixedSchedule: scheduleTime ? [scheduleTime] : []
    }))
  }

  // Memoize selected teacher to prevent unnecessary re-renders
  const selectedTeacher = useMemo(() => {
    return teachers?.find(teacher => teacher.id === formData.teacher_id) || null
  }, [teachers, formData.teacher_id])

  // Memoize callbacks to prevent re-renders
  const handleTeacherChange = useCallback((event: any, newValue: any) => {
    handleChange('teacher_id', newValue?.id || '')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createClassMutation.mutateAsync(formData)
      setSnackbarMessage('Tạo lớp học thành công!')
      setSnackbarSeverity('success')
      setOpenSnackbar(true)

      // Reset form
      setFormData({
        name: '',
        total_lesson_per_week: 1,
        class_type: ClassType.FT_LISTENING,
        teacher_id: '',
        course_id: courseId || '',
        auto_schedule: true,
        fixedSchedule: []
      })

      // Call onSuccess callback
      onSuccess?.()

    } catch (error) {
      setSnackbarMessage('Có lỗi xảy ra khi tạo lớp học!')
      setSnackbarSeverity('error')
      setOpenSnackbar(true)
    }
  }

  const getClassTypeLabel = (classType: ClassType) => {
    switch (classType) {
      case ClassType.FT_LISTENING: return 'FastTrack - Nghe'
      case ClassType.FT_WRITING: return 'FastTrack - Viết'
      case ClassType.FT_READING: return 'FastTrack - Đọc'
      case ClassType.FT_SPEAKING: return 'FastTrack - Nói'
      case ClassType.LISTENING: return 'Nghe'
      case ClassType.WRITING: return 'Viết'
      case ClassType.READING: return 'Đọc'
      case ClassType.SPEAKING: return 'Nói'
      default: return classType
    }
  }

  if (isTeachersLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Đang tải danh sách giáo viên...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Tạo lớp học mới</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Điền thông tin để tạo lớp học mới
      </Typography>

      {teachersError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Không thể tải danh sách giáo viên. Vui lòng thử lại sau.
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tên lớp học"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              placeholder="Nhập tên lớp học"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Số buổi học/tuần"
              type="number"
              value={formData.total_lesson_per_week}
              onChange={(e) => handleChange('total_lesson_per_week', parseInt(e.target.value))}
              required
              inputProps={{ min: 1, max: 7 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Trình độ lớp học</InputLabel>
              <Select
                value={formData.class_type}
                onChange={(e) => handleChange('class_type', e.target.value as ClassType)}
                label="Trình độ lớp học"
              >
                {Object.values(ClassType).map((type) => (
                  <MenuItem key={type} value={type}>
                    {getClassTypeLabel(type)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              options={teachers || []}
              getOptionLabel={(option) => option.name}
              value={selectedTeacher}
              onChange={handleTeacherChange}
              filterOptions={(options, { inputValue }) => {
                return options.filter(option =>
                  option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
                  option.skills.some((skill: string) =>
                    skill.toLowerCase().includes(inputValue.toLowerCase())
                  )
                )
              }}
              loading={isTeachersLoading}
              disabled={!!teachersError}
              freeSolo={false}
              clearOnBlur={false}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Giáo viên"
                  required
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <i className="ri-search-line" style={{ color: '#666' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {isTeachersLoading ? <i className="ri-loader-line animate-spin" /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  placeholder="Tìm kiếm theo tên giáo viên..."
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box display="flex" flexDirection="column" alignItems="flex-start" width="100%">
                    <Typography variant="body2" fontWeight={500}>
                      {option.name}
                    </Typography>
                    {option.skills.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        Kỹ năng: {option.skills.join(', ')}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
              noOptionsText={
                teachersError ? 'Lỗi tải danh sách giáo viên' :
                  'Không tìm thấy giáo viên nào'
              }
              clearOnEscape
              selectOnFocus
              handleHomeEndKeys
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.auto_schedule}
                    onChange={(e) => handleChange('auto_schedule', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      Tự động xếp lịch
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Hệ thống sẽ tự động sắp xếp lịch học cho lớp này dựa trên lịch trống của giáo viên và học sinh
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Lịch học cố định (tùy chọn)
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Chọn 1 khung giờ cố định cho lớp học này. Để trống nếu không có lịch cố định.
              </Typography>
              <RadioGroup
                value={formData.fixedSchedule && formData.fixedSchedule.length > 0 ? formData.fixedSchedule[0] : ''}
                onChange={(e) => handleFixedScheduleChange(e.target.value ? Number(e.target.value) : null)}
              >
                <Grid container spacing={1}>
                  {SCHEDULE_TIME.map((time, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                      <FormControlLabel
                        value={index + 1}
                        control={<Radio size="small" />}
                        label={
                          <Box display="flex" alignItems="center" gap={1}>
                            <i className="ri-time-line" style={{ fontSize: '14px' }} />
                            <Typography variant="body2">{time}</Typography>
                          </Box>
                        }
                        sx={{
                          margin: 0,
                          '& .MuiFormControlLabel-label': {
                            fontSize: '0.875rem',
                            fontWeight: 500
                          }
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </RadioGroup>
              {(formData.fixedSchedule && formData.fixedSchedule.length > 0) && (
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Đã chọn lịch cố định:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    <Chip
                      label={SCHEDULE_TIME[formData.fixedSchedule[0] - 1]}
                      size="small"
                      color="primary"
                      variant="outlined"
                      onDelete={() => handleFixedScheduleChange(null)}
                      icon={<i className="ri-time-line" />}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                type="submit"
                variant="contained"
                disabled={createClassMutation.isPending}
                startIcon={createClassMutation.isPending ? <i className="ri-loader-line animate-spin" /> : <i className="ri-save-line" />}
              >
                {createClassMutation.isPending ? 'Đang tạo...' : 'Tạo lớp học'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default CreateClassForm 
