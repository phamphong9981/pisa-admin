'use client'

// React Imports
import { useMemo, useState } from 'react'

// MUI Imports
import {
    Alert,
    Box,
    Card,
    CardContent,
    CardHeader,
    Chip,
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
    Tooltip,
    Typography
} from '@mui/material'
import { styled } from '@mui/material/styles'

// Hooks
import { RollcallStatus, SCHEDULE_TIME, useGetAllSchedule } from '@/@core/hooks/useSchedule'
import { useGetWeeks, WeekResponseDto, ScheduleStatus as WeekStatus } from '@/@core/hooks/useWeek'
import { RegionId } from '@/@core/hooks/useCourse'
import useAuth from '@/@core/hooks/useAuth'


// Region color mapping
const REGION_COLORS: Record<number, string> = {
    [RegionId.HALONG]: '#f6b26b',
    [RegionId.BAICHAY]: '#24cdb4',
    [RegionId.CAMPHA]: '#8e7cc3',
    [RegionId.UONGBI]: '#91e9b2',
    [RegionId.HAIDUONG]: '#4caf50'
}

const getRegionColor = (region?: number): string => {
    if (!region || !REGION_COLORS[region]) {
        return '#e3f2fd' // Default blue color
    }
    return REGION_COLORS[region]
}

const TeachingInfo = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'region'
})<{ region?: number }>(({ theme, region }) => {
    const regionColor = getRegionColor(region)
    const isLightColor = region && REGION_COLORS[region]

    return {
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid ${isLightColor ? regionColor : '#e0e0e0'}`,
        backgroundColor: '#fff',
        marginBottom: theme.spacing(0.5),
        '&:last-child': {
            marginBottom: 0
        },
        '& .lesson-header': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: theme.spacing(0.5, 0.75),
            backgroundColor: isLightColor ? regionColor : '#e3f2fd',
            borderBottom: `1px solid ${isLightColor ? regionColor : '#bbdefb'}`,
            '& .class-name': {
                fontSize: '0.7rem',
                fontWeight: 600,
                color: isLightColor ? '#fff' : '#1976d2',
                lineHeight: 1.2,
                flex: 1,
                marginRight: theme.spacing(0.5),
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0
            },
            '& .lesson-badge': {
                fontSize: '0.6rem',
                color: isLightColor ? '#fff' : '#1976d2',
                backgroundColor: isLightColor ? 'rgba(255, 255, 255, 0.3)' : '#fff',
                padding: '2px 6px',
                borderRadius: '6px',
                border: `1px solid ${isLightColor ? 'rgba(255, 255, 255, 0.5)' : '#bbdefb'}`,
                fontWeight: 600
            }
        },
        '& .lesson-note': {
            padding: theme.spacing(0.5, 0.75),
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid #e0e0e0',
            fontSize: '0.65rem',
            color: '#666',
            fontStyle: 'italic',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        },
        '& .students-content': {
            padding: theme.spacing(0.5),
            '& .students-list': {
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing(0.25),
                '& .student-item': {
                    fontSize: '0.65rem',
                    color: '#333',
                    padding: '2px 4px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #e9ecef',
                    width: '100%',
                    minWidth: 0,
                    maxWidth: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                }
            }
        }
    }
})

const TeachingInfosContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    width: '100%',
    minWidth: 0
}))

const StyledHeaderCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 700,
    backgroundColor: theme.palette.grey[100],
    color: theme.palette.text.primary,
    borderBottom: `2px solid ${theme.palette.divider}`,
    fontSize: '0.9rem',
    position: 'sticky',
    top: 0,
    zIndex: 2
}))

const StyledFirstHeaderCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 700,
    backgroundColor: theme.palette.grey[100],
    color: theme.palette.text.primary,
    borderBottom: `2px solid ${theme.palette.divider}`,
    fontSize: '0.9rem',
    position: 'sticky',
    top: 0,
    left: 0,
    zIndex: 3,
    minWidth: 140
}))

const DayCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 600,
    backgroundColor: theme.palette.grey[50],
    borderRight: `1px solid ${theme.palette.divider}`,
    minWidth: 140,
    position: 'sticky',
    left: 0,
    zIndex: 1
}))

const GridCell = styled(TableCell)(({ theme }) => ({
    verticalAlign: 'top',
    padding: theme.spacing(1),
    minWidth: 220,
    borderRight: `1px solid ${theme.palette.divider}`
}))

const ClassBox = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.primary.light}`,
    boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
    transition: 'all 0.2s ease',
    marginBottom: theme.spacing(1),
    '&:hover': {
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        transform: 'translateY(-2px)'
    },
    '&::before': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        background: theme.palette.primary.main
    }
}))

const ClassBoxHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(1),
    background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
    color: '#fff',
    borderBottom: `1px solid ${theme.palette.primary.main}`,
    fontWeight: 700,
    fontSize: '0.85rem'
}))

const ClassBoxBody = styled('div')(({ theme }) => ({
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.paper
}))

const ClassBoxSubHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.default,
    borderBottom: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.secondary,
    fontSize: '0.75rem',
}))

const getDayInVietnamese = (englishDay: string) => {
    const dayMap: { [key: string]: string } = {
        'Monday': 'Thứ 2',
        'Tuesday': 'Thứ 3',
        'Wednesday': 'Thứ 4',
        'Thursday': 'Thứ 5',
        'Friday': 'Thứ 6',
        'Saturday': 'Thứ 7',
        'Sunday': 'Chủ nhật'
    }

    return dayMap[englishDay] || englishDay
}

const dayOffsetMap: Record<string, number> = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6
}

const TeacherScheduleView = () => {
    const { isTeacher } = useAuth()

    // Week selection
    const { data: weeksData, isLoading: isWeeksLoading } = useGetWeeks()
    const [selectedWeekId, setSelectedWeekId] = useState<string>('')

    // Get weeks list and find open week
    const weeks = useMemo(() => {
        return weeksData || []
    }, [weeksData])

    const openWeek = useMemo(() => {
        return weeks.find(week => week.scheduleStatus === WeekStatus.OPEN)
    }, [weeks])

    const selectedWeekInfo = useMemo(() => {
        if (!selectedWeekId) return null

        return weeks.find(week => week.id === selectedWeekId) || null
    }, [weeks, selectedWeekId])

    // Set default week (open week or most recent)
    useMemo(() => {
        if (weeks.length > 0 && !selectedWeekId) {
            if (openWeek) {
                setSelectedWeekId(openWeek.id)
            } else {
                // Sort by startDate descending and take the most recent
                const sortedWeeks = [...weeks].sort((a: WeekResponseDto, b: WeekResponseDto) =>
                    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
                )
                setSelectedWeekId(sortedWeeks[0].id)
            }
        }
    }, [weeks, selectedWeekId, openWeek])

    // Get schedule for current teacher (API automatically filters by teacher when user.type === TEACHER)
    const { data: schedules, isLoading: isSchedulesLoading } = useGetAllSchedule(true, undefined, selectedWeekId || undefined)


    // Parse SCHEDULE_TIME into day + time
    const parsedSlots = useMemo(() => {
        return SCHEDULE_TIME.map((slotString) => {
            const [time, day] = slotString.split(' ')
            const vietnameseDay = getDayInVietnamese(day)
            const offset = dayOffsetMap[day] ?? 0

            let dayLabel = vietnameseDay

            if (selectedWeekInfo?.startDate) {
                const date = new Date(selectedWeekInfo.startDate)
                date.setDate(date.getDate() + offset)
                const formatted = date.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit'
                })
                dayLabel = `${vietnameseDay} (${formatted})`
            }

            return { time, day, dayLabel, slotIndex: SCHEDULE_TIME.indexOf(slotString) + 1 }
        })
    }, [selectedWeekInfo?.startDate])

    const days = useMemo(() => {
        const seen = new Set<string>()
        const order: string[] = []

        parsedSlots.forEach(p => { if (!seen.has(p.day)) { seen.add(p.day); order.push(p.day) } })

        return order
    }, [parsedSlots])

    const times = useMemo(() => {
        const seen = new Set<string>()
        const order: string[] = []

        parsedSlots.forEach(p => { if (!seen.has(p.time)) { seen.add(p.time); order.push(p.time) } })

        return order
    }, [parsedSlots])

    const dayLabelMap = useMemo(() => {
        const map: Record<string, string> = {}

        parsedSlots.forEach(slot => {
            if (!map[slot.day]) {
                map[slot.day] = slot.dayLabel
            }
        })

        return map
    }, [parsedSlots])

    const indexFromDayTime = (day: string, time: string) => {
        const idx = parsedSlots.findIndex(p => p.day === day && p.time === time)

        return idx >= 0 ? idx + 1 : -1
    }

    const keyFromSlotIndex = (slotIndex1Based: number) => {
        const slot = parsedSlots[slotIndex1Based - 1]

        return slot ? `${slot.day}|${slot.time}` : ''
    }

    const schedulesByKey = useMemo(() => {
        const map: Record<string, any[]> = {}

        if (!schedules) return map

        schedules.forEach(s => {
            const key = keyFromSlotIndex(s.schedule_time)

            if (!key) return
            if (!map[key]) map[key] = []
            map[key].push(s)
        })

        return map
    }, [schedules, parsedSlots])


    const getRollcallStatusConfig = (status?: RollcallStatus) => {
        switch (status) {
            case RollcallStatus.ATTENDING:
                return {
                    label: 'Đã điểm danh',
                    backgroundColor: '#c8e6c9',
                    borderColor: '#81c784',
                    textColor: '#1b5e20',
                    accentColor: '#388e3c'
                }
            case RollcallStatus.ABSENT_WITHOUT_REASON:
                return {
                    label: 'Vắng mặt',
                    backgroundColor: '#ffcdd2',
                    borderColor: '#ef9a9a',
                    textColor: '#b71c1c',
                    accentColor: '#d32f2f'
                }
            case RollcallStatus.TRIAL:
                return {
                    label: 'Vắng có lý do',
                    backgroundColor: '#ffe0b2',
                    borderColor: '#ffcc80',
                    textColor: '#e65100',
                    accentColor: '#fb8c00'
                }
            case RollcallStatus.RETAKE:
                return {
                    label: 'Vắng xin muộn',
                    backgroundColor: '#d1c4e9',
                    borderColor: '#b39ddb',
                    textColor: '#4527a0',
                    accentColor: '#7e57c2'
                }
            default:
                return null
        }
    }



    // Render schedule table
    const renderScheduleTable = () => {
        if (parsedSlots.length === 0) {
            return (
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={400} gap={2}>
                    <i className="ri-calendar-line" style={{ fontSize: '48px', color: '#ccc' }} />
                    <Typography variant="h6" color="text.secondary">
                        Không có dữ liệu
                    </Typography>
                </Box>
            )
        }

        return (
            <TableContainer
                component={Paper}
                sx={{
                    borderRadius: 2,
                    maxHeight: '80vh',
                    overflow: 'auto'
                }}
            >
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <StyledFirstHeaderCell>Thứ / Giờ</StyledFirstHeaderCell>
                            {times.map(t => (
                                <StyledHeaderCell key={t} align="center">{t}</StyledHeaderCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {days.map(day => (
                            <TableRow key={day} hover={false}>
                                <DayCell>{dayLabelMap[day] || getDayInVietnamese(day)}</DayCell>
                                {times.map(time => {
                                    const scheduled = schedulesByKey[`${day}|${time}`] || []

                                    return (
                                        <GridCell key={`${day}|${time}`}>
                                            <Box display="flex" flexDirection="column" gap={0.75}>
                                                {/* Scheduled classes as boxes */}
                                                {scheduled.map((s, i) => (
                                                    <ClassBox
                                                        key={`${s.class_id}-${s.lesson}-${i}`}
                                                    >
                                                        <ClassBoxHeader>
                                                            <Box display="flex" gap={1} alignItems="center">
                                                                <Typography variant="body2" fontWeight={700}>{s.class_name}</Typography>
                                                                {s.note && (
                                                                    <Typography
                                                                        variant="caption"
                                                                        color="text.secondary"
                                                                        sx={{
                                                                            fontStyle: 'italic',
                                                                            fontSize: '0.7rem',
                                                                            lineHeight: 1.2,
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            display: '-webkit-box',
                                                                            WebkitLineClamp: 2,
                                                                            WebkitBoxOrient: 'vertical'
                                                                        }}
                                                                    >
                                                                        {s.note}
                                                                    </Typography>
                                                                )}
                                                                <Chip
                                                                    size="small"
                                                                    variant="outlined"
                                                                    label={`Buổi ${s.lesson}`}
                                                                    sx={{
                                                                        borderColor: 'rgba(255,255,255,0.8)',
                                                                        color: '#fff',
                                                                        height: 22
                                                                    }}
                                                                />
                                                            </Box>
                                                        </ClassBoxHeader>
                                                        <ClassBoxSubHeader>
                                                            <Box display="flex" flexDirection="column" gap={0.5} width="100%">
                                                                <Typography variant="caption">GV: {s.teacher_name}</Typography>
                                                                {(s.start_time || s.end_time) && (
                                                                    <Typography variant="caption" sx={{
                                                                        color: 'primary.main',
                                                                        fontWeight: 600,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: 0.5
                                                                    }}>
                                                                        <i className="ri-time-line" style={{ fontSize: '0.75rem' }} />
                                                                        {s.start_time && s.end_time
                                                                            ? `${s.start_time} - ${s.end_time}`
                                                                            : s.start_time || s.end_time
                                                                        }
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </ClassBoxSubHeader>
                                                        <ClassBoxBody>
                                                            {Array.isArray(s.students) && s.students.length > 0 ? (() => {
                                                                const visibleStudents = s.students.slice(0, 10)
                                                                const hasMoreStudents = s.students.length > 10
                                                                const additionalStudents = hasMoreStudents ? s.students.slice(10) : []

                                                                return (
                                                                    <Box display="flex" gap={0.5} flexWrap="wrap">
                                                                        {visibleStudents.map((st: any) => {
                                                                            const coursename = st.coursename ? ` - ${st.coursename}` : ''
                                                                            const displayLabel = st.note
                                                                                ? `${st.fullname}${coursename} (${st.note})`
                                                                                : `${st.fullname}${coursename}`
                                                                            const rollcallStatusConfig = getRollcallStatusConfig(st.rollcall_status as RollcallStatus | undefined)
                                                                            const isNotRollcall = !st.rollcall_status || st.rollcall_status === RollcallStatus.NOT_ROLLCALL

                                                                            const chipSx = rollcallStatusConfig && !isNotRollcall
                                                                                ? {
                                                                                    backgroundColor: rollcallStatusConfig.backgroundColor,
                                                                                    borderColor: rollcallStatusConfig.borderColor,
                                                                                    color: rollcallStatusConfig.textColor,
                                                                                    borderLeft: `4px solid ${rollcallStatusConfig.accentColor}`
                                                                                }
                                                                                : undefined

                                                                            return (
                                                                                <Tooltip key={st.id} title={displayLabel} arrow>
                                                                                    <Chip
                                                                                        size="small"
                                                                                        label={displayLabel}
                                                                                        sx={{
                                                                                            maxWidth: '100%',
                                                                                            ...chipSx,
                                                                                            '& .MuiChip-label': {
                                                                                                overflow: 'hidden',
                                                                                                textOverflow: 'ellipsis',
                                                                                                whiteSpace: 'nowrap'
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                </Tooltip>
                                                                            )
                                                                        })}

                                                                        {hasMoreStudents && (
                                                                            <Tooltip
                                                                                title={additionalStudents.map((st: any) => st.fullname).join(', ')}
                                                                            >
                                                                                <Chip
                                                                                    size="small"
                                                                                    label="..."
                                                                                    sx={{
                                                                                        maxWidth: '100%',
                                                                                        '& .MuiChip-label': {
                                                                                            overflow: 'hidden',
                                                                                            textOverflow: 'ellipsis',
                                                                                            whiteSpace: 'nowrap'
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </Tooltip>
                                                                        )}
                                                                    </Box>
                                                                )
                                                            })() : (
                                                                <Typography variant="caption" color="text.secondary">Chưa có danh sách học sinh</Typography>
                                                            )}
                                                        </ClassBoxBody>
                                                    </ClassBox>
                                                ))}

                                                {scheduled.length === 0 && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                        Không có lịch
                                                    </Typography>
                                                )}
                                            </Box>
                                        </GridCell>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        )
    }

    if (isSchedulesLoading || isWeeksLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Đang tải dữ liệu...</Typography>
            </Box>
        )
    }

    if (!isTeacher()) {
        return (
            <Box>
                <Alert severity="error">
                    Bạn không có quyền truy cập trang này. Vui lòng đăng nhập bằng tài khoản giáo viên.
                </Alert>
            </Box>
        )
    }

    return (
        <>
            <Card>
                <CardHeader
                    title="Lịch dạy của tôi"
                    subheader="Xem lịch giảng dạy trong tuần"
                    action={
                        <Box display="flex" gap={1} alignItems="center">
                            <Chip
                                size="small"
                                label="Có lịch"
                                sx={{
                                    backgroundColor: '#e3f2fd',
                                    color: '#1976d2',
                                    border: '1px solid #bbdefb'
                                }}
                            />
                        </Box>
                    }
                />
                <CardContent>
                    {/* Week Selection */}
                    <Box sx={{ mb: 3 }}>
                        <FormControl size="small" sx={{ minWidth: 300 }}>
                            <InputLabel>Tuần học</InputLabel>
                            <Select
                                value={selectedWeekId}
                                onChange={(e) => setSelectedWeekId(e.target.value)}
                                label="Tuần học"
                                disabled={isWeeksLoading}
                            >
                                {isWeeksLoading ? (
                                    <MenuItem disabled>Đang tải...</MenuItem>
                                ) : weeks.length === 0 ? (
                                    <MenuItem disabled>Không có dữ liệu</MenuItem>
                                ) : (
                                    weeks.map((week: WeekResponseDto) => {
                                        const startDate = new Date(week.startDate)
                                        const endDate = new Date(startDate)
                                        endDate.setDate(endDate.getDate() + 6)

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
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </MenuItem>
                                        )
                                    })
                                )}
                            </Select>
                        </FormControl>
                    </Box>

                    {renderScheduleTable()}
                </CardContent>
            </Card>

        </>
    )
}

export default TeacherScheduleView

