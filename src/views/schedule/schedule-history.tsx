'use client'

// React Imports
import { useState, useMemo } from 'react'

// Styled Components
import { styled } from '@mui/material/styles'

// MUI Imports
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Collapse,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
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

// Hooks
import { useScheduleAudit, type ScheduleAuditLog, type AuditOperation } from '@/@core/hooks/useScheduleAudit'
import { useGetWeeks, type WeekResponseDto } from '@/@core/hooks/useWeek'
import { useCourseList } from '@/@core/hooks/useCourse'

// Styled Components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: theme.palette.grey[50],
  color: theme.palette.text.primary,
  borderBottom: `2px solid ${theme.palette.divider}`,
  fontSize: '0.875rem'
}))

const OperationChip = styled(Chip)<{ operation: AuditOperation }>(({ operation }) => {
  const colors = {
    INSERT: { bg: '#c8e6c9', color: '#2e7d32', border: '#81c784' },
    UPDATE: { bg: '#fff9c4', color: '#f57f17', border: '#fff176' },
    DELETE: { bg: '#ffcdd2', color: '#c62828', border: '#ef9a9a' }
  }

  return {
    backgroundColor: colors[operation].bg,
    color: colors[operation].color,
    border: `1px solid ${colors[operation].border}`,
    fontWeight: 600,
    fontSize: '0.75rem'
  }
})

const ScheduleHistory = () => {
  // Filter states
  const [selectedWeekId, setSelectedWeekId] = useState<string>('')
  const [selectedScheduleTime, setSelectedScheduleTime] = useState<number | ''>('')
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [selectedClassId, setSelectedClassId] = useState<string>('')

  // Table states
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  // Fetch weeks and courses for filters
  const { data: weeksData, isLoading: isWeeksLoading } = useGetWeeks()
  const { data: courses, isLoading: isCoursesLoading } = useCourseList()

  // Get weeks list
  const weeks = useMemo(() => {
    return weeksData || []
  }, [weeksData])

  // Calculate end date for a week (startDate + 6 days)
  const calculateEndDate = (startDate: Date): Date => {
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)
    return endDate
  }

  // Get classes from selected course
  const selectedCourse = useMemo(() => {
    return courses?.find(c => c.id === selectedCourseId)
  }, [courses, selectedCourseId])

  // Build search params
  const searchParams = useMemo(() => {
    const params: { weekId?: string; scheduleTime?: number; classId?: string } = {}
    if (selectedWeekId) params.weekId = selectedWeekId
    if (selectedScheduleTime) params.scheduleTime = selectedScheduleTime
    if (selectedClassId) params.classId = selectedClassId
    return params
  }, [selectedWeekId, selectedScheduleTime, selectedClassId])

  // Fetch audit logs
  const { data: auditLogs, isLoading: isAuditLoading, error: auditError } = useScheduleAudit(searchParams)

  // Pagination
  const paginatedLogs = useMemo(() => {
    console.log(auditLogs)
    if (!auditLogs) return []
    return auditLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  }, [auditLogs, page, rowsPerPage])

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleReset = () => {
    setSelectedWeekId('')
    setSelectedScheduleTime('')
    setSelectedCourseId('')
    setSelectedClassId('')
    setPage(0)
  }

  const toggleRowExpansion = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id)
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Render JSON diff
  const renderValuesDiff = (log: ScheduleAuditLog) => {
    if (log.operation === 'INSERT' && log.newValues) {
      return (
        <Box>
          <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>
            Giá trị mới (INSERT):
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(log.newValues, null, 2)}
            </pre>
          </Paper>
        </Box>
      )
    }

    if (log.operation === 'DELETE' && log.oldValues) {
      return (
        <Box>
          <Typography variant="subtitle2" color="error.main" sx={{ mb: 1 }}>
            Giá trị cũ (DELETE):
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(log.oldValues, null, 2)}
            </pre>
          </Paper>
        </Box>
      )
    }

    if (log.operation === 'UPDATE' && log.oldValues && log.newValues) {
      // Find changed fields
      const changedFields: Array<{ field: string; oldValue: any; newValue: any }> = []
      const allKeys = new Set([...Object.keys(log.oldValues), ...Object.keys(log.newValues)])

      allKeys.forEach(key => {
        const oldVal = (log.oldValues as any)?.[key]
        const newVal = (log.newValues as any)?.[key]
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changedFields.push({ field: key, oldValue: oldVal, newValue: newVal })
        }
      })

      return (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Các trường đã thay đổi:
          </Typography>
          <TableContainer component={Paper} sx={{ bgcolor: 'grey.50' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Trường</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Giá trị cũ</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Giá trị mới</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {changedFields.map((field, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {field.field}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'error.main' }}>
                      {JSON.stringify(field.oldValue)}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'success.main' }}>
                      {JSON.stringify(field.newValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )
    }

    return null
  }

  return (
    <Box>
      <Card>
        <CardHeader
          title="Lịch sử xếp lịch"
          subheader="Xem lịch sử thay đổi của các buổi học"
        />
        <CardContent>
          {/* Filters */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Tuần học</InputLabel>
                <Select
                  value={selectedWeekId}
                  label="Tuần học"
                  onChange={(e) => {
                    setSelectedWeekId(e.target.value)
                    setPage(0)
                  }}
                  disabled={isWeeksLoading}
                >
                  {isWeeksLoading ? (
                    <MenuItem disabled>Đang tải...</MenuItem>
                  ) : weeks.length === 0 ? (
                    <MenuItem disabled>Không có dữ liệu</MenuItem>
                  ) : (
                    weeks.map((week: WeekResponseDto) => {
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
                                {week.scheduleStatus === 'open' ? 'Mở' :
                                  week.scheduleStatus === 'closed' ? 'Đóng' : 'Chờ duyệt'}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      )
                    })
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Thời gian (1-42)"
                value={selectedScheduleTime}
                onChange={(e) => {
                  const val = e.target.value
                  setSelectedScheduleTime(val ? parseInt(val) : '')
                  setPage(0)
                }}
                InputProps={{ inputProps: { min: 1, max: 42 } }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Khóa học</InputLabel>
                <Select
                  value={selectedCourseId}
                  label="Khóa học"
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value)
                    setSelectedClassId('')
                    setPage(0)
                  }}
                  disabled={isCoursesLoading}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {courses?.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth disabled={!selectedCourseId}>
                <InputLabel>Lớp học</InputLabel>
                <Select
                  value={selectedClassId}
                  label="Lớp học"
                  onChange={(e) => {
                    setSelectedClassId(e.target.value)
                    setPage(0)
                  }}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {selectedCourse?.classes.map((classItem) => (
                    <MenuItem key={classItem.id} value={classItem.id}>
                      {classItem.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="outlined"
                onClick={handleReset}
                startIcon={<i className="ri-refresh-line" />}
              >
                Đặt lại bộ lọc
              </Button>
            </Grid>
          </Grid>

          {/* Loading State */}
          {isAuditLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Error State */}
          {auditError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Lỗi khi tải dữ liệu: {auditError.message}
            </Alert>
          )}

          {/* Table */}
          {!isAuditLoading && !auditError && auditLogs && (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <StyledTableCell width={50}></StyledTableCell>
                      <StyledTableCell>Thao tác</StyledTableCell>
                      <StyledTableCell>Schedule ID</StyledTableCell>
                      <StyledTableCell>Thời gian thay đổi</StyledTableCell>
                      <StyledTableCell>Người thay đổi</StyledTableCell>
                      <StyledTableCell>Schedule Time</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            Không tìm thấy lịch sử thay đổi nào
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedLogs.map((log) => {
                        const scheduleTime = log.newValues?.schedule_time || log.oldValues?.schedule_time

                        return (
                          <>
                            <TableRow
                              key={log.id}
                              hover
                              sx={{ cursor: 'pointer' }}
                              onClick={() => toggleRowExpansion(log.id)}
                            >
                              <TableCell>
                                <IconButton size="small">
                                  <i className={expandedRow === log.id ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'} />
                                </IconButton>
                              </TableCell>
                              <TableCell>
                                <OperationChip
                                  label={log.operation}
                                  size="small"
                                  operation={log.operation}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                  {log.scheduleId.substring(0, 8)}...
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {formatDate(log.changedAt)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={log.changedBy || 'system'}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={scheduleTime || 'N/A'}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              </TableCell>
                            </TableRow>

                            {/* Expanded row */}
                            <TableRow>
                              <TableCell colSpan={6} sx={{ py: 0, border: 0 }}>
                                <Collapse in={expandedRow === log.id} timeout="auto" unmountOnExit>
                                  <Box sx={{ p: 3, bgcolor: 'grey.100' }}>
                                    {renderValuesDiff(log)}
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          </>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={auditLogs.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Số dòng mỗi trang:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default ScheduleHistory

