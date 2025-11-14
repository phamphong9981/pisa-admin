'use client'

import { useState } from 'react'


import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
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

import { useRegisterStudentToClass } from '@/@core/hooks/useClass'
import { useStudentListWithReload } from '@/@core/hooks/useStudent'

interface RegisterStudentFormProps {
  classId: string
  className: string
  currentStudents: {
    profileId: string
    username: string
    fullName: string
  }[]
}

const RegisterStudentForm = ({ classId, className, currentStudents }: RegisterStudentFormProps) => {
  const [searchTerm, setSearchTerm] = useState('')

  const [selectedStudent, setSelectedStudent] = useState<{
    id: string
    username: string
    fullName: string
    email: string
    phone: string
    ieltsPoint: string
  } | null>(null)

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const { data: studentData, isLoading, error } = useStudentListWithReload(searchTerm)
  const registerMutation = useRegisterStudentToClass()

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleSearch = () => {
    if (searchTerm.trim()) {
      // Search will be triggered automatically by useStudentList
      setErrorMessage('')
      setSuccessMessage('')
    }
  }

  const handleRegisterClick = (student: any) => {
    const isAlreadyRegistered = currentStudents.some(
      s => s.profileId === student.profile.id || s.username === student.username
    )

    if (isAlreadyRegistered) {
      setErrorMessage('Học sinh này đã có trong lớp học')

      return
    }

    setSelectedStudent({
      id: student.profile.id,
      username: student.username,
      fullName: student.profile.fullname,
      email: student.profile.email,
      phone: student.profile.phone,
      ieltsPoint: student.profile.ieltsPoint
    })
    setShowConfirmDialog(true)
  }

  const handleConfirmRegister = async () => {
    if (!selectedStudent) return

    try {
      await registerMutation.mutateAsync({
        classId,
        username: selectedStudent.username
      })

      setSuccessMessage(`Đã đăng ký học sinh ${selectedStudent.fullName} vào lớp ${className}`)
      setShowConfirmDialog(false)
      setSelectedStudent(null)
      setSearchTerm('')
      setErrorMessage('')
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký học sinh')
      setShowConfirmDialog(false)
    }
  }

  const handleCancelRegister = () => {
    setShowConfirmDialog(false)
    setSelectedStudent(null)
  }

  const filteredStudents = studentData?.users?.filter(student =>
    !currentStudents.some(s => s.profileId === student.profile.id || s.username === student.username)
  ) || []

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={2}>
            <i className="ri-user-add-line text-xl" />
            <Typography variant="h6">Đăng ký học sinh vào lớp kỹ năng</Typography>
          </Box>
        }
      />
      <CardContent>
        {/* Search Form */}
        <Box mb={3}>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              label="Tìm kiếm học sinh"
              placeholder="Nhập tên hoặc username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              fullWidth
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={!searchTerm.trim() || isLoading}
              startIcon={isLoading ? <CircularProgress size={16} /> : <i className="ri-search-line" />}
            >
              Tìm kiếm
            </Button>
          </Box>
        </Box>

        {/* Success Message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage('')}>
            {errorMessage}
          </Alert>
        )}

        {/* Search Results */}
        {searchTerm && (
          <Box>
            {isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                <CircularProgress />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Đang tìm kiếm học sinh...
                </Typography>
              </Box>
            ) : error ? (
              <Alert severity="error">
                Lỗi khi tìm kiếm: {error.message}
              </Alert>
            ) : filteredStudents.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">
                  {studentData?.users?.length === 0
                    ? 'Không tìm thấy học sinh nào'
                    : 'Tất cả học sinh đã có trong lớp học này'}
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Kết quả tìm kiếm ({filteredStudents.length})
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Học sinh</TableCell>
                        <TableCell>Username</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Số điện thoại</TableCell>
                        <TableCell>IELTS</TableCell>
                        <TableCell align="center">Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                                {getInitials(student.profile.fullname)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {student.profile.fullname}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ID: {student.profile.id.slice(0, 8)}...
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{student.username}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{student.profile.email}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{student.profile.phone}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={student.profile.ieltsPoint || 'N/A'}
                              size="small"
                              color={student.profile.ieltsPoint ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Đăng ký vào lớp">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleRegisterClick(student)}
                                disabled={registerMutation.isPending}
                              >
                                <i className="ri-user-add-line" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        )}

        {/* Confirm Dialog */}
        <Dialog open={showConfirmDialog} onClose={handleCancelRegister} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <i className="ri-question-line text-warning" />
              Xác nhận đăng ký
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedStudent && (
              <Box>
                <Typography variant="body1" gutterBottom>
                  Bạn có chắc chắn muốn đăng ký học sinh sau vào lớp <strong>{className}</strong>?
                </Typography>
                <Box mt={2} p={2} sx={{ bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                      {getInitials(selectedStudent.fullName)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{selectedStudent.fullName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        @{selectedStudent.username}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Email: {selectedStudent.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Điện thoại: {selectedStudent.phone}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    IELTS: {selectedStudent.ieltsPoint || 'Chưa có'}
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelRegister} color="inherit">
              Hủy
            </Button>
            <Button
              onClick={handleConfirmRegister}
              variant="contained"
              color="primary"
              disabled={registerMutation.isPending}
              startIcon={registerMutation.isPending ? <CircularProgress size={16} /> : <i className="ri-user-add-line" />}
            >
              {registerMutation.isPending ? 'Đang đăng ký...' : 'Xác nhận đăng ký'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default RegisterStudentForm 
