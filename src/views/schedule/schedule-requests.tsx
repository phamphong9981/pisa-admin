'use client'

// React Imports
import { useState } from 'react'

// Styled Components
import { styled } from '@mui/material/styles'

// MUI Imports
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
  Paper,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography
} from '@mui/material'

// Hooks
import { ScheduleStatus, useGetScheduleByFields, useUpdateUserSchedule } from '@/@core/hooks/useSchedule'
import { useGetWeeks, ScheduleStatus as WeekStatus } from '@/@core/hooks/useWeek'

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

  // Fetch weeks to get the open week ID
  const {
    data: weeks,
    isLoading: isWeeksLoading,
    error: weeksError
  } = useGetWeeks()

  // Get the first open week ID
  const openWeekId = weeks?.find(week => week.scheduleStatus === WeekStatus.OPEN)?.id

  // Fetch pending requests
  const {
    data: pendingRequests,
    isLoading: isPendingLoading,
    error: pendingError
  } = useGetScheduleByFields(ScheduleStatus.ON_REQUEST_CHANGE, openWeekId || "")

  // Fetch cancelled requests
  const {
    data: cancelledRequests,
    isLoading: isCancelledLoading,
    error: cancelledError
  } = useGetScheduleByFields(ScheduleStatus.CANCELLED, openWeekId || "")

  const updateScheduleMutation = useUpdateUserSchedule()

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case ScheduleStatus.ON_REQUEST_CHANGE:
        return 'Đang chờ duyệt'
      case ScheduleStatus.CANCELLED:
        return 'Đã hủy'
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

    try {
      const newStatus = actionType === 'approve' ? ScheduleStatus.CANCELLED : ScheduleStatus.ACTIVE

      await updateScheduleMutation.mutateAsync({
        scheduleId: selectedRequest.id,
        status: newStatus
      })

      setSuccessMessage(
        actionType === 'approve'
          ? 'Đã duyệt yêu cầu hủy lịch thành công!'
          : 'Đã từ chối yêu cầu hủy lịch thành công!'
      )
      setShowSuccessMessage(true)
      setShowConfirmDialog(false)
      setSelectedRequest(null)
      setActionType(null)
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
  }

  const formatTimeRange = (startTime?: string, endTime?: string) => {
    if (!startTime && !endTime) return '—'

    return `${startTime || '—'} - ${endTime || '—'}`
  }

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardHeader
          title="Quản lý yêu cầu đổi lịch"
          subheader="Duyệt hoặc từ chối các yêu cầu hủy lịch học của học sinh"
        />
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <StyledTabs value={tabValue} onChange={handleTabChange} aria-label="schedule requests tabs">
              <Tab
                label={`Đang chờ (${pendingRequests?.length || 0})`}
                icon={<i className="ri-time-line" />}
                iconPosition="start"
              />
              <Tab
                label={`Đã duyệt (${cancelledRequests?.length || 0})`}
                icon={<i className="ri-check-line" />}
                iconPosition="start"
              />
            </StyledTabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ mt: 2 }}>
            {/* Pending Requests Tab */}
            {tabValue === 0 && (
              <Box>
                {isWeeksLoading || isPendingLoading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                    <CircularProgress />
                  </Box>
                ) : weeksError ? (
                  <Alert severity="error">Lỗi tải danh sách tuần: {weeksError.message}</Alert>
                ) : !openWeekId ? (
                  <Alert severity="warning">Không có tuần nào đang mở để xem yêu cầu đổi lịch.</Alert>
                ) : pendingError ? (
                  <Alert severity="error">Lỗi tải danh sách yêu cầu đang chờ: {pendingError.message}</Alert>
                ) : pendingRequests && pendingRequests.length > 0 ? (
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
                          <StyledHeaderCell>Thao tác</StyledHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendingRequests.map((request) => (
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
                  <Alert severity="info">Không có yêu cầu đổi lịch nào đang chờ duyệt.</Alert>
                )}
              </Box>
            )}

            {/* Cancelled Requests Tab */}
            {tabValue === 1 && (
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
                ) : cancelledRequests && cancelledRequests.length > 0 ? (
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
                        {cancelledRequests.map((request) => (
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
              {actionType === 'approve' ? 'Duyệt yêu cầu hủy lịch' : 'Từ chối yêu cầu hủy lịch'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Bạn có chắc chắn muốn {actionType === 'approve' ? 'duyệt' : 'từ chối'} yêu cầu hủy lịch của:
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
                {actionType === 'approve'
                  ? 'Lịch học sẽ được hủy và học sinh sẽ không cần tham gia buổi học này.'
                  : 'Yêu cầu sẽ bị từ chối và học sinh vẫn cần tham gia buổi học như bình thường.'
                }
              </Typography>
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
            disabled={updateScheduleMutation.isPending}
            startIcon={
              updateScheduleMutation.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <i className={actionType === 'approve' ? 'ri-check-line' : 'ri-close-line'} />
              )
            }
          >
            {updateScheduleMutation.isPending
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
