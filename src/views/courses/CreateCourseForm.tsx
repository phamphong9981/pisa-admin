'use client'

import { useState } from 'react'

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
  Autocomplete,
  InputAdornment
} from '@mui/material'

import { CourseType, useCreateCourse, RegionId, RegionLabel } from '@/@core/hooks/useCourse'
import { useTeacherList } from '@/@core/hooks/useTeacher'

interface CreateCourseFormProps {
  onSuccess?: () => void
}

const CreateCourseForm = ({ onSuccess }: CreateCourseFormProps) => {
  const createCourseMutation = useCreateCourse()

  // Load all teachers once, no search term needed
  const { data: teachers, isLoading: isTeachersLoading, error: teachersError } = useTeacherList()

  const [formData, setFormData] = useState({
    name: '',
    type: CourseType.FOUNDATION,
    teacher_id: '',
    region: RegionId.HALONG // Default to HALONG
  })

  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'type' ? value as CourseType : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createCourseMutation.mutateAsync(formData)
      setSnackbarMessage('Tạo khóa học thành công!')
      setSnackbarSeverity('success')
      setOpenSnackbar(true)

      // Reset form
      setFormData({
        name: '',
        type: CourseType.FOUNDATION,
        teacher_id: '',
        region: RegionId.HALONG
      })

      // Call onSuccess callback
      onSuccess?.()

    } catch (error) {
      setSnackbarMessage('Có lỗi xảy ra khi tạo khóa học!')
      setSnackbarSeverity('error')
      setOpenSnackbar(true)
    }
  }

  const getCourseTypeLabel = (courseType: CourseType) => {
    switch (courseType) {
      case CourseType.FOUNDATION: return 'Foundation - Cơ bản'
      case CourseType.INTERMEDIATE: return 'Intermediate - Trung cấp'
      case CourseType.ADVANCED: return 'Advanced - Nâng cao'
      case CourseType.IELTS: return 'IELTS'
      case CourseType.TOEFL: return 'TOEFL'
      case CourseType.TOEIC: return 'TOEIC'
      default: return courseType
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
      <Typography variant="h6" gutterBottom>Tạo khóa học mới</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Điền thông tin để tạo khóa học mới
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
              label="Tên khóa học"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              placeholder="Nhập tên khóa học"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Loại khóa học</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                label="Loại khóa học"
              >
                {Object.values(CourseType).map((type) => (
                  <MenuItem key={type} value={type}>
                    {getCourseTypeLabel(type)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Khu vực</InputLabel>
              <Select
                value={formData.region}
                onChange={(e) => handleChange('region', Number(e.target.value))}
                label="Khu vực"
              >
                {(Object.keys(RegionLabel) as Array<keyof typeof RegionLabel>).map((key) => {
                  const id = Number(key) as RegionId
                  return (
                    <MenuItem key={id} value={id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <i className="ri-map-pin-line" />
                        <span>{RegionLabel[id]}</span>
                      </Box>
                    </MenuItem>
                  )
                })}
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
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                type="submit"
                variant="contained"
                disabled={createCourseMutation.isPending}
                startIcon={createCourseMutation.isPending ? <i className="ri-loader-line animate-spin" /> : <i className="ri-save-line" />}
              >
                {createCourseMutation.isPending ? 'Đang tạo...' : 'Tạo khóa học'}
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

export default CreateCourseForm 
