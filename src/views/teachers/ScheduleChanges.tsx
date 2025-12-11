'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// Styled Components
import { styled } from '@mui/material/styles'

// MUI Imports
import {
    Alert,
    Avatar,
    Button,
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
    Typography
} from '@mui/material'

// Hooks
import { useGetScheduleInfoByField, formatScheduleTimeWithDate, SCHEDULE_TIME } from '@/@core/hooks/useSchedule'
import { useGetWeeks, ScheduleStatus as WeekStatus, WeekResponseDto } from '@/@core/hooks/useWeek'
import { RegionId, RegionLabel } from '@/@core/hooks/useCourse'

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
    const [selectedRegion, setSelectedRegion] = useState<number>(RegionId.HALONG)
    const [dateFilter, setDateFilter] = useState<string | null>(null)
    const [isExporting, setIsExporting] = useState<boolean>(false)

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
        weekId: selectedWeekId || undefined,
        region: selectedRegion
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

    // Map scheduleTime to the concrete date (YYYY-MM-DD) of that slot in the selected week
    const getDateForScheduleTime = (scheduleTime?: number) => {
        if (!scheduleTime || !selectedWeekInfo?.startDate) return null

        const scheduleStr = SCHEDULE_TIME[scheduleTime - 1]
        if (!scheduleStr) return null

        const [, dayName] = scheduleStr.split(' ')
        const dayOffsetMap: Record<string, number> = {
            Monday: 0,
            Tuesday: 1,
            Wednesday: 2,
            Thursday: 3,
            Friday: 4,
            Saturday: 5,
            Sunday: 6
        }
        if (dayName === undefined || dayOffsetMap[dayName] === undefined) return null

        const startDate = new Date(selectedWeekInfo.startDate)

        // Normalize startDate to Monday of that week to align with scheduleTime
        const startDayOfWeek = startDate.getDay() // 0 (Sun) - 6 (Sat)
        const daysToMonday = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1
        startDate.setDate(startDate.getDate() - daysToMonday)

        const targetDate = new Date(startDate)
        targetDate.setDate(startDate.getDate() + dayOffsetMap[dayName])

        return targetDate.toISOString().split('T')[0]
    }

    // Build date filter options based on available schedule times
    const dateOptions = useMemo(() => {
        if (!scheduleChanges) return []

        const dateSet = new Set<string>()
        scheduleChanges.forEach(item => {
            const dateStr = getDateForScheduleTime(item.scheduleTime)
            if (dateStr) {
                dateSet.add(dateStr)
            }
        })

        return Array.from(dateSet)
            .sort()
            .map(dateStr => ({
                value: dateStr,
                label: new Date(dateStr).toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                })
            }))
    }, [scheduleChanges, selectedWeekInfo])

    // Filter schedule changes by date, then sort by scheduleTime
    const filteredScheduleChanges = useMemo(() => {
        if (!scheduleChanges) return []

        let result = scheduleChanges

        if (dateFilter) {
            result = result.filter(item => getDateForScheduleTime(item.scheduleTime) === dateFilter)
        }

        return [...result].sort((a, b) => {
            const timeA = a.scheduleTime ?? Number.MAX_SAFE_INTEGER
            const timeB = b.scheduleTime ?? Number.MAX_SAFE_INTEGER
            return timeA - timeB
        })
    }, [scheduleChanges, dateFilter, selectedWeekInfo])

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

    const handleExport = async () => {
        if (!selectedWeekId) return
        if (!filteredScheduleChanges.length) {
            alert('Không có dữ liệu để xuất.')
            return
        }

        try {
            setIsExporting(true)
            const headers = ['Giáo viên', 'Lớp', 'Kỹ năng', 'Buổi', 'Thời gian', 'Biến động ca học']

            const rows = filteredScheduleChanges.map(item => {
                const teacher = item.teacherName || ''
                const className = item.className || ''
                const courseName = item.courseName || ''
                const lesson = item.lesson ? `Buổi ${item.lesson}` : ''
                const time = formatTimeRange(item.startTime, item.endTime, item.scheduleTime).replace(/\n/g, ' ')
                const note = item.teacherNote || ''

                return [teacher, className, courseName, lesson, time, note]
            })

            const csvContent = [
                '\uFEFF', // BOM for Excel UTF-8
                headers.join(','),
                ...rows.map(row =>
                    row
                        .map(value => {
                            const v = value ?? ''
                            // Escape double quotes by doubling them
                            const escaped = String(v).replace(/"/g, '""')
                            return `"${escaped}"`
                        })
                        .join(',')
                )
            ].join('\n')

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `schedule-info-${selectedWeekId}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Export schedule info error:', error)
            alert('Xuất file thất bại, vui lòng thử lại.')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Box>
            <Card sx={{ mb: 4 }}>
                <CardHeader
                    title="Biến động ca học"
                    subheader="Danh sách các buổi học có ghi chú từ giáo viên"
                    action={
                        <Button
                            variant="outlined"
                            startIcon={<i className="ri-download-2-line" />}
                            onClick={handleExport}
                            disabled={!selectedWeekId || isExporting || isWeeksLoading}
                        >
                            {isExporting ? 'Đang xuất...' : 'Xuất CSV'}
                        </Button>
                    }
                />
                <CardContent>
                    {/* Filter Section */}
                    <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Region Selection */}
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Khu vực</InputLabel>
                            <Select
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(Number(e.target.value))}
                                label="Khu vực"
                            >
                                {(Object.values(RegionId).filter((v): v is RegionId => typeof v === 'number')).map((id) => (
                                    <MenuItem key={id} value={id}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <i className="ri-map-pin-line" />
                                            <span>{RegionLabel[id]}</span>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

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

                        {/* Date Filter (styled like week selection) */}
                        <FormControl size="small" sx={{ minWidth: 250 }}>
                            <InputLabel>Ngày</InputLabel>
                            <Select
                                value={dateFilter || ''}
                                onChange={(e) => setDateFilter(e.target.value ? String(e.target.value) : null)}
                                label="Ngày"
                                displayEmpty
                            >
                                <MenuItem value="">
                                    <em>Tất cả ngày</em>
                                </MenuItem>
                                {dateOptions.length === 0 ? (
                                    <MenuItem disabled>Không có ngày phù hợp</MenuItem>
                                ) : (
                                    dateOptions.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))
                                )}
                            </Select>
                        </FormControl>
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

