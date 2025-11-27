'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// Styled Components
import { styled } from '@mui/material/styles'

// MUI Imports
import {
  Alert,
  Autocomplete,
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
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material'

// Hooks
import { ScheduleStatus, useGetScheduleByFields, useRequestSchedule } from '@/@core/hooks/useSchedule'
import { useGetWeeks, ScheduleStatus as WeekStatus, WeekResponseDto } from '@/@core/hooks/useWeek'

const StyledHeaderCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 700,
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  borderBottom: `3px solid ${theme.palette.primary.dark}`,
  fontSize: '0.9rem',
  padding: '16px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
}))

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontSize: '0.875rem',
  padding: '16px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transition: 'background-color 0.2s ease'
  }
}))

const StatusChip = styled(Chip)<{ status: string }>(({ status }) => ({
  fontSize: '0.75rem',
  fontWeight: 600,
  borderRadius: '8px',
  padding: '4px 8px',
  minHeight: '24px',
  ...(status === ScheduleStatus.ON_REQUEST_CHANGE && {
    backgroundColor: '#fff3e0',
    color: '#ef6c00',
    border: '1px solid #ff9800'
  }),
  ...(status === 'cancelled' && {
    backgroundColor: '#ffebee',
    color: '#c62828',
    border: '1px solid #f44336'
  }),
  ...(status === 'active' && {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
    border: '1px solid #4caf50'
  }),
  ...(status === ScheduleStatus.CHANGED && {
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
    border: '1px solid #2196f3'
  }),
  ...(status === ScheduleStatus.APPROVED_ACTIVE && {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
    border: '1px solid #4caf50'
  })
}))

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTab-root': {
    minHeight: '48px',
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'none',
    borderRadius: '8px 8px 0 0',
    marginRight: '4px',
    '&.Mui-selected': {
      backgroundColor: theme.palette.primary.main,
      color: 'white',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover
    }
  },
  '& .MuiTabs-indicator': {
    display: 'none'
  }
}))

const ScheduleRequests = () => {
  const [tabValue, setTabValue] = useState(0)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [statusReason, setStatusReason] = useState('')
  const [courseNameFilter, setCourseNameFilter] = useState<string | null>(null)
  const [selectedWeekId, setSelectedWeekId] = useState<string>('')

  // Fetch weeks to get the open week ID
  const {
    data: weeks,
    isLoading: isWeeksLoading,
    error: weeksError
  } = useGetWeeks()

  // Get the first open week ID
  const openWeekId = useMemo(() => {
    return weeks?.find(week => week.scheduleStatus === WeekStatus.OPEN)?.id
  }, [weeks])

  // Set default selected week (open week or most recent)
  useEffect(() => {
    if (weeks && weeks.length > 0 && !selectedWeekId) {
      if (openWeekId) {
        setSelectedWeekId(openWeekId)
      } else {
        // Sort by startDate descending and take the most recent
        const sortedWeeks = [...weeks].sort((a: WeekResponseDto, b: WeekResponseDto) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        )
        setSelectedWeekId(sortedWeeks[0].id)
      }
    }
  }, [weeks, openWeekId, selectedWeekId])

  // Fetch pending change requests
  const {
    data: pendingChangeRequests,
    isLoading: isPendingChangeLoading,
    error: pendingChangeError
  } = useGetScheduleByFields(ScheduleStatus.ON_REQUEST_CHANGE, selectedWeekId || "")

  // Fetch pending active requests
  const {
    data: pendingActiveRequests,
    isLoading: isPendingActiveLoading,
    error: pendingActiveError
  } = useGetScheduleByFields(ScheduleStatus.ON_REQUEST_ACTIVE, selectedWeekId || "")

  // Fetch cancelled requests
  const {
    data: cancelledRequests,
    isLoading: isCancelledLoading,
    error: cancelledError
  } = useGetScheduleByFields(ScheduleStatus.CANCELLED, selectedWeekId || "")

  // Fetch approved active requests
  const {
    data: approvedActiveRequests,
    isLoading: isApprovedActiveLoading,
    error: approvedActiveError
  } = useGetScheduleByFields(ScheduleStatus.APPROVED_ACTIVE, selectedWeekId || "")

  // Fetch changed requests
  const {
    data: changedRequests,
    isLoading: isChangedLoading,
    error: changedError
  } = useGetScheduleByFields(ScheduleStatus.CHANGED, selectedWeekId || "")

  const requestScheduleMutation = useRequestSchedule()

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case ScheduleStatus.ON_REQUEST_CHANGE:
        return 'Yêu cầu đổi lịch'
      case ScheduleStatus.ON_REQUEST_ACTIVE:
        return 'Yêu cầu tham gia lớp'
      case ScheduleStatus.CANCELLED:
        return 'Đã xin nghỉ'
      case ScheduleStatus.APPROVED_ACTIVE:
        return 'Đã chấp thuận tham gia lớp'
      case ScheduleStatus.CHANGED:
        return 'Đã đổi lịch'
      case ScheduleStatus.NO_SCHEDULE:
        return 'Không có lịch'
      case ScheduleStatus.ACTIVE:
        return 'Hoạt động'
      default:
        return 'Không xác định'
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleApprove = (request: any) => {
    setSelectedRequest(request)
    setActionType('approve')
    setShowConfirmDialog(true)
  }

  const handleReject = (request: any) => {
    setSelectedRequest(request)
    setActionType('reject')
    setShowConfirmDialog(true)
  }

  const handleConfirmAction = async () => {
    if (!selectedRequest || !actionType) return

    // Validate statusReason for ON_REQUEST_ACTIVE reject
    if (actionType === 'reject' && selectedRequest.status === ScheduleStatus.ON_REQUEST_ACTIVE && !statusReason.trim()) {
      setSuccessMessage('Vui lòng nhập lý do từ chối!')
      setShowSuccessMessage(true)
      return
    }

    try {
      let newStatus: ScheduleStatus
      let successMsg: string

      if (selectedRequest.status === ScheduleStatus.ON_REQUEST_CHANGE) {
        // Xử lý yêu cầu hủy lịch
        if (actionType === 'approve') {
          newStatus = ScheduleStatus.CHANGED
          successMsg = 'Đã duyệt yêu cầu hủy lịch thành công!'
        } else {
          newStatus = ScheduleStatus.ACTIVE
          successMsg = 'Đã từ chối yêu cầu hủy lịch thành công!'
        }
      } else if (selectedRequest.status === ScheduleStatus.ON_REQUEST_ACTIVE) {
        // Xử lý yêu cầu kích hoạt lịch
        if (actionType === 'approve') {
          newStatus = ScheduleStatus.APPROVED_ACTIVE
          successMsg = 'Đã duyệt yêu cầu kích hoạt lịch thành công!'
        } else {
          newStatus = ScheduleStatus.NO_SCHEDULE
          successMsg = 'Đã từ chối yêu cầu kích hoạt lịch thành công!'
        }
      } else {
        throw new Error('Trạng thái yêu cầu không hợp lệ')
      }

      await requestScheduleMutation.mutateAsync({
        status: newStatus,
        scheduleId: selectedRequest.id,
        statusReason: actionType === 'reject' && selectedRequest.status === ScheduleStatus.ON_REQUEST_ACTIVE ? statusReason : undefined
      })

      setSuccessMessage(successMsg)
      setShowSuccessMessage(true)
      setShowConfirmDialog(false)
      setSelectedRequest(null)
      setActionType(null)
      setStatusReason('')
    } catch (error) {
      console.error('Error updating schedule status:', error)
      setSuccessMessage('Có lỗi xảy ra khi cập nhật trạng thái!')
      setShowSuccessMessage(true)
    }
  }

  const handleCloseConfirmDialog = () => {
    setShowConfirmDialog(false)
    setSelectedRequest(null)
    setActionType(null)
    setStatusReason('')
  }

  const formatTimeRange = (startTime?: string, endTime?: string) => {
    if (!startTime && !endTime) return '—'

    return `${startTime || '—'} - ${endTime || '—'}`
  }

  // Calculate end date for a week (startDate + 6 days)
  const calculateEndDate = (startDate: Date): Date => {
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6) // Add 6 days to get the end of the week
    return endDate
  }

  // Get unique course names from all requests
  const getAllCourseNames = () => {
    const allRequests = [
      ...(pendingChangeRequests || []),
      ...(pendingActiveRequests || []),
      ...(cancelledRequests || []),
      ...(approvedActiveRequests || []),
      ...(changedRequests || [])
    ]
    const uniqueCourseNames = Array.from(
      new Set(allRequests.map(request => request.courseName).filter(Boolean))
    ).sort()
    return uniqueCourseNames
  }

  // Filter requests by course name
  const filterRequests = (requests: any[] | undefined) => {
    if (!requests) return []
    if (!courseNameFilter) return requests
    return requests.filter(request => request.courseName === courseNameFilter)
  }

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardHeader
          title="Quản lý yêu cầu đổi lịch"
          subheader="Duyệt hoặc từ chối các yêu cầu hủy lịch học của học sinh"
        />
        <CardContent>
          {/* Filter Section */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Week Selection */}
            <FormControl size="small" sx={{ minWidth: 250 }}>
              <InputLabel>Tuần học</InputLabel>
              <Select
                value={selectedWeekId}
                onChange={(e) => setSelectedWeekId(e.target.value)}
                label="Tuần học"
                disabled={isWeeksLoading}
              >
                {isWeeksLoading ? (
                  <MenuItem disabled>Đang tải...</MenuItem>
                ) : weeks && weeks.length === 0 ? (
                  <MenuItem disabled>Không có dữ liệu</MenuItem>
                ) : (
                  weeks?.map((week: WeekResponseDto) => {
                    const startDate = new Date(week.startDate)
                    const endDate = calculateEndDate(startDate)

                    return (
                      <MenuItem key={week.id} value={week.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <i className="ri-calendar-line" style={{ color: '#1976d2' }} />
                          <Box>
                            <Typography variant="body2">
                              {startDate.toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })} - {endDate.toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {week.scheduleStatus === WeekStatus.OPEN ? 'Mở' :
                                week.scheduleStatus === WeekStatus.CLOSED ? 'Đóng' : 'Chờ duyệt'}
                              {openWeekId === week.id && ' (Đang mở)'}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    )
                  })
                )}
              </Select>
            </FormControl>

            {/* Course Name Filter */}
            <Autocomplete
              options={getAllCourseNames()}
              value={courseNameFilter}
              onChange={(event, newValue) => setCourseNameFilter(newValue || null)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Lọc theo tên lớp"
                  placeholder="Chọn hoặc nhập tên lớp"
                  size="small"
                  sx={{ maxWidth: 400 }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  {option}
                </Box>
              )}
              clearOnEscape
              clearText="Xóa bộ lọc"
              noOptionsText="Không tìm thấy lớp nào"
            />
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <StyledTabs value={tabValue} onChange={handleTabChange} aria-label="schedule requests tabs">
              <Tab
                label={`Yêu cầu đổi lịch (${filterRequests(pendingChangeRequests).length || 0})`}
                icon={<i className="ri-close-circle-line" />}
                iconPosition="start"
              />
              <Tab
                label={`Yêu cầu tham gia lớp (${filterRequests(pendingActiveRequests).length || 0})`}
                icon={<i className="ri-play-circle-line" />}
                iconPosition="start"
              />
              <Tab
                label={`Đã xin nghỉ (${filterRequests(cancelledRequests).length || 0})`}
                icon={<i className="ri-check-line" />}
                iconPosition="start"
              />
              <Tab
                label={`Đã chấp thuận tham gia lớp (${filterRequests(approvedActiveRequests).length || 0})`}
                icon={<i className="ri-check-double-line" />}
                iconPosition="start"
              />
              <Tab
                label={`Đã đổi lịch (${filterRequests(changedRequests).length || 0})`}
                icon={<i className="ri-repeat-line" />}
                iconPosition="start"
              />
            </StyledTabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ mt: 2 }}>
            {/* Pending Change Requests Tab */}
            {tabValue === 0 && (
              <Box>
                {isWeeksLoading || isPendingChangeLoading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                    <CircularProgress />
                  </Box>
                ) : weeksError ? (
                  <Alert severity="error">Lỗi tải danh sách tuần: {weeksError.message}</Alert>
                ) : !selectedWeekId ? (
                  <Alert severity="warning">Vui lòng chọn tuần học để xem yêu cầu đổi lịch.</Alert>
                ) : pendingChangeError ? (
                  <Alert severity="error">Lỗi tải danh sách yêu cầu hủy lịch: {pendingChangeError.message}</Alert>
                ) : filterRequests(pendingChangeRequests).length > 0 ? (
                  <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <StyledHeaderCell>Học sinh</StyledHeaderCell>
                          <StyledHeaderCell>Lớp</StyledHeaderCell>
                          <StyledHeaderCell>Kỹ năng</StyledHeaderCell>
                          <StyledHeaderCell>Thời gian</StyledHeaderCell>
                          <StyledHeaderCell>Ghi chú</StyledHeaderCell>
                          <StyledHeaderCell>Trạng thái</StyledHeaderCell>
                          <StyledHeaderCell>Thao tác</StyledHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filterRequests(pendingChangeRequests).map((request) => (
                          <TableRow key={request.id}>
                            <StyledTableCell>
                              <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                                  {getInitials(request.fullname)}
                                </Avatar>
                                <Typography variant="body2" fontWeight={500}>
                                  {request.fullname}
                                </Typography>
                              </Box>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2">
                                {request.courseName}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2">
                                {request.classname}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2">
                                {formatTimeRange(request.startTime, request.endTime)}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2" color="text.secondary">
                                {request.note || '—'}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <StatusChip
                                label={getStatusText(request.status)}
                                status={request.status}
                                size="small"
                              />
                            </StyledTableCell>
                            <StyledTableCell>
                              <Box display="flex" gap={1}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => handleApprove(request)}
                                  startIcon={<i className="ri-check-line" />}
                                  sx={{ fontSize: '0.75rem', py: 0.5 }}
                                >
                                  Duyệt
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleReject(request)}
                                  startIcon={<i className="ri-close-line" />}
                                  sx={{ fontSize: '0.75rem', py: 0.5 }}
                                >
                                  Từ chối
                                </Button>
                              </Box>
                            </StyledTableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">Không có yêu cầu hủy lịch nào đang chờ duyệt.</Alert>
                )}
              </Box>
            )}

            {/* Pending Active Requests Tab */}
            {tabValue === 1 && (
              <Box>
                {isWeeksLoading || isPendingActiveLoading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                    <CircularProgress />
                  </Box>
                ) : weeksError ? (
                  <Alert severity="error">Lỗi tải danh sách tuần: {weeksError.message}</Alert>
                ) : !openWeekId ? (
                  <Alert severity="warning">Không có tuần nào đang mở để xem yêu cầu đổi lịch.</Alert>
                ) : pendingActiveError ? (
                  <Alert severity="error">Lỗi tải danh sách yêu cầu kích hoạt lịch: {pendingActiveError.message}</Alert>
                ) : filterRequests(pendingActiveRequests).length > 0 ? (
                  <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <StyledHeaderCell>Học sinh</StyledHeaderCell>
                          <StyledHeaderCell>Lớp</StyledHeaderCell>
                          <StyledHeaderCell>Kỹ năng</StyledHeaderCell>
                          <StyledHeaderCell>Thời gian</StyledHeaderCell>
                          <StyledHeaderCell>Ghi chú</StyledHeaderCell>
                          <StyledHeaderCell>Trạng thái</StyledHeaderCell>
                          <StyledHeaderCell>Thao tác</StyledHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filterRequests(pendingActiveRequests).map((request) => (
                          <TableRow key={request.id}>
                            <StyledTableCell>
                              <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                                  {getInitials(request.fullname)}
                                </Avatar>
                                <Typography variant="body2" fontWeight={500}>
                                  {request.fullname}
                                </Typography>
                              </Box>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2">
                                {request.courseName}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2">
                                {request.classname}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2">
                                {formatTimeRange(request.startTime, request.endTime)}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2" color="text.secondary">
                                {request.note || '—'}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <StatusChip
                                label={getStatusText(request.status)}
                                status={request.status}
                                size="small"
                              />
                            </StyledTableCell>
                            <StyledTableCell>
                              <Box display="flex" gap={1}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => handleApprove(request)}
                                  startIcon={<i className="ri-check-line" />}
                                  sx={{ fontSize: '0.75rem', py: 0.5 }}
                                >
                                  Duyệt
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleReject(request)}
                                  startIcon={<i className="ri-close-line" />}
                                  sx={{ fontSize: '0.75rem', py: 0.5 }}
                                >
                                  Từ chối
                                </Button>
                              </Box>
                            </StyledTableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">Không có yêu cầu kích hoạt lịch nào đang chờ duyệt.</Alert>
                )}
              </Box>
            )}

            {/* Cancelled Requests Tab */}
            {tabValue === 2 && (
              <Box>
                {isWeeksLoading || isCancelledLoading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                    <CircularProgress />
                  </Box>
                ) : weeksError ? (
                  <Alert severity="error">Lỗi tải danh sách tuần: {weeksError.message}</Alert>
                ) : !openWeekId ? (
                  <Alert severity="warning">Không có tuần nào đang mở để xem yêu cầu đổi lịch.</Alert>
                ) : cancelledError ? (
                  <Alert severity="error">Lỗi tải danh sách yêu cầu đã duyệt: {cancelledError.message}</Alert>
                ) : filterRequests(cancelledRequests).length > 0 ? (
                  <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <StyledHeaderCell>Học sinh</StyledHeaderCell>
                          <StyledHeaderCell>Lớp</StyledHeaderCell>
                          <StyledHeaderCell>Kỹ năng</StyledHeaderCell>
                          <StyledHeaderCell>Thời gian</StyledHeaderCell>
                          <StyledHeaderCell>Ghi chú</StyledHeaderCell>
                          <StyledHeaderCell>Trạng thái</StyledHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filterRequests(cancelledRequests).map((request) => (
                          <TableRow key={request.id}>
                            <StyledTableCell>
                              <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                                  {getInitials(request.fullname)}
                                </Avatar>
                                <Typography variant="body2" fontWeight={500}>
                                  {request.fullname}
                                </Typography>
                              </Box>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2">
                                {request.courseName}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2">
                                {request.classname}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2">
                                {formatTimeRange(request.startTime, request.endTime)}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2" color="text.secondary">
                                {request.note || '—'}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <StatusChip
                                label={getStatusText(request.status)}
                                status={request.status}
                                size="small"
                              />
                            </StyledTableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">Không có yêu cầu đổi lịch nào đã được duyệt.</Alert>
                )}
              </Box>
            )}

            {/* Approved Active Requests Tab */}
            {tabValue === 3 && (
              <Box>
                {isWeeksLoading || isApprovedActiveLoading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                    <CircularProgress />
                  </Box>
                ) : weeksError ? (
                  <Alert severity="error">Lỗi tải danh sách tuần: {weeksError.message}</Alert>
                ) : !openWeekId ? (
                  <Alert severity="warning">Không có tuần nào đang mở để xem yêu cầu đổi lịch.</Alert>
                ) : approvedActiveError ? (
                  <Alert severity="error">Lỗi tải danh sách yêu cầu đã kích hoạt: {approvedActiveError.message}</Alert>
                ) : filterRequests(approvedActiveRequests).length > 0 ? (
                  <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <StyledHeaderCell>Học sinh</StyledHeaderCell>
                          <StyledHeaderCell>Lớp</StyledHeaderCell>
                          <StyledHeaderCell>Kỹ năng</StyledHeaderCell>
                          <StyledHeaderCell>Thời gian</StyledHeaderCell>
                          <StyledHeaderCell>Ghi chú</StyledHeaderCell>
                          <StyledHeaderCell>Trạng thái</StyledHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filterRequests(approvedActiveRequests).map((request) => (
                          <TableRow key={request.id}>
                            <StyledTableCell>
                              <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                                  {getInitials(request.fullname)}
                                </Avatar>
                                <Typography variant="body2" fontWeight={500}>
                                  {request.fullname}
                                </Typography>
                              </Box>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2">
                                {request.courseName}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2">
                                {request.classname}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2">
                                {formatTimeRange(request.startTime, request.endTime)}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2" color="text.secondary">
                                {request.note || '—'}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <StatusChip
                                label={getStatusText(request.status)}
                                status={request.status}
                                size="small"
                              />
                            </StyledTableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">Không có yêu cầu kích hoạt nào đã được duyệt.</Alert>
                )}
              </Box>
            )}

            {/* Changed Requests Tab */}
            {tabValue === 4 && (
              <Box>
                {isWeeksLoading || isChangedLoading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                    <CircularProgress />
                  </Box>
                ) : weeksError ? (
                  <Alert severity="error">Lỗi tải danh sách tuần: {weeksError.message}</Alert>
                ) : !openWeekId ? (
                  <Alert severity="warning">Không có tuần nào đang mở để xem yêu cầu đổi lịch.</Alert>
                ) : changedError ? (
                  <Alert severity="error">Lỗi tải danh sách yêu cầu đã đổi lịch: {changedError.message}</Alert>
                ) : filterRequests(changedRequests).length > 0 ? (
                  <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <StyledHeaderCell>Học sinh</StyledHeaderCell>
                          <StyledHeaderCell>Lớp</StyledHeaderCell>
                          <StyledHeaderCell>Buổi</StyledHeaderCell>
                          <StyledHeaderCell>Thời gian</StyledHeaderCell>
                          <StyledHeaderCell>Ghi chú</StyledHeaderCell>
                          <StyledHeaderCell>Trạng thái</StyledHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filterRequests(changedRequests).map((request) => (
                          <TableRow key={request.id}>
                            <StyledTableCell>
                              <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                                  {getInitials(request.fullname)}
                                </Avatar>
                                <Typography variant="body2" fontWeight={500}>
                                  {request.fullname}
                                </Typography>
                              </Box>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2">
                                {request.classname}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2">
                                Buổi {request.lesson}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2">
                                {formatTimeRange(request.startTime, request.endTime)}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography variant="body2" color="text.secondary">
                                {request.note || '—'}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell>
                              <StatusChip
                                label={getStatusText(request.status)}
                                status={request.status}
                                size="small"
                              />
                            </StyledTableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">Không có yêu cầu đổi lịch nào đã được duyệt.</Alert>
                )}
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={handleCloseConfirmDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <i
              className={actionType === 'approve' ? 'ri-check-line' : 'ri-close-line'}
              style={{
                fontSize: '24px',
                color: actionType === 'approve' ? '#2e7d32' : '#c62828'
              }}
            />
            <Typography variant="h6" fontWeight={600}>
              {selectedRequest?.status === ScheduleStatus.ON_REQUEST_CHANGE
                ? (actionType === 'approve' ? 'Duyệt yêu cầu hủy lịch' : 'Từ chối yêu cầu hủy lịch')
                : (actionType === 'approve' ? 'Duyệt yêu cầu kích hoạt lịch' : 'Từ chối yêu cầu kích hoạt lịch')
              }
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Bạn có chắc chắn muốn {actionType === 'approve' ? 'duyệt' : 'từ chối'} yêu cầu {selectedRequest.status === ScheduleStatus.ON_REQUEST_CHANGE ? 'hủy lịch' : 'kích hoạt lịch'} của:
              </Typography>
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  Học sinh: {selectedRequest.fullname}
                </Typography>
                <Typography variant="body2">
                  Lớp: {selectedRequest.classname} - Buổi {selectedRequest.lesson}
                </Typography>
                <Typography variant="body2">
                  Thời gian: {formatTimeRange(selectedRequest.startTime, selectedRequest.endTime)}
                </Typography>
                {selectedRequest.note && (
                  <Typography variant="body2" color="text.secondary">
                    Ghi chú: {selectedRequest.note}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {selectedRequest.status === ScheduleStatus.ON_REQUEST_CHANGE
                  ? (actionType === 'approve'
                    ? 'Lịch học sẽ được hủy và học sinh sẽ không cần tham gia buổi học này.'
                    : 'Yêu cầu sẽ bị từ chối và học sinh vẫn cần tham gia buổi học như bình thường.'
                  )
                  : (actionType === 'approve'
                    ? 'Lịch học sẽ được kích hoạt và học sinh có thể tham gia buổi học này.'
                    : 'Yêu cầu sẽ bị từ chối và học sinh sẽ không có lịch học cho buổi này.'
                  )
                }
              </Typography>
              {actionType === 'reject' && selectedRequest.status === ScheduleStatus.ON_REQUEST_ACTIVE && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Lý do từ chối"
                    placeholder="Nhập lý do từ chối yêu cầu kích hoạt lịch..."
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    multiline
                    rows={3}
                    variant="outlined"
                    required
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} variant="outlined">
            Hủy
          </Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
            disabled={requestScheduleMutation.isPending}
            startIcon={
              requestScheduleMutation.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <i className={actionType === 'approve' ? 'ri-check-line' : 'ri-close-line'} />
              )
            }
          >
            {requestScheduleMutation.isPending
              ? 'Đang xử lý...'
              : (actionType === 'approve' ? 'Duyệt' : 'Từ chối')
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Message */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={4000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setShowSuccessMessage(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ScheduleRequests
