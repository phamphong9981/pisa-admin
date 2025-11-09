'use client'

import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import {
  Card,
  CardHeader,
  CardContent,
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
  Skeleton,
  Chip,
  FormControlLabel,
  Radio,
  RadioGroup,
  Autocomplete,
  InputAdornment
} from '@mui/material'
import { styled } from '@mui/material/styles'

import { ClassType } from '@/types/classes'
import type { UpdateClassDto } from '@/@core/hooks/useClass';
import { useClass, useUpdateClass } from '@/@core/hooks/useClass'
import { useTeacherList } from '@/@core/hooks/useTeacher'
import { SCHEDULE_TIME } from '@/@core/hooks/useSchedule'

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3)
}))

interface EditClassFormProps {
  classId: string
}

const EditClassForm = ({ classId }: EditClassFormProps) => {
  const router = useRouter()
  const { data: classData, isLoading: isClassLoading, error: classError } = useClass(classId)

  // Load all teachers once, no search term needed
  const { data: teachers, isLoading: isTeachersLoading, error: teachersError } = useTeacherList()
  const updateClassMutation = useUpdateClass()

  const [formData, setFormData] = useState<UpdateClassDto>({
    name: '',
    total_lesson_per_week: 1,
    class_type: ClassType.FT_LISTENING,
    teacher_id: '',
    fixedSchedule: []
  })

  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')

  // Load dữ liệu class vào form khi có data
  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name,
        total_lesson_per_week: classData.totalLessonPerWeek,
        class_type: classData.classType as ClassType,
        teacher_id: classData.teacherId || '',
        fixedSchedule: classData.fixedSchedule || []
      })
    }
  }, [classData])

  const handleChange = (field: keyof UpdateClassDto, value: any) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateClassMutation.mutateAsync({ id: classId, classInfo: formData })
      setSnackbarMessage('Cập nhật lớp học thành công!')
      setSnackbarSeverity('success')
      setOpenSnackbar(true)

      // Redirect sau 2 giây
      setTimeout(() => {
        router.push(`/classes/${classId}`)
      }, 2000)

    } catch (error) {
      setSnackbarMessage('Có lỗi xảy ra khi cập nhật lớp học!')
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
      case ClassType.OTHER: return 'Khác'
      default: return classType
    }
  }

  if (isClassLoading || isTeachersLoading) {
    return (
      <Box>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Skeleton variant="text" width={200} height={40} />
            <Skeleton variant="text" width={300} height={20} />
          </Box>
          <Skeleton variant="rectangular" width={120} height={40} />
        </Box>
        <StyledCard>
          <CardHeader title={<Skeleton variant="text" width={150} />} />
          <CardContent>
            <Grid container spacing={3}>
              {[1, 2, 3, 4].map((i) => (
                <Grid item xs={12} md={6} key={i}>
                  <Skeleton variant="rectangular" height={56} />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </StyledCard>
      </Box>
    )
  }

  if (classError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Alert severity="error">
          Không thể tải thông tin lớp học: {classError.message}
        </Alert>
      </Box>
    )
  }

  if (!classData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Alert severity="info">
          Không tìm thấy lớp học với ID: {classId}
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>Chỉnh sửa lớp học</Typography>
          <Typography variant="body2" color="text.secondary">
            Cập nhật thông tin lớp học: {classData.name}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<i className="ri-arrow-left-line" />}
          onClick={() => router.push(`/classes/${classId}`)}
        >
          Quay lại
        </Button>
      </Box>

      <StyledCard>
        <CardHeader title="Thông tin lớp học" />
        <CardContent>
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
                  value={teachers?.find(teacher => teacher.id === formData.teacher_id) || null}
                  onChange={(event, newValue) => {
                    handleChange('teacher_id', newValue?.id || '')
                  }}
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
                    variant="outlined"
                    onClick={() => router.push(`/classes/${classId}`)}
                    disabled={updateClassMutation.isPending}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={updateClassMutation.isPending}
                    startIcon={updateClassMutation.isPending ? <i className="ri-loader-line animate-spin" /> : <i className="ri-save-line" />}
                  >
                    {updateClassMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật lớp học'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </StyledCard>

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

export default EditClassForm 
