'use client'

import { useMemo } from 'react'
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Chip,
    Alert
} from '@mui/material'
import { styled } from '@mui/material/styles'

import { useMissingSchedulesList } from '@/@core/hooks/useSchedule'
import { useCourseInfo } from '@/@core/hooks/useCourse'

type CourseClass = {
    id: string
    name: string
    teacher?: {
        name?: string
    }
    autoSchedule?: boolean
}

const StyledHeaderCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 700,
    backgroundColor: theme.palette.grey[100],
    color: theme.palette.text.primary,
    borderBottom: `2px solid ${theme.palette.divider}`,
    fontSize: '0.85rem',
    position: 'sticky',
    top: 0,
    zIndex: 2,
    minWidth: 120,
    textAlign: 'center'
}))

const StyledFirstHeaderCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 700,
    backgroundColor: theme.palette.grey[100],
    color: theme.palette.text.primary,
    borderBottom: `2px solid ${theme.palette.divider}`,
    fontSize: '0.85rem',
    position: 'sticky',
    top: 0,
    left: 0,
    zIndex: 3,
    minWidth: 180
}))

const StudentCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 500,
    backgroundColor: theme.palette.grey[50],
    borderRight: `1px solid ${theme.palette.divider}`,
    position: 'sticky',
    left: 0,
    zIndex: 1
}))

const StatusCell = styled(TableCell)(({ theme }) => ({
    textAlign: 'center',
    borderRight: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1)
}))

interface MissingScheduleTableProps {
    courseId: string
    weekId: string
}

const MissingScheduleTable = ({ courseId, weekId }: MissingScheduleTableProps) => {
    const { data: courseInfo, isLoading: isCourseInfoLoading } = useCourseInfo(courseId, weekId)

    // Get missing schedules for the selected week
    const { data: missingSchedulesData, isLoading: isMissingSchedulesLoading } = useMissingSchedulesList(
        undefined,
        courseId || undefined,
        weekId || undefined
    )

    // Get distinct students from missing schedules
    const students = useMemo(() => {
        if (!missingSchedulesData) return []

        const studentMap = new Map<string, { id: string; fullname: string; email: string }>()

        missingSchedulesData.forEach(schedule => {
            if (!studentMap.has(schedule.profileId)) {
                studentMap.set(schedule.profileId, {
                    id: schedule.profileId,
                    fullname: schedule.fullname,
                    email: schedule.email
                })
            }
        })

        return Array.from(studentMap.values()).sort((a, b) => a.fullname.localeCompare(b.fullname))
    }, [missingSchedulesData])

    // Get official classes (autoSchedule = true)
    const officialClasses: CourseClass[] = useMemo(() => {
        if (!courseInfo?.classes) return []
        return (courseInfo.classes as CourseClass[])
            .filter(cls => cls.autoSchedule !== false)
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [courseInfo])

    // Filter missing schedules to relevant course classes and students
    const filteredMissingSchedules = useMemo(() => {
        if (!missingSchedulesData || !officialClasses.length || !students.length) return []

        const validClassIds = new Set(officialClasses.map(cls => cls.id))
        const validStudentIds = new Set(students.map(student => student.id))

        return missingSchedulesData.filter(schedule => validClassIds.has(schedule.classId) && validStudentIds.has(schedule.profileId))
    }, [missingSchedulesData, officialClasses, students])

    // Build a map: studentId -> classId -> hasMissingSchedule
    const missingScheduleMap = useMemo(() => {
        const map: Record<string, Record<string, boolean>> = {}

        filteredMissingSchedules.forEach(schedule => {
            const studentId = schedule.profileId
            const classId = schedule.classId

            if (!studentId || !classId) return

            if (!map[studentId]) {
                map[studentId] = {}
            }

            // Only count schedules with status: cancelled, changed, on_request_cancel, on_request_change, no_schedule
            const isMissing = ['cancelled', 'changed', 'on_request_cancel', 'on_request_change', 'no_schedule'].includes(
                schedule.scheduleStatus || ''
            )

            if (isMissing) {
                map[studentId][classId] = true
            }
        })

        return map
    }, [filteredMissingSchedules])

    // Calculate statistics
    const statistics = useMemo(() => {
        const classStats: Record<string, { total: number; missing: number }> = {}

        officialClasses.forEach(cls => {
            classStats[cls.id] = { total: students.length, missing: 0 }
        })

        students.forEach(student => {
            officialClasses.forEach(cls => {
                if (missingScheduleMap[student.id]?.[cls.id]) {
                    classStats[cls.id].missing++
                }
            })
        })

        return classStats
    }, [students, officialClasses, missingScheduleMap])

    if (isCourseInfoLoading || isMissingSchedulesLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
            </Box>
        )
    }

    if (!courseInfo) {
        return (
            <Alert severity="error">Không thể tải thông tin khóa học</Alert>
        )
    }

    if (officialClasses.length === 0) {
        return (
            <Alert severity="info">
                Khóa học này chưa có lớp chính thức nào (autoSchedule = true)
            </Alert>
        )
    }

    if (students.length === 0) {
        return (
            <Alert severity="info">Khóa học này chưa có học sinh nào</Alert>
        )
    }

    return (
        <Card>
            <CardHeader
                title="Bảng theo dõi lịch thiếu"
                subheader={
                    <Box display="flex" alignItems="center" gap={2} mt={1}>
                        <Typography variant="body2" color="text.secondary">
                            {courseInfo.name} • {students.length} học sinh • {officialClasses.length} lớp
                        </Typography>
                    </Box>
                }
            />
            <CardContent>
                {/* Legend */}
                <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <Box
                            sx={{
                                width: 20,
                                height: 20,
                                backgroundColor: '#e8f5e8',
                                border: '1px solid #4caf50',
                                borderRadius: 0.5
                            }}
                        />
                        <Typography variant="caption">Đủ lịch</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <Box
                            sx={{
                                width: 20,
                                height: 20,
                                backgroundColor: '#ffebee',
                                border: '1px solid #f44336',
                                borderRadius: 0.5
                            }}
                        />
                        <Typography variant="caption">Thiếu lịch</Typography>
                    </Box>
                </Box>

                <TableContainer
                    component={Paper}
                    sx={{
                        borderRadius: 2,
                        maxHeight: '70vh',
                        overflow: 'auto'
                    }}
                >
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <StyledFirstHeaderCell>Học sinh</StyledFirstHeaderCell>
                                {officialClasses.map(cls => (
                                    <StyledHeaderCell key={cls.id}>
                                        <Box>
                                            <Typography variant="body2" fontWeight={700}>
                                                {cls.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                GV: {cls.teacher?.name || 'N/A'}
                                            </Typography>
                                            {statistics[cls.id] && (
                                                <Box mt={0.5}>
                                                    <Chip
                                                        size="small"
                                                        label={`${statistics[cls.id].missing}/${statistics[cls.id].total} thiếu`}
                                                        color={statistics[cls.id].missing > 0 ? 'error' : 'success'}
                                                        variant="outlined"
                                                        sx={{ fontSize: '0.7rem', height: 20 }}
                                                    />
                                                </Box>
                                            )}
                                        </Box>
                                    </StyledHeaderCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {students.map(student => (
                                <TableRow key={student.id} hover>
                                    <StudentCell>
                                        <Box>
                                            <Typography variant="body2" fontWeight={500}>
                                                {student.fullname}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {student.email}
                                            </Typography>
                                        </Box>
                                    </StudentCell>
                                    {officialClasses.map(cls => {
                                        const hasMissing = !!missingScheduleMap[student.id]?.[cls.id]

                                        return (
                                            <StatusCell
                                                key={`${student.id}-${cls.id}`}
                                                sx={{
                                                    backgroundColor: hasMissing ? '#ffebee' : '#e8f5e8',
                                                    border: hasMissing ? '1px solid #f44336' : '1px solid #4caf50'
                                                }}
                                            >
                                                {hasMissing ? (
                                                    <Box display="flex" justifyContent="center" alignItems="center">
                                                        <i
                                                            className="ri-close-line"
                                                            style={{ fontSize: '20px', color: '#f44336', fontWeight: 700 }}
                                                        />
                                                    </Box>
                                                ) : (
                                                    <Box display="flex" justifyContent="center" alignItems="center">
                                                        <i
                                                            className="ri-check-line"
                                                            style={{ fontSize: '20px', color: '#4caf50', fontWeight: 700 }}
                                                        />
                                                    </Box>
                                                )}
                                            </StatusCell>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    )
}

export default MissingScheduleTable

