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
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material'

// Hooks
import { useGetScheduleInfoByField, formatScheduleTimeWithDate } from '@/@core/hooks/useSchedule'
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

const ScheduleChanges = () => {
    const [selectedWeekId, setSelectedWeekId] = useState<string>('')
    const [classFilter, setClassFilter] = useState<string | null>(null)

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

    // Get selected week info
    const selectedWeekInfo = useMemo(() => {
        if (!selectedWeekId || !weeks) return null
        return weeks.find(week => week.id === selectedWeekId) || null
    }, [weeks, selectedWeekId])

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

    // Fetch schedule info with teacherNote = true
    const {
        data: scheduleChanges,
        isLoading: isScheduleChangesLoading,
        error: scheduleChangesError
    } = useGetScheduleInfoByField({
        teacherNote: true,
        weekId: selectedWeekId || undefined
    })

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    // Calculate end date for a week (startDate + 6 days)
    const calculateEndDate = (startDate: Date): Date => {
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 6) // Add 6 days to get the end of the week
        return endDate
    }

    // Get unique class names from schedule changes
    const getAllClassNames = () => {
        if (!scheduleChanges) return []
        const uniqueClassNames = Array.from(
            new Set(scheduleChanges.map(item => item.className).filter(Boolean))
        ).sort()
        return uniqueClassNames
    }

    // Filter schedule changes by class name
    const filteredScheduleChanges = useMemo(() => {
        if (!scheduleChanges) return []
        if (!classFilter) return scheduleChanges
        return scheduleChanges.filter(item => item.className === classFilter)
    }, [scheduleChanges, classFilter])

    const formatTimeRange = (startTime?: string, endTime?: string, scheduleTime?: number) => {
        // If scheduleTime is provided, use it to format with date
        if (scheduleTime !== undefined && selectedWeekInfo?.startDate) {
            return formatScheduleTimeWithDate(scheduleTime, selectedWeekInfo.startDate)
        }

        // Fallback to startTime/endTime if available
        if (startTime || endTime) {
            return `${startTime || '—'} - ${endTime || '—'}`
        }

        return '—'
    }

    return (
        <Box>
            <Card sx={{ mb: 4 }}>
                <CardHeader
                    title="Biến động ca học"
                    subheader="Danh sách các buổi học có ghi chú từ giáo viên"
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

                        {/* Class Name Filter */}
                        <Autocomplete
                            options={getAllClassNames()}
                            value={classFilter}
                            onChange={(event, newValue) => setClassFilter(newValue || null)}
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

                    {/* Table */}
                    {isWeeksLoading || isScheduleChangesLoading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                            <CircularProgress />
                        </Box>
                    ) : weeksError ? (
                        <Alert severity="error">Lỗi tải danh sách tuần: {weeksError.message}</Alert>
                    ) : !selectedWeekId ? (
                        <Alert severity="warning">Vui lòng chọn tuần học để xem biến động ca học.</Alert>
                    ) : scheduleChangesError ? (
                        <Alert severity="error">Lỗi tải danh sách biến động ca học: {scheduleChangesError.message}</Alert>
                    ) : filteredScheduleChanges.length > 0 ? (
                        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <StyledHeaderCell>Giáo viên</StyledHeaderCell>
                                        <StyledHeaderCell>Lớp</StyledHeaderCell>
                                        <StyledHeaderCell>Kỹ năng</StyledHeaderCell>
                                        <StyledHeaderCell>Buổi</StyledHeaderCell>
                                        <StyledHeaderCell>Thời gian</StyledHeaderCell>
                                        <StyledHeaderCell>Biến động ca học</StyledHeaderCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredScheduleChanges.map((item) => (
                                        <TableRow key={item.id}>
                                            <StyledTableCell>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                                                        {getInitials(item.teacherName || 'N/A')}
                                                    </Avatar>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {item.teacherName || '—'}
                                                    </Typography>
                                                </Box>
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Typography variant="body2">
                                                    {item.className || '—'}
                                                </Typography>
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Typography variant="body2">
                                                    {item.courseName || '—'}
                                                </Typography>
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Typography variant="body2">
                                                    Buổi {item.lesson}
                                                </Typography>
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                                    {formatTimeRange(item.startTime, item.endTime, item.scheduleTime)}
                                                </Typography>
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Typography variant="body2" color="primary" fontWeight={500}>
                                                    {item.teacherNote || '—'}
                                                </Typography>
                                            </StyledTableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Alert severity="info">Không có biến động ca học nào trong tuần này.</Alert>
                    )}
                </CardContent>
            </Card>
        </Box>
    )
}

export default ScheduleChanges

