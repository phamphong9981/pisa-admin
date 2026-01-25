'use client'

// React Imports
import React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

// Styled Components
import { styled, useTheme } from '@mui/material/styles'

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
    Dialog,
    Paper,
    Slider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Tooltip
} from '@mui/material'

// Hooks
import { TeacherListResponse } from '@/@core/hooks/useTeacher'

// Helper function
const getDayInVietnamese = (englishDay: string) => {
    const dayMap: Record<string, string> = {
        Monday: 'Thứ 2',
        Tuesday: 'Thứ 3',
        Wednesday: 'Thứ 4',
        Thursday: 'Thứ 5',
        Friday: 'Thứ 6',
        Saturday: 'Thứ 7',
        Sunday: 'Chủ nhật'
    }

    return dayMap[englishDay] || englishDay
}

// Styled Components
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

interface ScheduleGridProps {
    // Course info
    courseInfo: any
    isCourseInfoLoading: boolean
    courseInfoError: Error | null

    // Search states
    studentSearchTerm: string
    onStudentSearchChange: (value: string) => void
    filteredStudents: Array<{ id: string; fullname: string; email?: string; phone?: string }>
    selectedStudentIds: Set<string>
    onToggleStudentSelection: (studentId: string) => void
    selectedStudentsInfo: Array<{ id: string; fullname: string; email?: string; phone?: string }>

    teacherSearchTerm: string
    onTeacherSearchChange: (value: string) => void
    teachers: TeacherListResponse[] | undefined
    isTeachersLoading: boolean
    selectedTeacher: TeacherListResponse | null
    onSelectedTeacherChange: (teacher: TeacherListResponse | null) => void

    // Schedule data
    parsedSlots: Array<{ time: string; day: string; dayLabel: string }>
    days: string[]
    times: string[]
    dayLabelMap: Record<string, string>
    schedulesByKey: Record<string, any[]>
    freeStudentsByIndex: Record<number, { id: string; fullname: string }[]>
    scheduledStudentIdsByIndex: Record<number, Set<string>>

    // Teacher availability
    teacherAvailableSlots: Set<number>
    teacherNotesByScheduleTime: Record<string, Record<number, string>>

    // Student availability
    studentsAvailableSlots: Set<number>

    // Classes
    filteredClasses: any[]
    allScheduledClasses: Set<string>

    // Handlers
    indexFromDayTime: (day: string, time: string) => number
    handleClassBoxClick: (schedule: any) => void
    handleOpenCreateLessonModal: (day: string, time: string, slotIndex: number, teacherId?: string) => void

    // Other
    isReadOnly: boolean
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({
    courseInfo,
    isCourseInfoLoading,
    courseInfoError,
    studentSearchTerm,
    onStudentSearchChange,
    filteredStudents,
    selectedStudentIds,
    onToggleStudentSelection,
    selectedStudentsInfo,
    teacherSearchTerm,
    onTeacherSearchChange,
    teachers,
    isTeachersLoading,
    selectedTeacher,
    onSelectedTeacherChange,
    parsedSlots,
    days,
    times,
    dayLabelMap,
    schedulesByKey,
    freeStudentsByIndex,
    scheduledStudentIdsByIndex,
    teacherAvailableSlots,
    teacherNotesByScheduleTime,
    studentsAvailableSlots,
    filteredClasses,
    allScheduledClasses,
    indexFromDayTime,
    handleClassBoxClick,
    handleOpenCreateLessonModal,
    isReadOnly
}) => {
    const theme = useTheme()

    const [isFullscreen, setIsFullscreen] = useState(false)
    const [scale, setScale] = useState(1)
    const [isFitToScreen, setIsFitToScreen] = useState(true)

    const fullscreenViewportRef = useRef<HTMLDivElement | null>(null)
    const fullscreenContentRef = useRef<HTMLDivElement | null>(null)

    const computeFitScale = () => {
        const viewport = fullscreenViewportRef.current
        const content = fullscreenContentRef.current
        if (!viewport || !content) return

        const vw = viewport.clientWidth
        const cw = content.scrollWidth

        if (!vw || !cw) return

        // Fit width only (allow vertical scroll)
        // Scale down when needed, allow up to 1x
        const next = Math.min(vw / cw, 1)
        setScale(Number.isFinite(next) ? Number(next.toFixed(3)) : 1)
    }

    // Recompute scale when fullscreen opens / layout changes
    useEffect(() => {
        if (!isFullscreen) return
        if (!isFitToScreen) return

        // Wait a frame for DOM to paint
        const raf = window.requestAnimationFrame(() => computeFitScale())

        const viewport = fullscreenViewportRef.current
        const content = fullscreenContentRef.current
        if (!viewport || !content) return () => window.cancelAnimationFrame(raf)

        const ro = new ResizeObserver(() => {
            computeFitScale()
        })
        ro.observe(viewport)
        ro.observe(content)

        return () => {
            window.cancelAnimationFrame(raf)
            ro.disconnect()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFullscreen, isFitToScreen])

    // ESC to close fullscreen
    useEffect(() => {
        if (!isFullscreen) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsFullscreen(false)
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [isFullscreen])

    const renderScheduleTable = (opts?: { fullscreen?: boolean }) => {
        const fullscreen = !!opts?.fullscreen

        if (isCourseInfoLoading) {
            return (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                    <CircularProgress />
                </Box>
            )
        }

        if (courseInfoError) {
            return <Alert severity="error">Lỗi tải thông tin khóa học: {courseInfoError.message}</Alert>
        }

        return (
            <TableContainer
                component={Paper}
                sx={{
                    borderRadius: fullscreen ? 0 : 2,
                    maxHeight: fullscreen ? 'none' : '80vh',
                    height: fullscreen ? '100%' : 'auto',
                    overflow: fullscreen ? 'visible' : 'auto'
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
                                    const index = indexFromDayTime(day, time)
                                    let free = index > 0 ? (freeStudentsByIndex[index] || []) : []
                                    const scheduled = schedulesByKey[`${day}|${time}`] || []

                                    if (index > 0 && scheduledStudentIdsByIndex[index]) {
                                        const set = scheduledStudentIdsByIndex[index]
                                        free = free.filter(s => !set.has(s.id))
                                    }

                                    const isTeacherAvailable = selectedTeacher && index > 0 && teacherAvailableSlots.has(index)
                                    const teacherNoteForSlot = selectedTeacher && index > 0 && teacherNotesByScheduleTime[selectedTeacher.id]
                                        ? teacherNotesByScheduleTime[selectedTeacher.id][index]
                                        : undefined
                                    const areAllStudentsAvailable = selectedStudentIds.size > 0 && index > 0 && studentsAvailableSlots.has(index)

                                    let displayFree = free
                                    if (selectedStudentIds.size > 0) {
                                        displayFree = free.filter(s => selectedStudentIds.has(s.id))
                                    }

                                    return (
                                        <GridCell
                                            key={`${day}|${time}`}
                                            sx={{
                                                ...(isTeacherAvailable && {
                                                    backgroundColor: '#e8f5e8',
                                                    border: '2px solid #4caf50',
                                                    position: 'relative',
                                                    '&::before': {
                                                        content: '""',
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        height: 4,
                                                        background: '#4caf50',
                                                        zIndex: 2
                                                    }
                                                }),
                                                ...(areAllStudentsAvailable && !isTeacherAvailable && {
                                                    backgroundColor: '#fff3e0',
                                                    border: '2px solid #ff9800',
                                                    position: 'relative',
                                                    '&::before': {
                                                        content: '""',
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        height: 4,
                                                        background: '#ff9800',
                                                        zIndex: 2
                                                    }
                                                }),
                                                ...(areAllStudentsAvailable && isTeacherAvailable && {
                                                    backgroundColor: '#e8f5e8',
                                                    border: '2px solid #4caf50',
                                                    position: 'relative',
                                                    '&::before': {
                                                        content: '""',
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        height: 4,
                                                        background: 'linear-gradient(to right, #4caf50 50%, #ff9800 50%)',
                                                        zIndex: 2
                                                    }
                                                })
                                            }}
                                        >
                                            {/* Show students available indicator */}
                                            {areAllStudentsAvailable && (
                                                <Box sx={{
                                                    textAlign: 'center',
                                                    mb: 1,
                                                    p: 0.5,
                                                    backgroundColor: isTeacherAvailable
                                                        ? 'rgba(76, 175, 80, 0.1)'
                                                        : 'rgba(255, 152, 0, 0.1)',
                                                    borderRadius: 1,
                                                    border: `1px solid ${isTeacherAvailable ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 152, 0, 0.3)'}`
                                                }}>
                                                    <Typography
                                                        variant="caption"
                                                        color={isTeacherAvailable ? "success.main" : "warning.main"}
                                                        fontWeight={600}
                                                    >
                                                        <i className="ri-check-line" style={{ marginRight: 4 }} />
                                                        {selectedStudentIds.size} học sinh rảnh
                                                    </Typography>
                                                </Box>
                                            )}
                                            {isTeacherAvailable && (
                                                <Box sx={{
                                                    textAlign: 'center',
                                                    mb: 1,
                                                    p: 0.5,
                                                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                                    borderRadius: 1,
                                                    border: '1px solid rgba(76, 175, 80, 0.3)'
                                                }}>
                                                    <Typography variant="caption" color="success.main" fontWeight={600}>
                                                        <i className="ri-check-line" style={{ marginRight: 4 }} />
                                                        {selectedTeacher?.name} rảnh
                                                    </Typography>
                                                    {teacherNoteForSlot && (
                                                        <Box sx={{
                                                            mt: 1,
                                                            pt: 1,
                                                            pb: 1,
                                                            px: 1,
                                                            borderTop: '1px solid rgba(76, 175, 80, 0.3)',
                                                            backgroundColor: 'rgba(76, 175, 80, 0.15)',
                                                            borderRadius: 1,
                                                            textAlign: 'center'
                                                        }}>
                                                            <Typography
                                                                variant="caption"
                                                                color="success.dark"
                                                                sx={{
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: 600,
                                                                    display: 'block',
                                                                    textAlign: 'center',
                                                                    wordBreak: 'break-word'
                                                                }}
                                                            >
                                                                <i className="ri-file-text-line" style={{ marginRight: 4, fontSize: '0.85rem' }} />
                                                                {teacherNoteForSlot}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            )}

                                            {/* Show teacher note even if teacher is not available (busy) */}
                                            {selectedTeacher && !isTeacherAvailable && teacherNoteForSlot && (
                                                <Box sx={{
                                                    textAlign: 'center',
                                                    mb: 1,
                                                    p: 1.5,
                                                    backgroundColor: 'rgba(255, 152, 0, 0.2)',
                                                    borderRadius: 1,
                                                    border: '2px solid rgba(255, 152, 0, 0.5)',
                                                    boxShadow: '0 2px 4px rgba(255, 152, 0, 0.2)'
                                                }}>
                                                    <Typography variant="caption" color="warning.dark" fontWeight={700} sx={{ fontSize: '0.75rem', mb: 0.5, display: 'block' }}>
                                                        <i className="ri-file-text-line" style={{ marginRight: 4 }} />
                                                        Ghi chú {selectedTeacher?.name}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="warning.dark"
                                                        sx={{
                                                            fontSize: '0.8rem',
                                                            fontWeight: 600,
                                                            display: 'block',
                                                            textAlign: 'center',
                                                            wordBreak: 'break-word'
                                                        }}
                                                    >
                                                        {teacherNoteForSlot}
                                                    </Typography>
                                                </Box>
                                            )}

                                            <Box display="flex" flexDirection="column" gap={0.75}>
                                                {/* Scheduled classes as boxes */}
                                                {scheduled.map((s, i) => {
                                                    const isTransferred = s.isTransferred === true

                                                    return (
                                                        <ClassBox
                                                            key={`${s.class_id}-${s.lesson}-${i}`}
                                                            onClick={() => handleClassBoxClick(s)}
                                                            sx={{
                                                                cursor: isReadOnly ? 'default' : 'pointer',
                                                                opacity: isReadOnly ? 1 : 1,
                                                                border: isTransferred
                                                                    ? `1px solid ${theme.palette.warning.light}`
                                                                    : undefined,
                                                                '&::before': {
                                                                    background: isTransferred
                                                                        ? theme.palette.warning.main
                                                                        : theme.palette.primary.main
                                                                },
                                                                '&:hover': isReadOnly ? {} : {
                                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                                                    transform: 'translateY(-2px)'
                                                                }
                                                            }}
                                                        >
                                                            <ClassBoxHeader
                                                                sx={{
                                                                    background: isTransferred
                                                                        ? `linear-gradient(135deg, ${theme.palette.warning.light}, ${theme.palette.warning.main})`
                                                                        : undefined,
                                                                    borderBottom: isTransferred
                                                                        ? `1px solid ${theme.palette.warning.main}`
                                                                        : undefined
                                                                }}
                                                            >
                                                                <Box display="flex" gap={1} alignItems="center">
                                                                    <Typography variant="body2" fontWeight={700}>{s.class_name}
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
                                                                    </Typography>
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
                                                                    {isTransferred && (
                                                                        <Chip
                                                                            size="small"
                                                                            label="Ghép lớp"
                                                                            sx={{
                                                                                backgroundColor: 'rgba(255,255,255,0.2)',
                                                                                color: '#fff',
                                                                                height: 22,
                                                                                fontSize: '0.7rem',
                                                                                fontWeight: 600
                                                                            }}
                                                                        />
                                                                    )}
                                                                </Box>
                                                            </ClassBoxHeader>
                                                            <ClassBoxSubHeader>
                                                                <Box display="flex" flexDirection="column" gap={0.5} width="100%">
                                                                    <Typography variant="caption">GV: {s.teacher_name}</Typography>
                                                                    {/* Show teacher note if exists for this teacher and slot */}
                                                                    {index > 0 && s.teacher_id && teacherNotesByScheduleTime[s.teacher_id]?.[index] && (
                                                                        <Box sx={{
                                                                            mt: 0.5,
                                                                            p: 1,
                                                                            backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                                                            borderRadius: 1,
                                                                            borderLeft: '3px solid #1976d2'
                                                                        }}>
                                                                            <Typography variant="caption" sx={{
                                                                                color: 'primary.dark',
                                                                                fontWeight: 600,
                                                                                fontSize: '0.75rem',
                                                                                display: 'block',
                                                                                lineHeight: 1.3
                                                                            }}>
                                                                                <i className="ri-file-text-line" style={{ marginRight: 4 }} />
                                                                                {teacherNotesByScheduleTime[s.teacher_id][index]}
                                                                            </Typography>
                                                                        </Box>
                                                                    )}
                                                                    {(s.start_time || s.end_time) && (
                                                                        <Typography variant="caption" sx={{
                                                                            color: isTransferred ? 'warning.main' : 'primary.main',
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

                                                                                return (
                                                                                    <Chip
                                                                                        key={st.id}
                                                                                        size="small"
                                                                                        label={displayLabel}
                                                                                        sx={{
                                                                                            maxWidth: '100%',
                                                                                            '& .MuiChip-label': {
                                                                                                overflow: 'hidden',
                                                                                                textOverflow: 'ellipsis',
                                                                                                whiteSpace: 'nowrap'
                                                                                            }
                                                                                        }}
                                                                                    />
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
                                                    )
                                                })}

                                                {/* Free students list */}
                                                <Box>
                                                    {displayFree.length > 0 ? (() => {
                                                        const visibleFreeStudents = displayFree.slice(0, 10)
                                                        const hasMoreFreeStudents = displayFree.length > 10
                                                        const additionalFreeStudents = hasMoreFreeStudents ? displayFree.slice(10) : []

                                                        return (
                                                            <Box display="flex" gap={0.5} flexWrap="wrap">
                                                                {visibleFreeStudents.map(s => {
                                                                    const isSelected = selectedStudentIds.has(s.id)
                                                                    return (
                                                                        <Chip
                                                                            key={s.id}
                                                                            size="small"
                                                                            label={s.fullname}
                                                                            sx={{
                                                                                ...(isSelected && selectedStudentIds.size > 0 && {
                                                                                    backgroundColor: '#fff3e0',
                                                                                    borderColor: '#ff9800',
                                                                                    borderWidth: 2,
                                                                                    fontWeight: 600
                                                                                })
                                                                            }}
                                                                        />
                                                                    )
                                                                })}
                                                                {hasMoreFreeStudents && (
                                                                    <Tooltip
                                                                        title={additionalFreeStudents.map(s => s.fullname).join(', ')}
                                                                    >
                                                                        <Chip size="small" label="..." />
                                                                    </Tooltip>
                                                                )}
                                                            </Box>
                                                        )
                                                    })() : (
                                                        scheduled.length === 0 ? (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {selectedStudentIds.size > 0 ? 'Không có học sinh đã chọn nào rảnh' : 'Không có HS rảnh'}
                                                            </Typography>
                                                        ) : null
                                                    )}
                                                </Box>

                                                {/* Create Lesson Button */}
                                                {displayFree.length > 0 && !isReadOnly && (
                                                    <Box sx={{ mt: 1, textAlign: 'center' }}>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="primary"
                                                            startIcon={<i className="ri-add-line" />}
                                                            onClick={() => handleOpenCreateLessonModal(day, time, index, selectedTeacher?.id)}
                                                            sx={{
                                                                fontSize: '0.75rem',
                                                                py: 0.5,
                                                                px: 1,
                                                                minWidth: 'auto',
                                                                borderStyle: 'dashed'
                                                            }}
                                                        >
                                                            Tạo lịch
                                                        </Button>
                                                    </Box>
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

    return (
        <Card>
            <CardHeader
                title="Lưới học sinh rảnh theo khung giờ"
                action={(
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<i className="ri-fullscreen-line" />}
                        onClick={() => {
                            setIsFullscreen(true)
                            setIsFitToScreen(true)
                        }}
                        size="small"
                        sx={{ minWidth: 'auto' }}
                    >
                        Toàn màn hình
                    </Button>
                )}
            />
            <CardContent>
                {/* Student and Teacher Search */}
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {/* Student Search */}
                        <Box sx={{ flex: 1, minWidth: 300 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Tìm kiếm học sinh để xem lịch rảnh chung:
                            </Typography>
                            <Box>
                                {/* Student Search Input */}
                                <TextField
                                    fullWidth
                                    placeholder="Tìm kiếm học sinh (tên, email, SĐT)..."
                                    value={studentSearchTerm}
                                    onChange={(e) => onStudentSearchChange(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <i className="ri-search-line" style={{ color: '#666', marginRight: 8 }} />
                                        ),
                                        endAdornment: studentSearchTerm && (
                                            <i
                                                className="ri-close-line"
                                                style={{
                                                    color: '#666',
                                                    cursor: 'pointer',
                                                    fontSize: '18px'
                                                }}
                                                onClick={() => onStudentSearchChange('')}
                                            />
                                        )
                                    }}
                                    sx={{ mb: 1 }}
                                />

                                {/* Student Search Results */}
                                {studentSearchTerm && (
                                    <Box sx={{
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        border: '1px solid #eee',
                                        borderRadius: 1,
                                        p: 1,
                                        backgroundColor: '#f8f9fa',
                                        mb: 1
                                    }}>
                                        {filteredStudents.length > 0 ? (
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                                    Kết quả tìm kiếm ({filteredStudents.length} học sinh):
                                                </Typography>
                                                {filteredStudents.map((student) => {
                                                    const isSelected = selectedStudentIds.has(student.id)

                                                    return (
                                                        <Box
                                                            key={student.id}
                                                            sx={{
                                                                p: 1,
                                                                borderBottom: '1px solid #eee',
                                                                '&:last-child': { borderBottom: 'none' },
                                                                cursor: 'pointer',
                                                                '&:hover': { backgroundColor: '#e3f2fd' },
                                                                borderRadius: 1,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                backgroundColor: isSelected ? '#e3f2fd' : 'transparent'
                                                            }}
                                                            onClick={() => onToggleStudentSelection(student.id)}
                                                        >
                                                            <Box sx={{ flex: 1 }}>
                                                                <Typography variant="body2" fontWeight={500}>
                                                                    {student.fullname}
                                                                </Typography>
                                                                {student.email && (
                                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                                        <i className="ri-mail-line" style={{ marginRight: 4, fontSize: '12px' }} />
                                                                        {student.email}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                            {isSelected && (
                                                                <Chip
                                                                    size="small"
                                                                    label="Đã chọn"
                                                                    color="primary"
                                                                    variant="filled"
                                                                    sx={{ fontSize: '0.7rem' }}
                                                                />
                                                            )}
                                                        </Box>
                                                    )
                                                })}
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" textAlign="center" p={2}>
                                                Không tìm thấy học sinh nào
                                            </Typography>
                                        )}
                                    </Box>
                                )}

                                {/* Selected Students Display */}
                                {selectedStudentIds.size > 0 && !studentSearchTerm && (
                                    <Box sx={{
                                        p: 1.5,
                                        backgroundColor: '#fff3e0',
                                        borderRadius: 1,
                                        border: '1px solid #ffb74d',
                                        mb: 1
                                    }}>
                                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                            <Typography variant="body2" fontWeight={600}>
                                                Đã chọn {selectedStudentIds.size} học sinh:
                                            </Typography>
                                            <Button
                                                size="small"
                                                variant="text"
                                                color="inherit"
                                                onClick={() => {
                                                    selectedStudentIds.forEach(id => onToggleStudentSelection(id))
                                                }}
                                                sx={{ fontSize: '0.7rem', py: 0.25, px: 1 }}
                                            >
                                                Xóa tất cả
                                            </Button>
                                        </Box>
                                        <Box display="flex" gap={0.5} flexWrap="wrap">
                                            {selectedStudentsInfo.map(student => (
                                                <Chip
                                                    key={student.id}
                                                    size="small"
                                                    label={student.fullname}
                                                    onDelete={() => onToggleStudentSelection(student.id)}
                                                    sx={{ fontSize: '0.75rem' }}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Box>

                        {/* Teacher Search */}
                        <Box sx={{ flex: 1, minWidth: 300 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Tìm kiếm giáo viên để xem lịch khớp trên lưới:
                            </Typography>
                            <Box>
                                <TextField
                                    fullWidth
                                    placeholder="Tìm kiếm giáo viên..."
                                    value={teacherSearchTerm}
                                    onChange={(e) => onTeacherSearchChange(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <i className="ri-search-line" style={{ color: '#666', marginRight: 8 }} />
                                        ),
                                        endAdornment: teacherSearchTerm && (
                                            <i
                                                className="ri-close-line"
                                                style={{
                                                    color: '#666',
                                                    cursor: 'pointer',
                                                    fontSize: '18px'
                                                }}
                                                onClick={() => onTeacherSearchChange('')}
                                            />
                                        )
                                    }}
                                    sx={{ mb: 1 }}
                                />

                                {/* Teacher Search Results */}
                                {teacherSearchTerm && (
                                    <Box sx={{
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        border: '1px solid #eee',
                                        borderRadius: 1,
                                        p: 1,
                                        backgroundColor: '#f8f9fa',
                                        mb: 1
                                    }}>
                                        {isTeachersLoading ? (
                                            <Box display="flex" justifyContent="center" p={2}>
                                                <CircularProgress size={20} />
                                            </Box>
                                        ) : teachers && teachers.length > 0 ? (
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                                    Kết quả tìm kiếm ({teachers.length} giáo viên):
                                                </Typography>
                                                {teachers.map((teacher) => {
                                                    const isSelected = selectedTeacher?.id === teacher.id

                                                    return (
                                                        <Box
                                                            key={teacher.id}
                                                            sx={{
                                                                p: 1,
                                                                borderBottom: '1px solid #eee',
                                                                '&:last-child': { borderBottom: 'none' },
                                                                cursor: 'pointer',
                                                                '&:hover': { backgroundColor: '#e3f2fd' },
                                                                borderRadius: 1,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                backgroundColor: isSelected ? '#e3f2fd' : 'transparent'
                                                            }}
                                                            onClick={() => {
                                                                onSelectedTeacherChange(isSelected ? null : teacher)
                                                            }}
                                                        >
                                                            <Box sx={{ flex: 1 }}>
                                                                <Typography variant="body2" fontWeight={500}>
                                                                    {teacher.name}
                                                                </Typography>
                                                                {teacher.skills && teacher.skills.length > 0 && (
                                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                                        <i className="ri-award-line" style={{ marginRight: 4, fontSize: '12px' }} />
                                                                        {teacher.skills.join(', ')}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Chip
                                                                    size="small"
                                                                    label="Rảnh"
                                                                    color="success"
                                                                    variant="outlined"
                                                                    sx={{ fontSize: '0.7rem' }}
                                                                />
                                                                {isSelected && (
                                                                    <Chip
                                                                        size="small"
                                                                        label="Đã chọn"
                                                                        color="primary"
                                                                        variant="filled"
                                                                        sx={{ fontSize: '0.7rem' }}
                                                                    />
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    )
                                                })}
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" textAlign="center" p={2}>
                                                Không tìm thấy giáo viên nào
                                            </Typography>
                                        )}
                                    </Box>
                                )}

                                {/* Selected Teacher Display */}
                                {selectedTeacher && !teacherSearchTerm && (
                                    <Box
                                        sx={{
                                            p: 1.5,
                                            backgroundColor: '#e8f5e8',
                                            borderRadius: 1,
                                            border: '1px solid #c8e6c9',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                backgroundColor: '#c8e6c9'
                                            }
                                        }}
                                        onClick={() => onSelectedTeacherChange(null)}
                                    >
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" fontWeight={600}>
                                                {selectedTeacher.name}
                                            </Typography>
                                            {selectedTeacher.skills && selectedTeacher.skills.length > 0 && (
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    <i className="ri-award-line" style={{ marginRight: 4, fontSize: '12px' }} />
                                                    {selectedTeacher.skills.join(', ')}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip
                                                size="small"
                                                label="Rảnh"
                                                color="success"
                                                variant="outlined"
                                                sx={{ fontSize: '0.7rem' }}
                                            />
                                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                (Click để bỏ chọn)
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* Classes Display */}
                <Box display="flex" gap={1} alignItems="center" mb={2} flexWrap="wrap">
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                        {filteredClasses.map(cls => {
                            const hasSchedule = allScheduledClasses.has(cls.id)
                            const teacherName = cls.teacher?.name || 'Chưa có GV'

                            return (
                                <Chip
                                    key={cls.id}
                                    size="small"
                                    label={
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <span>{cls.name}</span>
                                            <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.8 }}>
                                                (GV: {teacherName})
                                            </Typography>
                                        </Box>
                                    }
                                    color={hasSchedule ? 'success' : 'default'}
                                    variant={hasSchedule ? 'filled' : 'outlined'}
                                    sx={{
                                        ...(hasSchedule && {
                                            backgroundColor: '#e8f5e8',
                                            color: '#2e7d32',
                                            borderColor: '#4caf50',
                                            fontWeight: 600
                                        })
                                    }}
                                />
                            )
                        })}
                        {filteredClasses.length === 0 && (
                            <Typography variant="caption" color="text.secondary">Không có lớp phù hợp</Typography>
                        )}
                    </Box>
                </Box>

                {/* Schedule Grid Table */}
                {renderScheduleTable()}
            </CardContent>

            {/* Fullscreen Grid (fit-to-screen / zoom) */}
            <Dialog
                open={isFullscreen}
                fullScreen
                onClose={() => setIsFullscreen(false)}
                PaperProps={{
                    sx: {
                        bgcolor: '#fff'
                    }
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                    {/* Header */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            px: 2,
                            py: 1,
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            backgroundColor: theme.palette.background.default
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
                            <Typography variant="subtitle1" fontWeight={700} noWrap>
                                Lưới lịch học (toàn màn hình)
                            </Typography>
                            <Chip
                                size="small"
                                variant="outlined"
                                color={isFitToScreen ? 'success' : 'default'}
                                label={isFitToScreen ? 'Fit màn hình' : `Zoom: ${Math.round(scale * 100)}%`}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                startIcon={<i className="ri-fullscreen-exit-line" />}
                                onClick={() => setIsFullscreen(false)}
                            >
                                Thoát
                            </Button>
                        </Box>
                    </Box>

                    {/* Viewport */}
                    <Box
                        ref={fullscreenViewportRef}
                        sx={{
                            flex: 1,
                            overflow: 'hidden',
                            position: 'relative',
                            bgcolor: '#fafafa'
                        }}
                    >
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                right: 8,
                                bottom: 8,
                                overflowX: 'hidden',
                                overflowY: 'auto'
                            }}
                        >
                            <Box
                                sx={{
                                    transform: `scale(${scale})`,
                                    transformOrigin: 'top left',
                                    width: 'fit-content',
                                    height: 'fit-content'
                                }}
                            >
                                <Box ref={fullscreenContentRef}>
                                    {renderScheduleTable({ fullscreen: true })}
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Dialog>
        </Card>
    )
}

export default ScheduleGrid


