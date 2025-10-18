'use client'

import { useState, useEffect } from 'react'

import {
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
    Divider,
    Typography,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material'
import { styled } from '@mui/material/styles'

import { ScheduleStatus, useMissingSchedulesList, MissingSchedulesDto, SCHEDULE_TIME } from '@/@core/hooks/useSchedule'

const StyledCard = styled(Card)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    '&:last-child': {
        marginBottom: 0
    }
}))

const StatusChip = styled(Chip)(({ theme, status }: { theme: any; status: string }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'cancelled':
                return { color: 'error', bgcolor: '#ffebee', borderColor: '#ffcdd2' }
            case 'changed':
                return { color: 'warning', bgcolor: '#fff3e0', borderColor: '#ffcc02' }
            case 'on_request_cancel':
                return { color: 'info', bgcolor: '#e3f2fd', borderColor: '#bbdefb' }
            case 'on_request_change':
                return { color: 'secondary', bgcolor: '#f3e5f5', borderColor: '#ce93d8' }
            default:
                return { color: 'default', bgcolor: '#f5f5f5', borderColor: '#e0e0e0' }
        }
    }

    const colors = getStatusColor(status)

    return {
        backgroundColor: colors.bgcolor,
        color: colors.color === 'error' ? '#c62828' :
            colors.color === 'warning' ? '#f57c00' :
                colors.color === 'info' ? '#1976d2' :
                    colors.color === 'secondary' ? '#7b1fa2' : '#424242',
        border: `1px solid ${colors.borderColor}`,
        fontWeight: 600,
        fontSize: '0.75rem',
        height: '24px'
    }
})

interface StudentSchedulePopupProps {
    open: boolean
    onClose: () => void
    studentId: string
    studentName: string
    weekId?: string
}

const StudentSchedulePopup = ({
    open,
    onClose,
    studentId,
    studentName,
    weekId = "08a60c9a-b3f8-42f8-8ff8-c7015d4ef3e7"
}: StudentSchedulePopupProps) => {
    const [selectedStatus, setSelectedStatus] = useState<ScheduleStatus | null>(null)

    // Get missing schedules for this student
    const { data: missingSchedules, isLoading } = useMissingSchedulesList(studentId)

    // Group schedules by week and status
    const groupSchedulesByWeek = () => {
        if (!missingSchedules) return {}

        const grouped: { [weekId: string]: { [status: string]: MissingSchedulesDto[] } } = {}

        missingSchedules.forEach(schedule => {
            const weekId = schedule.weekId
            const status = schedule.scheduleStatus || 'unknown'

            if (!grouped[weekId]) {
                grouped[weekId] = {}
            }
            if (!grouped[weekId][status]) {
                grouped[weekId][status] = []
            }
            grouped[weekId][status].push(schedule)
        })

        return grouped
    }

    const groupedSchedules = groupSchedulesByWeek()
    const weekIds = Object.keys(groupedSchedules).sort()

    const totalSchedules = missingSchedules?.length || 0

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'cancelled':
                return 'Đã hủy'
            case 'changed':
                return 'Đã thay đổi'
            case 'on_request_cancel':
                return 'Yêu cầu hủy'
            case 'on_request_change':
                return 'Yêu cầu thay đổi'
            default:
                return status
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'cancelled':
                return 'ri-close-circle-line'
            case 'changed':
                return 'ri-edit-circle-line'
            case 'on_request_cancel':
                return 'ri-time-line'
            case 'on_request_change':
                return 'ri-time-line'
            default:
                return 'ri-information-line'
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Helper function to get schedule time info from scheduleTime index
    const getScheduleTimeInfo = (scheduleTime: number) => {
        if (scheduleTime < 1 || scheduleTime > SCHEDULE_TIME.length) {
            return null
        }
        const scheduleString = SCHEDULE_TIME[scheduleTime - 1]
        const [timeRange, dayName] = scheduleString.split(' ')

        // Map English day names to Vietnamese
        const dayMap: { [key: string]: string } = {
            'Monday': 'Thứ 2',
            'Tuesday': 'Thứ 3',
            'Wednesday': 'Thứ 4',
            'Thursday': 'Thứ 5',
            'Friday': 'Thứ 6',
            'Saturday': 'Thứ 7',
            'Sunday': 'Chủ nhật'
        }

        return {
            timeRange,
            dayName: dayMap[dayName] || dayName,
            englishDay: dayName
        }
    }

    // Helper function to calculate exact date from week start date and day
    const calculateExactDate = (weekStartDate: string, dayName: string) => {
        const startDate = new Date(weekStartDate)
        const dayMap: { [key: string]: number } = {
            'Monday': 1,
            'Tuesday': 2,
            'Wednesday': 3,
            'Thursday': 4,
            'Friday': 5,
            'Saturday': 6,
            'Sunday': 0
        }

        const targetDay = dayMap[dayName]
        const currentDay = startDate.getDay()

        // Calculate days to add (convert Sunday from 0 to 7 for easier calculation)
        const currentDayAdjusted = currentDay === 0 ? 7 : currentDay
        const targetDayAdjusted = targetDay === 0 ? 7 : targetDay

        let daysToAdd = targetDayAdjusted - currentDayAdjusted
        if (daysToAdd < 0) {
            daysToAdd += 7
        }

        const exactDate = new Date(startDate)
        exactDate.setDate(startDate.getDate() + daysToAdd)

        return exactDate.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const renderScheduleList = (schedules: MissingSchedulesDto[], status: string, title: string) => {
        if (schedules.length === 0) return null

        return (
            <StyledCard>
                <CardHeader
                    title={
                        <Box display="flex" alignItems="center" gap={1}>
                            <i className={getStatusIcon(status)} style={{ color: '#666' }} />
                            <Typography variant="h6">{title}</Typography>
                            <Chip label={schedules.length} size="small" color="default" />
                        </Box>
                    }
                />
                <CardContent sx={{ pt: 0 }}>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Lớp</TableCell>
                                    <TableCell>Khóa học</TableCell>
                                    <TableCell>Trạng thái</TableCell>
                                    <TableCell>Thời gian</TableCell>
                                    <TableCell>Ghi chú</TableCell>
                                    <TableCell>Lớp bù</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {schedules.map((schedule, index) => (
                                    <TableRow key={`${schedule.scheduleId || schedule.classId}-${index}`} hover>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {schedule.className}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {schedule.classType}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {schedule.courseName}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <StatusChip
                                                status={schedule.scheduleStatus || status}
                                                label={getStatusLabel(schedule.scheduleStatus || status)}
                                                theme={undefined}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box>
                                                {schedule.scheduleTime ? (
                                                    <>
                                                        {(() => {
                                                            const scheduleInfo = getScheduleTimeInfo(schedule.scheduleTime)
                                                            if (!scheduleInfo) return null

                                                            return (
                                                                <>
                                                                    <Typography variant="body2" fontWeight={500}>
                                                                        {scheduleInfo.dayName} - {scheduleInfo.timeRange}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {calculateExactDate(schedule.startDate, scheduleInfo.englishDay)}
                                                                    </Typography>
                                                                </>
                                                            )
                                                        })()}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Typography variant="body2">
                                                            {schedule.startDate}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Chưa có thông tin khung giờ
                                                        </Typography>
                                                    </>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {schedule.reasonStatus || 'Không có ghi chú'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {schedule.replaceSchedule ? (
                                                <Box sx={{
                                                    p: 1,
                                                    backgroundColor: '#e8f5e8',
                                                    borderRadius: 1,
                                                    border: '1px solid #c8e6c9'
                                                }}>
                                                    <Typography variant="caption" color="success.main" display="block" fontWeight={600}>
                                                        <i className="ri-calendar-check-line" style={{ marginRight: 4 }} />
                                                        Lớp bù:
                                                    </Typography>
                                                    {schedule.replaceSchedule.scheduleTime ? (
                                                        <>
                                                            {(() => {
                                                                const replaceScheduleInfo = getScheduleTimeInfo(schedule.replaceSchedule.scheduleTime)
                                                                if (!replaceScheduleInfo) return null

                                                                return (
                                                                    <>
                                                                        <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                                                                            {replaceScheduleInfo.dayName} - {replaceScheduleInfo.timeRange}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {calculateExactDate(schedule.replaceSchedule.startDate, replaceScheduleInfo.englishDay)}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            Slot: {schedule.replaceSchedule.scheduleTime}
                                                                        </Typography>
                                                                    </>
                                                                )
                                                            })()}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                                                                {schedule.replaceSchedule.startDate}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Chưa có thông tin khung giờ
                                                            </Typography>
                                                        </>
                                                    )}
                                                </Box>
                                            ) : (
                                                <Box sx={{
                                                    p: 1,
                                                    backgroundColor: '#fff3e0',
                                                    borderRadius: 1,
                                                    border: '1px solid #ffcc02'
                                                }}>
                                                    <Typography variant="caption" color="warning.main" display="block" fontWeight={600}>
                                                        <i className="ri-time-line" style={{ marginRight: 4 }} />
                                                        Chưa có lớp bù
                                                    </Typography>
                                                </Box>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </StyledCard>
        )
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { minHeight: '60vh' }
            }}
        >
            <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography variant="h5" gutterBottom>
                            Lịch học bị thay đổi
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Học sinh: <strong>{studentName}</strong>
                        </Typography>
                    </Box>
                    <Box display="flex" gap={1}>
                        <Chip
                            label={`Tổng: ${totalSchedules} lịch`}
                            color="primary"
                            variant="outlined"
                        />
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {isLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                        <Box textAlign="center">
                            <CircularProgress />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                Đang tải dữ liệu...
                            </Typography>
                        </Box>
                    </Box>
                ) : totalSchedules === 0 ? (
                    <Box textAlign="center" py={4}>
                        <i className="ri-calendar-check-line" style={{ fontSize: '48px', color: '#4caf50' }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                            Không có lịch học bị thay đổi
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Học sinh này chưa có lịch học nào bị hủy hoặc thay đổi.
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        {/* Summary */}
                        <Alert severity="info" sx={{ mb: 3 }}>
                            <Typography variant="body2">
                                <strong>Tổng kết:</strong> Học sinh {studentName} có {totalSchedules} lịch học bị thay đổi,
                                được phân bổ trong {weekIds.length} tuần học khác nhau.
                                Thông tin lớp bù được hiển thị trong cột "Lớp bù" cho tất cả các lịch.
                            </Typography>
                        </Alert>

                        {/* Render schedules grouped by week */}
                        {weekIds.map((weekId) => {
                            const weekSchedules = groupedSchedules[weekId]
                            const weekTotal = Object.values(weekSchedules).flat().length

                            // Get week start date from first schedule in this week
                            const firstSchedule = Object.values(weekSchedules).flat()[0]
                            const weekStartDate = firstSchedule?.startDate || weekId

                            return (
                                <Box key={weekId} sx={{ mb: 4 }}>
                                    {/* Week Header */}
                                    <Box sx={{
                                        p: 2,
                                        backgroundColor: '#f5f5f5',
                                        borderRadius: 2,
                                        border: '1px solid #e0e0e0',
                                        mb: 2
                                    }}>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <i className="ri-calendar-line" style={{ color: '#1976d2', fontSize: '20px' }} />
                                            <Box>
                                                <Typography variant="h6" fontWeight={600}>
                                                    Tuần học
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {new Date(weekStartDate).toLocaleDateString('vi-VN', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    })} - {weekTotal} lịch học
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Cancelled Schedules */}
                                    {weekSchedules['cancelled'] && renderScheduleList(weekSchedules['cancelled'], 'cancelled', 'Lịch đã hủy')}

                                    {/* Changed Schedules */}
                                    {weekSchedules['changed'] && renderScheduleList(weekSchedules['changed'], 'changed', 'Lịch đã thay đổi')}

                                    {/* On Request Cancel Schedules */}
                                    {weekSchedules['on_request_cancel'] && renderScheduleList(weekSchedules['on_request_cancel'], 'on_request_cancel', 'Yêu cầu hủy')}

                                    {/* On Request Change Schedules */}
                                    {weekSchedules['on_request_change'] && renderScheduleList(weekSchedules['on_request_change'], 'on_request_change', 'Yêu cầu thay đổi')}
                                </Box>
                            )
                        })}
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} color="inherit">
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default StudentSchedulePopup
