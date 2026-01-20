'use client'

import { useState, useMemo } from 'react'
import {
    Card,
    CardHeader,
    CardContent,
    Typography,
    Grid,
    TextField,
    InputAdornment,
    TableContainer,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Chip,
    IconButton,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Box,
    Alert
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { format } from 'date-fns'

import { useSearchSchedule, useGetScheduleInfoByField, SCHEDULE_TIME, formatScheduleTimeWithDate, RollcallStatus, useUpdateRollcallStatus } from '@/@core/hooks/useSchedule'
import { useGetWeeks } from '@/@core/hooks/useWeek'
import useDebounce from '@/@core/hooks/useDebounce'
// ScheduleDetailPopup removed


// Styled Components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 600,
    backgroundColor: theme.palette.grey[50],
    textTransform: 'uppercase',
    fontSize: '0.75rem',
    letterSpacing: '0.5px'
}))

const StatusChip = styled(Chip)<{ status: string }>(({ status }) => {
    const statusMap: Record<string, { color: string, bg: string, border: string }> = {
        'attending': { color: '#2e7d32', bg: '#e8f5e8', border: '#a5d6a7' },
        'absent_without_reason': { color: '#c62828', bg: '#ffebee', border: '#ef9a9a' },
        'absent_with_reason': { color: '#ef6c00', bg: '#fff3e0', border: '#ffcc80' },
        'not_rollcall': { color: '#616161', bg: '#f5f5f5', border: '#e0e0e0' },
    }

    const style = statusMap[status] || statusMap['not_rollcall']

    return {
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontWeight: 600,
        fontSize: '0.75rem',
        height: '24px'
    }
})

const AttendanceView = () => {
    // States
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedWeekId, setSelectedWeekId] = useState<string>('')
    const [selectedScheduleTime, setSelectedScheduleTime] = useState<number | undefined>(undefined)

    // Debounce search
    const debouncedSearch = useDebounce(searchTerm, 500)

    // Hooks
    const { data: weeks } = useGetWeeks()
    const { data: searchResults, isLoading } = useSearchSchedule(debouncedSearch, selectedWeekId, selectedScheduleTime)

    // Handlers
    const updateRollcallMutation = useUpdateRollcallStatus()

    // Query client to invalidate queries after update
    const { refetch: refetchSearch } = useSearchSchedule(debouncedSearch, selectedWeekId, selectedScheduleTime)

    // Format schedule time display
    const getScheduleTimeDisplay = (timeIndex: number) => {
        if (timeIndex > 0 && timeIndex <= SCHEDULE_TIME.length) {
            return SCHEDULE_TIME[timeIndex - 1]
        }
        return `Ca ${timeIndex}`
    }

    const handleAttendanceChange = async (scheduleId: string, isAttending: boolean) => {
        try {
            await updateRollcallMutation.mutateAsync([{
                scheduleId,
                rollcallStatus: isAttending ? RollcallStatus.ATTENDING : RollcallStatus.NOT_ROLLCALL,
                reason: isAttending ? '' : undefined // Clear reason if attending
            }])
            refetchSearch()
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }

    const handleStatusChange = async (scheduleId: string, status: RollcallStatus) => {
        try {
            await updateRollcallMutation.mutateAsync([{
                scheduleId,
                rollcallStatus: status
            }])
            refetchSearch()
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }

    const handleReasonChange = async (scheduleId: string, currentStatus: string, newReason: string) => {
        try {
            await updateRollcallMutation.mutateAsync([{
                scheduleId,
                rollcallStatus: currentStatus as RollcallStatus,
                reason: newReason
            }])
            refetchSearch() // Or rely on local state/react-query cache update if tailored
        } catch (error) {
            console.error('Error updating reason:', error)
        }
    }

    return (
        <Card>
            <CardHeader
                title="Điểm danh học sinh"
                subheader="Tìm kiếm và thực hiện điểm danh cho học sinh"
                avatar={
                    <Box sx={{
                        width: 40, height: 40,
                        bgcolor: 'primary.main',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <i className="ri-checkbox-circle-line" style={{ color: 'white', fontSize: 20 }} />
                    </Box>
                }
            />

            <CardContent>
                {/* Filters */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Tìm kiếm"
                            placeholder="Nhập tên học sinh, email hoặc tên khóa học..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <i className="ri-search-line" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Tuần học</InputLabel>
                            <Select
                                value={selectedWeekId}
                                label="Tuần học"
                                onChange={(e) => setSelectedWeekId(e.target.value)}
                            >
                                <MenuItem value="">Tất cả các tuần</MenuItem>
                                {weeks?.map((week) => {
                                    const startDate = new Date(week.startDate)
                                    const endDate = new Date(startDate)
                                    endDate.setDate(endDate.getDate() + 6)

                                    return (
                                        <MenuItem key={week.id} value={week.id}>
                                            {format(startDate, 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}
                                        </MenuItem>
                                    )
                                })}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Ca học</InputLabel>
                            <Select
                                value={selectedScheduleTime}
                                label="Ca học"
                                onChange={(e) => setSelectedScheduleTime(e.target.value === '' ? undefined : Number(e.target.value))}
                            >
                                <MenuItem value="">Tất cả các ca</MenuItem>
                                {SCHEDULE_TIME.map((time, index) => (
                                    <MenuItem key={index} value={index + 1}>
                                        {time}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                {/* Results */}
                {isLoading ? (
                    <Box display="flex" justifyContent="center" py={5}>
                        <CircularProgress />
                    </Box>
                ) : !searchResults || searchResults.length === 0 ? (
                    <Box textAlign="center" py={5} sx={{ color: 'text.secondary' }}>
                        <i className="ri-calendar-line" style={{ fontSize: 48, marginBottom: 8, display: 'block' }} />
                        <Typography>
                            {searchTerm || selectedWeekId
                                ? 'Không tìm thấy kết quả nào phù hợp'
                                : 'Nhập từ khóa hoặc chọn tuần để tìm kiếm lịch học'}
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <StyledTableCell>Học sinh</StyledTableCell>
                                    <StyledTableCell>Lớp / Khóa học</StyledTableCell>
                                    <StyledTableCell>Thời gian</StyledTableCell>
                                    <StyledTableCell>Buổi</StyledTableCell>
                                    <StyledTableCell align="center">Điểm danh</StyledTableCell>
                                    <StyledTableCell>Lý do</StyledTableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {searchResults.map((schedule) => {
                                    const isAttending = schedule.rollcallStatus === RollcallStatus.ATTENDING
                                    return (
                                        <TableRow key={schedule.scheduleId} hover>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {schedule.profileFullname}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {schedule.profileEmail}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {schedule.className} {schedule.teacherName ? `- ${schedule.teacherName}` : ''}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {schedule.courseName}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                                    {getScheduleTimeDisplay(schedule.scheduleTime)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={`Buổi ${schedule.lesson}`} size="small" variant="outlined" />
                                            </TableCell>
                                            <TableCell align="center" sx={{ minWidth: 200 }}>
                                                <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            cursor: 'pointer',
                                                            border: isAttending ? '1px solid #2e7d32' : '1px solid #e0e0e0',
                                                            borderRadius: '8px',
                                                            px: 1.5,
                                                            py: 0.5,
                                                            bgcolor: isAttending ? '#e8f5e8' : 'transparent',
                                                            transition: 'all 0.2s',
                                                            '&:hover': { bgcolor: isAttending ? '#c8e6c9' : '#f5f5f5' }
                                                        }}
                                                        onClick={() => handleAttendanceChange(schedule.scheduleId, !isAttending)}
                                                    >
                                                        <i
                                                            className={isAttending ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'}
                                                            style={{
                                                                fontSize: 20,
                                                                color: isAttending ? '#2e7d32' : '#757575',
                                                                marginRight: 8
                                                            }}
                                                        />
                                                        <Typography
                                                            variant="body2"
                                                            color={isAttending ? 'success.main' : 'text.primary'}
                                                            fontWeight={isAttending ? 600 : 400}
                                                        >
                                                            Có mặt
                                                        </Typography>
                                                    </Box>

                                                    {!isAttending && (
                                                        <Select
                                                            size="small"
                                                            value={schedule.rollcallStatus}
                                                            onChange={(e) => handleStatusChange(schedule.scheduleId, e.target.value as RollcallStatus)}
                                                            sx={{ minWidth: 150, '.MuiSelect-select': { py: 0.75, fontSize: '0.875rem' } }}
                                                            displayEmpty
                                                        >
                                                            <MenuItem value={RollcallStatus.NOT_ROLLCALL}>Chưa điểm danh</MenuItem>
                                                            <MenuItem value={RollcallStatus.ABSENT_WITH_REASON}>Vắng có phép</MenuItem>
                                                            <MenuItem value={RollcallStatus.ABSENT_WITHOUT_REASON}>Vắng không phép</MenuItem>
                                                            <MenuItem value={RollcallStatus.ABSENT_WITH_LATE_REASON}>Vắng báo muộn</MenuItem>
                                                            <MenuItem value={RollcallStatus.TRIAL}>Học thử</MenuItem>
                                                            <MenuItem value={RollcallStatus.RETAKE}>Học lại</MenuItem>
                                                        </Select>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ minWidth: 200 }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    placeholder="Nhập lý do..."
                                                    defaultValue={schedule.reason || ''}
                                                    onBlur={(e) => {
                                                        const newVal = e.target.value
                                                        if (newVal !== (schedule.reason || '')) {
                                                            handleReasonChange(schedule.scheduleId, schedule.rollcallStatus, newVal)
                                                        }
                                                    }}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            bgcolor: 'white',
                                                            '& fieldset': {
                                                                borderColor: 'transparent', // borderless unless focused/hovered if desired, or keep as is
                                                            },
                                                            '&:hover fieldset': {
                                                                borderColor: '#e0e0e0',
                                                            },
                                                            '&.Mui-focused fieldset': {
                                                                borderColor: 'primary.main',
                                                            },
                                                        }
                                                    }}
                                                    InputProps={{
                                                        sx: { fontSize: '0.875rem', bgcolor: '#f5f5f5', borderRadius: 2 }
                                                    }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </CardContent>
        </Card>
    )
}

export default AttendanceView
