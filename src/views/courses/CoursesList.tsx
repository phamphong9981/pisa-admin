'use client'

// React Imports
import { useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

// MUI Imports
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogContent,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { styled } from '@mui/material/styles'

// Hook Imports
import { useCourseList, useUpdateCourse, CourseStatus, RegionId, RegionLabel } from '@/@core/hooks/useCourse'

// Component Imports
import CreateCourseForm from './CreateCourseForm'

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 500,
  color: theme.palette.text.primary
}))

const getCourseTypeColor = (courseType: string) => {
  switch (courseType) {
    case 'FT_listening':
      return 'primary'
    case 'FT_writing':
      return 'secondary'
    case 'FT_reading':
      return 'success'
    case 'FT_speaking':
      return 'warning'
    default:
      return 'default'
  }
}

const getDisplayCourseTypeLabel = (courseType: string) => {
  switch (courseType) {
    case 'FT_listening':
      return 'Nghe'
    case 'FT_writing':
      return 'Viết'
    case 'FT_reading':
      return 'Đọc'
    case 'FT_speaking':
      return 'Nói'
    default:
      return courseType
  }
}

const getInitials = (name: string) => {
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
}

const getRegionName = (region: number) => RegionLabel[region as RegionId] || 'Không xác định'

const getRegionColor = (region: number) => {
  switch (region) {
    case RegionId.HALONG:
      return 'primary'
    case RegionId.UONGBI:
      return 'secondary'
    case RegionId.CAMPHA:
      return 'success'
    case RegionId.BAICHAY:
      return 'warning'
    case RegionId.HAIDUONG:
      return 'info'
    default:
      return 'default'
  }
}

const CoursesList = () => {
  // States
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState<number | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<CourseStatus | 'all'>('all')
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [editingCourse, setEditingCourse] = useState<{
    id: string
    name: string
    type: string
    status: CourseStatus
    region: number
  } | null>(null)
  const [editForm, setEditForm] = useState<{
    name: string
    type: string
    status: CourseStatus
    region: number
  }>({
    name: '',
    type: '',
    status: CourseStatus.ACTIVE,
    region: 1
  })

  const { data: courses, isLoading, error } = useCourseList(selectedRegion === 'all' ? undefined : selectedRegion)
  const updateCourseMutation = useUpdateCourse()

  // Router
  const router = useRouter()

  // Filter data based on search term and region
  const filteredData = useMemo(() => {
    if (!courses) return []

    return courses.filter(course => {
      const statusMatch = selectedStatus === 'all' || course.status === selectedStatus
      const teacherName = course.teacher?.name || ''
      const regionName = getRegionName(course.region)

      const searchMatch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getDisplayCourseTypeLabel(course.type).toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        regionName.toLowerCase().includes(searchTerm.toLowerCase())
      return statusMatch && searchMatch
    })
  }, [searchTerm, courses, selectedStatus])

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage

    return filteredData.slice(startIndex, startIndex + rowsPerPage)
  }, [filteredData, page, rowsPerPage])

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Đang tải dữ liệu...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">Lỗi: {error.message}</Typography>
      </Box>
    )
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Quản lý lớp học"
          subheader="Quản lý các lớp học tại trung tâm"
          action={
            <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as CourseStatus | 'all')}
                  label="Trạng thái"
                >
                  <MenuItem value="all">
                    <Box display="flex" alignItems="center" gap={1}>
                      <i className="ri-toggle-line" style={{ color: '#666' }} />
                      <span>Tất cả trạng thái</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value={CourseStatus.ACTIVE}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <i className="ri-checkbox-circle-line" style={{ color: '#2e7d32' }} />
                      <span>Đang hoạt động</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value={CourseStatus.INACTIVE}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <i className="ri-close-circle-line" style={{ color: '#c62828' }} />
                      <span>Ngưng hoạt động</span>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Khu vực</InputLabel>
                <Select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value as number | 'all')}
                  label="Khu vực"
                >
                  <MenuItem value="all">
                    <Box display="flex" alignItems="center" gap={1}>
                      <i className="ri-global-line" style={{ color: '#666' }} />
                      <span>Tất cả</span>
                    </Box>
                  </MenuItem>
                  {(Object.keys(RegionLabel) as Array<string>).map((key) => {
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
              <Button
                variant="contained"
                startIcon={<i className="ri-add-line" />}
                onClick={() => setOpenCreateDialog(true)}
                sx={{ minWidth: 'auto' }}
              >
                Tạo lớp học mới
              </Button>
              <TextField
                size="small"
                placeholder="Tìm kiếm lớp học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="ri-search-line" />
                    </InputAdornment>
                  )
                }}
                sx={{ minWidth: 300 }}
              />
            </Box>
          }
        />
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <StyledTableCell>Lớp học</StyledTableCell>
                  <StyledTableCell>Loại lớp</StyledTableCell>
                  <StyledTableCell>Khu vực</StyledTableCell>
                  <StyledTableCell align="center">Số kỹ năng</StyledTableCell>
                  <StyledTableCell>Giáo viên</StyledTableCell>
                  <StyledTableCell align="center">Thao tác</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((course) => (
                  <TableRow key={course.name} hover onClick={() => router.push(`/courses/${encodeURIComponent(course.id)}`)}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getInitials(course.name)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {course.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {course.classes.length} kỹ năng
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getDisplayCourseTypeLabel(course.type)}
                        color={getCourseTypeColor(course.type) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getRegionName(course.region)}
                        color={getRegionColor(course.region) as any}
                        size="small"
                        icon={<i className="ri-map-pin-line" />}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Badge badgeContent={course.classes.length} color="primary">
                        <Typography variant="body2">
                          {course.classes.length} kỹ năng
                        </Typography>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                          {getInitials(course.teacher?.name || '')}
                        </Avatar>
                        <Typography variant="body2">
                          {course.teacher?.name || 'Chưa phân công'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1} justifyContent="center">
                        <Tooltip title="Xem chi tiết lớp học">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => router.push(`/courses/${encodeURIComponent(course.id)}`)}
                          >
                            <i className="ri-eye-line" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa lớp">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={(event) => {
                              event.stopPropagation()
                              setEditingCourse({
                                id: course.id,
                                name: course.name,
                                type: course.type,
                                status: course.status,
                                region: course.region
                              })
                              setEditForm({
                                name: course.name,
                                type: course.type,
                                status: course.status,
                                region: course.region
                              })
                              setOpenEditDialog(true)
                            }}
                          >
                            <i className="ri-edit-line" />
                          </IconButton>
                        </Tooltip>
                        {/* <Tooltip title="Xem lịch học">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => router.push(`/courses/${encodeURIComponent(course.id)}/schedule`)}
                          >
                            <i className="ri-calendar-line" />
                          </IconButton>
                        </Tooltip> */}
                        {/* <Tooltip title="Chỉnh sửa">
                          <IconButton size="small" color="warning">
                            <i className="ri-edit-line" />
                          </IconButton>
                        </Tooltip> */}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredData.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Số hàng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} trong ${count}`}
          />
        </CardContent>
      </Card>

      {/* Create Course Dialog */}
      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <CreateCourseForm onSuccess={() => setOpenCreateDialog(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Tên lớp"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Loại lớp"
              value={editForm.type}
              onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
              fullWidth
              helperText="Ví dụ: FT_listening, FT_writing, ..."
            />
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={editForm.status}
                label="Trạng thái"
                onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as CourseStatus }))}
              >
                <MenuItem value={CourseStatus.ACTIVE}>Đang hoạt động</MenuItem>
                <MenuItem value={CourseStatus.INACTIVE}>Ngưng hoạt động</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Khu vực</InputLabel>
              <Select
                value={editForm.region}
                label="Khu vực"
                onChange={(e) => setEditForm(prev => ({ ...prev, region: Number(e.target.value) }))}
              >
                {(Object.keys(RegionLabel) as Array<string>).map((key) => {
                  const id = Number(key) as RegionId
                  return (
                    <MenuItem key={id} value={id}>{RegionLabel[id]}</MenuItem>
                  )
                })}
              </Select>
            </FormControl>
            <Box display="flex" justifyContent="flex-end" gap={1} mt={1}>
              <Button variant="outlined" onClick={() => setOpenEditDialog(false)}>
                Hủy
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  if (!editingCourse) return
                  updateCourseMutation.mutate({
                    courseId: editingCourse.id,
                    updateCourseRequest: {
                      name: editForm.name,
                      type: editForm.type,
                      status: editForm.status,
                      region: editForm.region
                    }
                  }, {
                    onSuccess: () => {
                      setOpenEditDialog(false)
                    }
                  })
                }}
                disabled={updateCourseMutation.isPending}
              >
                {updateCourseMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CoursesList 
