'use client'

// React Imports
import { useState, useMemo } from 'react'

// MUI Imports
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
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
import { Alert } from '@mui/material'

// Component Imports
import { Icon } from '@iconify/react'

// Hooks
import { useDeleteTeacherAccount, useTeacherList, useUpdateTeacher, UpdateTeacherDto } from '@/@core/hooks/useTeacher'
import { Skills } from '@/@core/hooks/skills.constant'
import { useClassList } from '@/@core/hooks/useClass'

// Icon Imports

const TeachersInfoPage = () => {
  const deleteTeacherMutation = useDeleteTeacherAccount()
  const updateTeacherMutation = useUpdateTeacher()
  const { data: teachers, isLoading: isLoadingTeachers, error: teachersError } = useTeacherList()
  const { data: classes, isLoading: isLoadingClasses } = useClassList()
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [teacherToEdit, setTeacherToEdit] = useState<{ id: string; name: string; skills: string[] } | null>(null)
  const [teacherToDelete, setTeacherToDelete] = useState<{ id: string; name: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [editTeacherForm, setEditTeacherForm] = useState<UpdateTeacherDto>({
    name: '',
    skills: []
  })
  const [selectedEditSkills, setSelectedEditSkills] = useState<string[]>([])
  const [notification, setNotification] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Get skills options from enum
  const skillsOptions = Object.values(Skills)

  // Get classes for each teacher
  const getTeacherClasses = (teacherId: string) => {
    if (!classes) return []
    return classes.filter(cls => cls.teacherId === teacherId)
  }

  // Filter teachers based on search term
  const filteredTeachers = useMemo(() => {
    if (!teachers || !classes) return []

    if (!searchTerm.trim()) return teachers

    const searchLower = searchTerm.toLowerCase()

    return teachers.filter(teacher => {
      const teacherMatch =
        teacher.name?.toLowerCase().includes(searchLower) ||
        teacher.skills?.some(skill => skill.toLowerCase().includes(searchLower))

      const teacherClasses = getTeacherClasses(teacher.id)
      const classMatch = teacherClasses.some(cls =>
        cls.name?.toLowerCase().includes(searchLower)
      )

      return teacherMatch || classMatch
    })
  }, [teachers, classes, searchTerm])

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }))
  }

  // Edit teacher handlers
  const handleOpenEditDialog = (teacherId: string, teacherName: string, teacherSkills: string[]) => {
    setTeacherToEdit({ id: teacherId, name: teacherName, skills: teacherSkills })
    setEditTeacherForm({
      name: teacherName,
      skills: teacherSkills
    })
    setSelectedEditSkills(teacherSkills)
    setOpenEditDialog(true)
  }

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false)
    setTeacherToEdit(null)
    setEditTeacherForm({
      name: '',
      skills: []
    })
    setSelectedEditSkills([])
  }

  const handleEditTeacherFormChange = (field: keyof UpdateTeacherDto, value: string | string[]) => {
    setEditTeacherForm(prev => ({ ...prev, [field]: value }))
  }

  const handleEditSkillsChange = (skills: string[]) => {
    setSelectedEditSkills(skills)
    setEditTeacherForm(prev => ({ ...prev, skills }))
  }

  const handleUpdateTeacher = async () => {
    if (!teacherToEdit) return

    try {
      await updateTeacherMutation.mutateAsync({
        teacherId: teacherToEdit.id,
        teacher: editTeacherForm
      })
      setNotification({
        open: true,
        message: `Cập nhật thông tin giáo viên "${editTeacherForm.name}" thành công!`,
        severity: 'success'
      })
      handleCloseEditDialog()
    } catch (error) {
      setNotification({
        open: true,
        message: 'Có lỗi xảy ra khi cập nhật thông tin giáo viên',
        severity: 'error'
      })
    }
  }

  // Delete teacher handlers
  const handleOpenDeleteDialog = (teacherId: string, teacherName: string) => {
    setTeacherToDelete({ id: teacherId, name: teacherName })
    setOpenDeleteDialog(true)
  }

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false)
    setTeacherToDelete(null)
  }

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return

    try {
      await deleteTeacherMutation.mutateAsync(teacherToDelete.id)
      setNotification({
        open: true,
        message: `Xóa giáo viên "${teacherToDelete.name}" thành công!`,
        severity: 'success'
      })
      handleCloseDeleteDialog()
    } catch (error) {
      setNotification({
        open: true,
        message: 'Có lỗi xảy ra khi xóa giáo viên',
        severity: 'error'
      })
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 6 }}>
        <Typography variant='h4' sx={{ mb: 2 }}>
          Thông tin giáo viên
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Quản lý thông tin chi tiết và danh sách lớp phụ trách của giáo viên
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Button
              variant='outlined'
              startIcon={<Icon icon='ri:download-line' />}
            >
              Xuất báo cáo
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Teachers Table */}
      <Card>
        <CardContent>
          {/* Search Box */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm theo tên giáo viên, chuyên môn hoặc tên lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon icon='ri:search-line' />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchTerm('')}
                      edge="end"
                    >
                      <Icon icon='ri:close-line' />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>

          {/* Table */}
          {isLoadingTeachers || isLoadingClasses ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Typography>Đang tải dữ liệu...</Typography>
            </Box>
          ) : teachersError ? (
            <Box>
              <Typography variant="h6" color="error">
                Lỗi khi tải dữ liệu: {teachersError.message}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Tên giáo viên</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Kỹ năng</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Danh sách lớp phân công</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTeachers.length > 0 ? (
                    filteredTeachers.map((teacher) => {
                      const teacherClasses = getTeacherClasses(teacher.id)

                      return (
                        <TableRow key={teacher.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {teacher.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {teacher.skills && teacher.skills.length > 0 ? (
                                teacher.skills.map((skill, index) => (
                                  <Chip
                                    key={index}
                                    label={skill}
                                    size="small"
                                    sx={{
                                      backgroundColor: '#e3f2fd',
                                      color: '#1976d2',
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                ))
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  Không có kỹ năng
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {teacherClasses.length > 0 ? (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {teacherClasses.map((cls) => (
                                  <Chip
                                    key={cls.id}
                                    label={cls.name}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                ))}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Chưa có lớp nào được phân công
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <Tooltip title="Chỉnh sửa giáo viên">
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => handleOpenEditDialog(teacher.id, teacher.name, teacher.skills || [])}
                                  sx={{
                                    '&:hover': {
                                      backgroundColor: '#e3f2fd'
                                    }
                                  }}
                                >
                                  <Icon icon='ri:edit-line' />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Xóa giáo viên">
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => handleOpenDeleteDialog(teacher.id, teacher.name)}
                                  sx={{
                                    '&:hover': {
                                      backgroundColor: '#ffebee'
                                    }
                                  }}
                                >
                                  <Icon icon='ri:delete-bin-line' />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                        <Box textAlign="center">
                          <Icon icon='ri:search-line' style={{ fontSize: '48px', color: '#999', marginBottom: '16px' }} />
                          <Typography variant="h6" color="text.secondary" mb={1}>
                            Không tìm thấy giáo viên
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {searchTerm
                              ? `Không tìm thấy giáo viên hoặc lớp nào phù hợp với từ khóa "${searchTerm}"`
                              : 'Chưa có giáo viên nào'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Edit Teacher Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth='md' fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Icon icon='ri:edit-line' style={{ marginRight: '8px' }} />
            Chỉnh sửa thông tin giáo viên
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Tên hiển thị'
                placeholder='Nhập tên hiển thị'
                value={editTeacherForm.name}
                onChange={(e) => handleEditTeacherFormChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={skillsOptions}
                value={selectedEditSkills}
                onChange={(event, newValue) => handleEditSkillsChange(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Chuyên môn"
                    placeholder="Chọn các kỹ năng chuyên môn..."
                    helperText="Chọn các kỹ năng mà giáo viên có thể giảng dạy"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option}
                      label={option}
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
                    <Typography variant="body2">
                      {option}
                    </Typography>
                  </Box>
                )}
                noOptionsText="Không có kỹ năng nào"
                clearOnBlur={false}
                selectOnFocus
                handleHomeEndKeys
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} color='secondary'>
            Hủy
          </Button>
          <Button
            variant='contained'
            onClick={handleUpdateTeacher}
            disabled={updateTeacherMutation.isPending}
          >
            {updateTeacherMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <i className="ri-delete-bin-line" style={{ marginRight: '8px', color: '#d32f2f' }} />
            Xác nhận xóa giáo viên
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Bạn có chắc chắn muốn xóa giáo viên <strong>"{teacherToDelete?.name}"</strong> không?
            </Typography>
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              <i className="ri-error-warning-line" style={{ marginRight: '8px' }} />
              <strong>Cảnh báo:</strong> Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan đến giáo viên này sẽ bị xóa vĩnh viễn.
            </Typography>
            <Box sx={{
              mt: 2,
              p: 2,
              backgroundColor: '#fff3e0',
              borderRadius: 1,
              border: '1px solid #ffb74d'
            }}>
              <Typography variant="body2" color="text.secondary">
                <i className="ri-information-line" style={{ marginRight: '8px', color: '#ff9800' }} />
                Bao gồm: Thông tin cá nhân, lịch dạy, lớp phụ trách và các dữ liệu liên quan khác.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color='secondary'>
            Hủy
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={handleDeleteTeacher}
            disabled={deleteTeacherMutation.isPending}
            startIcon={<i className="ri-delete-bin-line" />}
          >
            {deleteTeacherMutation.isPending ? 'Đang xóa...' : 'Xóa giáo viên'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
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
    </Box>
  )
}

export default TeachersInfoPage 
