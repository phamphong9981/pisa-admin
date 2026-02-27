'use client'

import { useState, useMemo, useEffect } from 'react'
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
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Box,
    TablePagination,
    Autocomplete,
    RadioGroup,
    FormControlLabel,
    Radio,
    Checkbox,
    Toolbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Switch,
    Tooltip
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'

import { useSearchSchedule, SCHEDULE_TIME, RollcallStatus, useUpdateRollcallStatus, useLockScheduleByDate, useGetLockedScheduleDates, useExportSearchSchedule, type SearchScheduleParams } from '@/@core/hooks/useSchedule'
import { useGetWeeks } from '@/@core/hooks/useWeek'
import { useStudentList } from '@/@core/hooks/useStudent'
import { useTeacherList } from '@/@core/hooks/useTeacher'
import { RegionId, RegionLabel } from '@/@core/hooks/useCourse'
import useDebounce from '@/@core/hooks/useDebounce'
import useAuth from '@/@core/hooks/useAuth'
import { DatePicker } from '@/components/ui/date-picker'
import CreateLessonSchedule from '@/views/schedule/CreateLessonSchedule'
import { useClass } from '@/@core/hooks/useClass'
import { useCourseInfo } from '@/@core/hooks/useCourse'

// DebouncedInput Component
const DebouncedInput = ({
    value: initialValue,
    onChange,
    debounce = 300,
    ...props
}: {
    value: string;
    onChange: (value: string) => void;
    debounce?: number;
} & Omit<React.ComponentProps<typeof TextField>, 'onChange' | 'value'>) => {
    const [value, setValue] = useState(initialValue)

    // Đồng bộ hóa khi giá trị từ cha thay đổi (ví dụ khi bấm nút Reset)
    useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    // Xử lý debounce: Chỉ gọi onChange của cha sau khi ngừng gõ
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (value !== initialValue) {
                onChange(value)
            }
        }, debounce)

        return () => clearTimeout(timeout)
    }, [value, debounce, initialValue, onChange])

    return (
        <TextField
            {...props}
            value={value}
            onChange={(e) => setValue(e.target.value)}
        />
    )
}

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

// Filter mode type
type FilterMode = 'scheduleTime' | 'dateRange'

// Student option type
interface StudentOption {
    id: string
    profileId: string
    fullname: string
    email: string
}

const AttendanceView = () => {
    // Filter mode state
    const [filterMode, setFilterMode] = useState<FilterMode>('scheduleTime')

    // States
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedWeekId, setSelectedWeekId] = useState<string>('')
    const [selectedScheduleTimes, setSelectedScheduleTimes] = useState<number[]>([])
    const [selectedRollcallStatus, setSelectedRollcallStatus] = useState<string>('')
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(50)

    // Student search states
    const [studentSearchTerm, setStudentSearchTerm] = useState('')
    const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null)

    // Teacher search states
    const [teacherSearchTerm, setTeacherSearchTerm] = useState('')
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null)

    // Region filter state
    const [selectedRegion, setSelectedRegion] = useState<RegionId | null>(null)

    // Date range states
    const [startDate, setStartDate] = useState<string>('')
    const [endDate, setEndDate] = useState<string>('')
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

    // Batch selection states
    const [selectedSchedules, setSelectedSchedules] = useState<Set<string>>(new Set())
    const [batchStatus, setBatchStatus] = useState<RollcallStatus | ''>('')

    // Lock schedule dialog states
    const [lockDialogOpen, setLockDialogOpen] = useState(false)
    const [lockDate, setLockDate] = useState<string>('')


    // Debounce search (only for student and teacher search)
    const debouncedStudentSearch = useDebounce(studentSearchTerm, 300)
    const debouncedTeacherSearch = useDebounce(teacherSearchTerm, 300)

    // Auth hook for permission check
    const { hasPermission } = useAuth()
    const canAccessAccounting = hasPermission('accounting')

    // Hooks
    const { data: weeks } = useGetWeeks()

    // Fetch students for autocomplete
    const { data: studentsData, isLoading: isStudentsLoading } = useStudentList(debouncedStudentSearch)

    // Fetch teachers for autocomplete
    const { data: teachersData, isLoading: isTeachersLoading } = useTeacherList(debouncedTeacherSearch)

    // Student options for autocomplete
    const studentOptions = useMemo((): StudentOption[] => {
        if (!studentsData?.users) return []
        return studentsData.users.map(user => ({
            id: user.id,
            profileId: user.profile.id,
            fullname: user.profile.fullname,
            email: user.profile.email,
        }))
    }, [studentsData])

    // Handlers
    const updateRollcallMutation = useUpdateRollcallStatus()
    const lockScheduleMutation = useLockScheduleByDate()
    const { mutate: exportSchedule, isPending: isExporting } = useExportSearchSchedule()
    const { data: lockedDates, isLoading: isLockedDatesLoading, refetch: refetchLockedDates } = useGetLockedScheduleDates()

    const [editModalOpen, setEditModalOpen] = useState(false)
    const [editingSchedule, setEditingSchedule] = useState<any>(null)

    const { data: classData } = useClass(editingSchedule?.classId || '')
    const { data: courseInfo } = useCourseInfo(classData?.courseId || '', editingSchedule?.weekId || '')

    const availableStudents = useMemo(() => {
        return (courseInfo?.profileCourses || []).map(pc => ({
            id: pc.profile.id,
            fullname: pc.profile.fullname
        }))
    }, [courseInfo])

    const courseClasses = useMemo(() => {
        return (courseInfo?.classes || []).map(cls => ({
            id: cls.id,
            name: cls.name,
            teacherId: cls.teacherId,
            teacher: {
                id: cls.teacherId,
                name: cls.teacher.name,
                skills: cls.teacher?.skills || []
            }
        }))
    }, [courseInfo])

    // Optimistic UI updates to prevent items from disappearing immediately when status changes
    // and a status filter is active.
    const [localUpdates, setLocalUpdates] = useState<Record<string, { rollcallStatus?: RollcallStatus, reason?: string }>>({})

    // Clear local updates when search params (filters/page) change
    useEffect(() => {
        setLocalUpdates({})
    }, [selectedWeekId, selectedScheduleTimes, selectedRollcallStatus, selectedTeacherId, selectedRegion, startDate, endDate, searchTerm, selectedStudent, page])

    // Build search params
    const searchParams = useMemo((): SearchScheduleParams => {
        const params: SearchScheduleParams = {
            page: page + 1,
            limit: rowsPerPage,
        }

        // Add search term or profileId
        if (selectedStudent) {
            params.profileId = selectedStudent.profileId
        } else if (searchTerm) {
            params.search = searchTerm
        }

        // Add filters based on mode
        if (filterMode === 'scheduleTime') {
            if (selectedWeekId) params.weekId = selectedWeekId
            if (selectedScheduleTimes.length > 0) params.scheduleTimes = selectedScheduleTimes
        } else {
            if (startDate) params.startDate = startDate
            if (endDate) params.endDate = endDate
            // Allow schedule times filter in date range mode too
            if (selectedScheduleTimes.length > 0) params.scheduleTimes = selectedScheduleTimes
        }

        // Rollcall status filter
        if (selectedRollcallStatus) {
            params.rollcallStatus = selectedRollcallStatus
        }

        // Teacher filter
        if (selectedTeacherId) {
            params.teacherId = selectedTeacherId
        }

        // Region filter
        if (selectedRegion) {
            params.region = selectedRegion
        }

        return params
    }, [filterMode, selectedStudent, searchTerm, selectedWeekId, selectedScheduleTimes, startDate, endDate, selectedRollcallStatus, selectedTeacherId, selectedRegion, page, rowsPerPage])

    // Check if search is enabled
    const isSearchEnabled = useMemo(() => {
        // Need either search term, student selection, teacher selection, region, or date range
        const hasSearchOrStudent = !!searchTerm || !!selectedStudent || !!selectedTeacherId || !!selectedRegion

        if (filterMode === 'scheduleTime') {
            return hasSearchOrStudent || (!!selectedWeekId && selectedScheduleTimes.length > 0)
        } else {
            return hasSearchOrStudent || !!startDate || !!endDate || selectedScheduleTimes.length > 0
        }
    }, [filterMode, searchTerm, selectedStudent, selectedTeacherId, selectedRegion, selectedWeekId, selectedScheduleTimes, startDate, endDate])

    const { data: searchResults, isLoading, refetch: refetchSearch } = useSearchSchedule(searchParams, isSearchEnabled)

    // Validate and clean up selection when search results change
    useEffect(() => {
        if (searchResults?.data && selectedSchedules.size > 0) {
            const currentScheduleIds = new Set(searchResults.data.map(s => s.scheduleId))
            const validSelections = Array.from(selectedSchedules).filter(id => currentScheduleIds.has(id))
            if (validSelections.length !== selectedSchedules.size) {
                // Only keep valid selections
                setSelectedSchedules(new Set(validSelections))
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchResults?.data])

    const handleChangePage = (event: unknown, nextPage: number) => {
        setPage(nextPage)
    }

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10))
        setPage(0)
    }

    const handleFilterModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilterMode(event.target.value as FilterMode)
        setPage(0)
    }

    const handleReset = () => {
        setSearchTerm('')
        setSelectedStudent(null)
        setStudentSearchTerm('')
        setSelectedTeacherId(null)
        setTeacherSearchTerm('')
        setSelectedRegion(null)
        setSelectedWeekId('')
        setSelectedScheduleTimes([])
        setStartDate('')
        setEndDate('')
        setDateRange(undefined)
        setSelectedRollcallStatus('')
        setPage(0)
        setSelectedSchedules(new Set())
        setBatchStatus('')
    }

    // Format time to HH:MM
    const formatTime = (time?: string) => {
        if (!time) return ''
        const parts = time.split(':')
        if (parts.length >= 2) {
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
        }
        return time
    }

    const handleAttendanceChange = async (scheduleId: string, isAttending: boolean) => {
        const newStatus = isAttending ? RollcallStatus.ATTENDING : RollcallStatus.NOT_ROLLCALL

        // Optimistic update
        setLocalUpdates(prev => ({
            ...prev,
            [scheduleId]: { ...prev[scheduleId], rollcallStatus: newStatus, reason: isAttending ? '' : prev[scheduleId]?.reason }
        }))

        try {
            await updateRollcallMutation.mutateAsync([{
                scheduleId,
                rollcallStatus: newStatus,
                reason: isAttending ? '' : undefined // Clear reason if attending
            }])

            // Only refetch automatically if no status filter is active to prevent item disappearing
            if (!selectedRollcallStatus) {
                refetchSearch()
            }
        } catch (error) {
            console.error('Error updating status:', error)
            // Rollback on error
            setLocalUpdates(prev => {
                const next = { ...prev }
                delete next[scheduleId]
                return next
            })
        }
    }

    const handleStatusChange = async (scheduleId: string, status: RollcallStatus) => {
        // Optimistic update
        setLocalUpdates(prev => ({
            ...prev,
            [scheduleId]: { ...prev[scheduleId], rollcallStatus: status }
        }))

        try {
            await updateRollcallMutation.mutateAsync([{
                scheduleId,
                rollcallStatus: status
            }])

            // Only refetch automatically if no status filter is active
            if (!selectedRollcallStatus) {
                refetchSearch()
            }
        } catch (error) {
            console.error('Error updating status:', error)
            // Rollback on error
            setLocalUpdates(prev => {
                const next = { ...prev }
                delete next[scheduleId]
                return next
            })
        }
    }

    const handleReasonChange = async (scheduleId: string, currentStatus: string, newReason: string) => {
        // Optimistic update
        setLocalUpdates(prev => ({
            ...prev,
            [scheduleId]: { ...prev[scheduleId], reason: newReason }
        }))

        try {
            await updateRollcallMutation.mutateAsync([{
                scheduleId,
                rollcallStatus: currentStatus as RollcallStatus,
                reason: newReason
            }])

            // Refetch for reason change is usually safe as it won't trigger status filter
            refetchSearch()
        } catch (error) {
            console.error('Error updating reason:', error)
            // Rollback on error
            setLocalUpdates(prev => {
                const next = { ...prev }
                delete next[scheduleId]
                return next
            })
        }
    }

    // Batch selection handlers
    const handleSelectSchedule = (scheduleId: string) => {
        setSelectedSchedules(prev => {
            const newSet = new Set(prev)
            if (newSet.has(scheduleId)) {
                newSet.delete(scheduleId)
            } else {
                newSet.add(scheduleId)
            }
            return newSet
        })
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked && searchResults?.data) {
            setSelectedSchedules(new Set(searchResults.data.map(s => s.scheduleId)))
        } else {
            setSelectedSchedules(new Set())
        }
    }

    const handleBatchUpdate = async () => {
        if (selectedSchedules.size === 0 || !batchStatus) {
            return
        }

        try {
            const updates = Array.from(selectedSchedules).map(scheduleId => ({
                scheduleId,
                rollcallStatus: batchStatus as RollcallStatus
            }))
            await updateRollcallMutation.mutateAsync(updates)
            setSelectedSchedules(new Set())
            setBatchStatus('')
            refetchSearch()
        } catch (error) {
            console.error('Error updating batch status:', error)
        }
    }

    const isAllSelected = searchResults?.data && searchResults.data.length > 0 && selectedSchedules.size === searchResults.data.length
    const isIndeterminate = selectedSchedules.size > 0 && selectedSchedules.size < (searchResults?.data?.length || 0)

    // Lock schedule handlers
    const handleOpenLockDialog = () => {
        // Default to today's date
        setLockDate(format(new Date(), 'yyyy-MM-dd'))
        setLockDialogOpen(true)
        refetchLockedDates()
    }

    const handleCloseLockDialog = () => {
        setLockDialogOpen(false)
        setLockDate('')
    }

    const handleLockDate = async () => {
        if (!lockDate) return

        try {
            await lockScheduleMutation.mutateAsync({
                start_date: lockDate,
                is_locked: true
            })
            setLockDate('') // Reset date picker
            refetchLockedDates() // Refresh list
            refetchSearch() // Refresh schedule view
        } catch (error) {
            console.error('Error locking schedule:', error)
        }
    }

    const handleUnlockDate = async (dateStr: string) => {
        try {
            await lockScheduleMutation.mutateAsync({
                start_date: dateStr,
                is_locked: false
            })
            // Do not remove from list automatically? Or maybe we should?
            // The API says PUT false unlocks schedules but keeps the record.
            // Users might want to explicitly delete the record if they want it gone.
            refetchLockedDates()
            refetchSearch()
        } catch (error) {
            console.error('Error unlocking schedule:', error)
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
                action={
                    <Box display="flex" gap={2} flexWrap="wrap" justifyContent="flex-end">
                        <Button
                            variant="outlined"
                            color="success"
                            startIcon={isExporting ? <CircularProgress size={16} color="inherit" /> : <i className="ri-file-excel-2-line" />}
                            onClick={() => exportSchedule(searchParams)}
                            disabled={isExporting || (searchResults?.data?.length === 0)}
                            sx={{ mt: 1 }}
                        >
                            {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
                        </Button>
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<i className="ri-refresh-line" />}
                            onClick={() => {
                                setLocalUpdates({})
                                refetchSearch()
                            }}
                            sx={{ mt: 1 }}
                        >
                            Tải lại danh sách
                        </Button>
                        {canAccessAccounting && (
                            <Button
                                variant="contained"
                                color="warning"
                                startIcon={<i className="ri-lock-line" />}
                                onClick={handleOpenLockDialog}
                                sx={{ mt: 1 }}
                            >
                                Khóa sổ điểm danh
                            </Button>
                        )}
                    </Box>
                }
            />

            <CardContent>
                {/* Filter Mode Selection */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Chế độ lọc:</Typography>
                    <RadioGroup
                        row
                        value={filterMode}
                        onChange={handleFilterModeChange}
                    >
                        <FormControlLabel
                            value="scheduleTime"
                            control={<Radio size="small" />}
                            label={
                                <Box display="flex" alignItems="center" gap={0.5}>
                                    <i className="ri-time-line" />
                                    <span>Theo tuần & ca học</span>
                                </Box>
                            }
                        />
                        <FormControlLabel
                            value="dateRange"
                            control={<Radio size="small" />}
                            label={
                                <Box display="flex" alignItems="center" gap={0.5}>
                                    <i className="ri-calendar-2-line" />
                                    <span>Theo khoảng ngày</span>
                                </Box>
                            }
                        />
                    </RadioGroup>
                </Box>

                {/* Filters */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {/* Text Search */}
                    <Grid item xs={12} md={3}>
                        <DebouncedInput
                            fullWidth
                            label="Tìm kiếm"
                            placeholder="Nhập tên học sinh, email hoặc tên khóa học..."
                            value={searchTerm}
                            debounce={300}
                            onChange={(value) => {
                                setSearchTerm(value)
                                setSelectedStudent(null) // Clear student selection when typing
                                setPage(0)
                            }}
                            disabled={!!selectedStudent}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <i className="ri-search-line" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    {/* Student Autocomplete */}
                    <Grid item xs={12} md={3}>
                        <Autocomplete
                            fullWidth
                            options={studentOptions}
                            value={selectedStudent}
                            getOptionLabel={(option) => `${option.fullname} (${option.email})`}
                            isOptionEqualToValue={(option, value) => option.profileId === value.profileId}
                            loading={isStudentsLoading}
                            inputValue={studentSearchTerm}
                            onInputChange={(_, newValue, reason) => {
                                if (reason === 'input' || reason === 'clear') {
                                    setStudentSearchTerm(newValue)
                                }
                            }}
                            onChange={(_, value) => {
                                setSelectedStudent(value)
                                if (value) {
                                    setSearchTerm('') // Clear text search when selecting student
                                }
                                setPage(0)
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Chọn học sinh cụ thể"
                                    placeholder="Nhập tên để tìm..."
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                            <>
                                                <InputAdornment position="start">
                                                    <i className="ri-user-search-line" />
                                                </InputAdornment>
                                                {params.InputProps.startAdornment}
                                            </>
                                        ),
                                        endAdornment: (
                                            <>
                                                {isStudentsLoading ? <CircularProgress color="inherit" size={16} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        )
                                    }}
                                />
                            )}
                            renderOption={(props, option) => (
                                <Box component="li" {...props} key={option.profileId}>
                                    <Box>
                                        <Typography variant="body2" fontWeight={500}>{option.fullname}</Typography>
                                        <Typography variant="caption" color="text.secondary">{option.email}</Typography>
                                    </Box>
                                </Box>
                            )}
                            noOptionsText={studentSearchTerm ? "Không tìm thấy học sinh" : "Nhập để tìm kiếm"}
                        />
                    </Grid>

                    {/* Teacher Autocomplete */}
                    <Grid item xs={12} md={3}>
                        <Autocomplete
                            fullWidth
                            options={teachersData || []}
                            value={teachersData?.find(t => t.id === selectedTeacherId) || null}
                            getOptionLabel={(option) => option.name || ''}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            loading={isTeachersLoading}
                            inputValue={teacherSearchTerm}
                            onInputChange={(_, newValue, reason) => {
                                if (reason === 'input' || reason === 'clear') {
                                    setTeacherSearchTerm(newValue)
                                }
                            }}
                            onChange={(_, value) => {
                                setSelectedTeacherId(value?.id || null)
                                setPage(0)
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Chọn giáo viên"
                                    placeholder="Nhập tên để tìm..."
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                            <>
                                                <InputAdornment position="start">
                                                    <i className="ri-user-star-line" />
                                                </InputAdornment>
                                                {params.InputProps.startAdornment}
                                            </>
                                        ),
                                        endAdornment: (
                                            <>
                                                {isTeachersLoading ? <CircularProgress color="inherit" size={16} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        )
                                    }}
                                />
                            )}
                            renderOption={(props, option) => (
                                <Box component="li" {...props} key={option.id}>
                                    <Box>
                                        <Typography variant="body2" fontWeight={500}>{option.name}</Typography>
                                        {option.username && (
                                            <Typography variant="caption" color="text.secondary">{option.username}</Typography>
                                        )}
                                    </Box>
                                </Box>
                            )}
                            noOptionsText={teacherSearchTerm ? "Không tìm thấy giáo viên" : "Nhập để tìm kiếm"}
                        />
                    </Grid>

                    {/* Rollcall Status Filter */}
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Trạng thái điểm danh</InputLabel>
                            <Select
                                value={selectedRollcallStatus}
                                label="Trạng thái điểm danh"
                                onChange={(e) => {
                                    setSelectedRollcallStatus(e.target.value)
                                    setPage(0)
                                }}
                            >
                                <MenuItem value=''>Tất cả</MenuItem>
                                <MenuItem value={RollcallStatus.NOT_ROLLCALL}>Chưa điểm danh</MenuItem>
                                <MenuItem value={RollcallStatus.ATTENDING}>Có mặt</MenuItem>
                                <MenuItem value={RollcallStatus.ABSENT_WITHOUT_REASON}>Vắng mặt</MenuItem>
                                <MenuItem value={RollcallStatus.TRIAL}>Học thử</MenuItem>
                                <MenuItem value={RollcallStatus.RETAKE}>Học lại</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Region Filter */}
                    <Grid item xs={12} md={3}>
                        <Autocomplete
                            fullWidth
                            options={Object.values(RegionId).filter((v): v is RegionId => typeof v === 'number')}
                            value={selectedRegion}
                            getOptionLabel={(option) => RegionLabel[option]}
                            onChange={(_, value) => {
                                setSelectedRegion(value)
                                setPage(0)
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Cơ sở"
                                    placeholder="Chọn cơ sở..."
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                            <>
                                                <InputAdornment position="start">
                                                    <i className="ri-map-pin-line" />
                                                </InputAdornment>
                                                {params.InputProps.startAdornment}
                                            </>
                                        )
                                    }}
                                />
                            )}
                            renderOption={(props, option) => (
                                <Box component="li" {...props} key={option}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <i className="ri-map-pin-fill" style={{ color: '#1976d2' }} />
                                        <Typography variant="body2">{RegionLabel[option]}</Typography>
                                    </Box>
                                </Box>
                            )}
                            noOptionsText="Không có cơ sở nào"
                        />
                    </Grid>

                    {/* Conditional filters based on mode */}
                    {filterMode === 'scheduleTime' ? (
                        <>
                            <Grid item xs={12} md={2}>
                                <FormControl fullWidth>
                                    <InputLabel>Tuần học</InputLabel>
                                    <Select
                                        value={selectedWeekId}
                                        label="Tuần học"
                                        onChange={(e) => {
                                            setSelectedWeekId(e.target.value)
                                            setPage(0)
                                        }}
                                    >
                                        <MenuItem value="">Tất cả các tuần</MenuItem>
                                        {weeks?.map((week) => {
                                            const weekStartDate = new Date(week.startDate)
                                            const weekEndDate = new Date(weekStartDate)
                                            weekEndDate.setDate(weekEndDate.getDate() + 6)

                                            return (
                                                <MenuItem key={week.id} value={week.id}>
                                                    {format(weekStartDate, 'dd/MM/yyyy')} - {format(weekEndDate, 'dd/MM/yyyy')}
                                                </MenuItem>
                                            )
                                        })}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Autocomplete
                                    multiple
                                    fullWidth
                                    options={SCHEDULE_TIME.map((_, index) => index + 1)}
                                    value={selectedScheduleTimes}
                                    getOptionLabel={(option) => SCHEDULE_TIME[option - 1]}
                                    onChange={(_, newValue) => {
                                        setSelectedScheduleTimes(newValue)
                                        setPage(0)
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Khung giờ"
                                            placeholder="Chọn khung giờ..."
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: (
                                                    <>
                                                        <InputAdornment position="start">
                                                            <i className="ri-time-line" />
                                                        </InputAdornment>
                                                        {params.InputProps.startAdornment}
                                                    </>
                                                )
                                            }}
                                        />
                                    )}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip
                                                {...getTagProps({ index })}
                                                key={option}
                                                label={SCHEDULE_TIME[option - 1]}
                                                size="small"
                                            />
                                        ))
                                    }
                                    renderOption={(props, option) => (
                                        <Box component="li" {...props} key={option}>
                                            <Typography variant="body2">{SCHEDULE_TIME[option - 1]}</Typography>
                                        </Box>
                                    )}
                                    noOptionsText="Không có khung giờ nào"
                                />
                            </Grid>
                        </>
                    ) : (
                        <>
                            <Grid item xs={12} md={4}>
                                <DatePicker
                                    dateRange={dateRange}
                                    onSelect={(range) => {
                                        setDateRange(range)
                                        setStartDate(range?.from ? format(range.from, 'yyyy-MM-dd') : '')
                                        setEndDate(range?.to ? format(range.to, 'yyyy-MM-dd') : '')
                                        setPage(0)
                                    }}
                                    placeholder="Chọn khoảng ngày"
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Autocomplete
                                    multiple
                                    fullWidth
                                    options={SCHEDULE_TIME.map((_, index) => index + 1)}
                                    value={selectedScheduleTimes}
                                    getOptionLabel={(option) => SCHEDULE_TIME[option - 1]}
                                    onChange={(_, newValue) => {
                                        setSelectedScheduleTimes(newValue)
                                        setPage(0)
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Khung giờ"
                                            placeholder="Chọn khung giờ..."
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: (
                                                    <>
                                                        <InputAdornment position="start">
                                                            <i className="ri-time-line" />
                                                        </InputAdornment>
                                                        {params.InputProps.startAdornment}
                                                    </>
                                                )
                                            }}
                                        />
                                    )}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip
                                                {...getTagProps({ index })}
                                                key={option}
                                                label={SCHEDULE_TIME[option - 1]}
                                                size="small"
                                            />
                                        ))
                                    }
                                    renderOption={(props, option) => (
                                        <Box component="li" {...props} key={option}>
                                            <Typography variant="body2">{SCHEDULE_TIME[option - 1]}</Typography>
                                        </Box>
                                    )}
                                    noOptionsText="Không có khung giờ nào"
                                />
                            </Grid>
                        </>
                    )}
                </Grid>

                {/* Reset Button */}
                <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button
                        variant="outlined"
                        onClick={handleReset}
                        startIcon={<i className="ri-refresh-line" />}
                        size="small"
                    >
                        Đặt lại bộ lọc
                    </Button>
                    {selectedStudent && (
                        <Chip
                            label={`Đang lọc: ${selectedStudent.fullname}`}
                            color="primary"
                            onDelete={() => setSelectedStudent(null)}
                            size="small"
                        />
                    )}
                    {selectedRegion && (
                        <Chip
                            label={`Cơ sở: ${RegionLabel[selectedRegion]}`}
                            color="info"
                            onDelete={() => setSelectedRegion(null)}
                            size="small"
                            icon={<i className="ri-map-pin-line" style={{ fontSize: '14px' }} />}
                        />
                    )}
                </Box>

                {/* Results */}
                {isLoading ? (
                    <Box display="flex" justifyContent="center" py={5}>
                        <CircularProgress />
                    </Box>
                ) : !isSearchEnabled ? (
                    <Box textAlign="center" py={5} sx={{ color: 'text.secondary' }}>
                        <i className="ri-search-line" style={{ fontSize: 48, marginBottom: 8, display: 'block', opacity: 0.3 }} />
                        <Typography>
                            Nhập từ khóa tìm kiếm, chọn học sinh, hoặc chọn bộ lọc để bắt đầu
                        </Typography>
                    </Box>
                ) : !searchResults?.data || searchResults.data.length === 0 ? (
                    <Box textAlign="center" py={5} sx={{ color: 'text.secondary' }}>
                        <i className="ri-calendar-line" style={{ fontSize: 48, marginBottom: 8, display: 'block' }} />
                        <Typography>
                            Không tìm thấy kết quả nào phù hợp
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {/* Batch Action Toolbar */}
                        {selectedSchedules.size > 0 && (
                            <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                <Typography variant="body2" fontWeight={600}>
                                    Đã chọn: {selectedSchedules.size} mục
                                </Typography>
                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <InputLabel>Trạng thái điểm danh</InputLabel>
                                    <Select
                                        value={batchStatus}
                                        label="Trạng thái điểm danh"
                                        onChange={(e) => setBatchStatus(e.target.value as RollcallStatus)}
                                    >
                                        <MenuItem value={RollcallStatus.ATTENDING}>Có mặt</MenuItem>
                                        <MenuItem value={RollcallStatus.ABSENT_WITHOUT_REASON}>Vắng mặt</MenuItem>
                                        <MenuItem value={RollcallStatus.TRIAL}>Học thử</MenuItem>
                                        <MenuItem value={RollcallStatus.RETAKE}>Học lại</MenuItem>
                                        <MenuItem value={RollcallStatus.NOT_ROLLCALL}>Chưa điểm danh</MenuItem>
                                    </Select>
                                </FormControl>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    onClick={handleBatchUpdate}
                                    disabled={!batchStatus || updateRollcallMutation.isPending}
                                    startIcon={
                                        updateRollcallMutation.isPending ? (
                                            <CircularProgress size={16} color="inherit" />
                                        ) : (
                                            <i className="ri-check-line" />
                                        )
                                    }
                                >
                                    Áp dụng cho {selectedSchedules.size} mục đã chọn
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                        setSelectedSchedules(new Set())
                                        setBatchStatus('')
                                    }}
                                    startIcon={<i className="ri-close-line" />}
                                >
                                    Hủy chọn
                                </Button>
                            </Box>
                        )}

                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <StyledTableCell padding="checkbox">
                                            <Checkbox
                                                indeterminate={isIndeterminate}
                                                checked={isAllSelected}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                color="primary"
                                            />
                                        </StyledTableCell>
                                        <StyledTableCell>Học sinh</StyledTableCell>
                                        <StyledTableCell>Lớp / Khóa học</StyledTableCell>
                                        <StyledTableCell>Cơ sở</StyledTableCell>
                                        <StyledTableCell>Ngày học</StyledTableCell>
                                        <StyledTableCell>Thời gian</StyledTableCell>
                                        <StyledTableCell align="center">Điểm danh</StyledTableCell>
                                        <StyledTableCell>Lý do</StyledTableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {searchResults.data.map((schedule) => {
                                        const isAttending = schedule.rollcallStatus === RollcallStatus.ATTENDING
                                        const isSelected = selectedSchedules.has(schedule.scheduleId)
                                        return (
                                            <TableRow key={schedule.scheduleId} hover selected={isSelected}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onChange={() => handleSelectSchedule(schedule.scheduleId)}
                                                        color="primary"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {schedule.profileFullname}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {schedule.profilePhone}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={600}
                                                            color={canAccessAccounting ? "primary" : "text.primary"}
                                                            onClick={() => {
                                                                if (canAccessAccounting) {
                                                                    setEditingSchedule(schedule)
                                                                    setEditModalOpen(true)
                                                                }
                                                            }}
                                                            sx={canAccessAccounting ? {
                                                                cursor: 'pointer',
                                                                '&:hover': { textDecoration: 'underline' }
                                                            } : {}}
                                                        >
                                                            {schedule.className} {schedule.teacherName ? `- ${schedule.teacherName}` : ''}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                            {schedule.courseName}
                                                        </Typography>
                                                        {schedule.scheduleInfoNote && (
                                                            <Tooltip title="Ghi chú ca học" arrow placement="top">
                                                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mt: 0.5, color: '#ef6c00', bgcolor: '#fff3e0', p: 0.5, borderRadius: 1, border: '1px solid', borderColor: '#ffcc80' }}>
                                                                    <i className="ri-information-line" style={{ marginTop: '1px', fontSize: '14px' }} />
                                                                    {schedule.scheduleInfoNote}
                                                                </Typography>
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    {schedule.courseRegion ? (
                                                        <Chip
                                                            label={RegionLabel[schedule.courseRegion as RegionId] || `Cơ sở ${schedule.courseRegion}`}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: '#e3f2fd',
                                                                color: '#1976d2',
                                                                fontWeight: 500,
                                                                fontSize: '0.75rem'
                                                            }}
                                                            icon={<i className="ri-map-pin-line" style={{ fontSize: '14px' }} />}
                                                        />
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">
                                                            —
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {schedule.scheduleDate
                                                            ? new Date(schedule.scheduleDate).toLocaleDateString('vi-VN', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric'
                                                            })
                                                            : '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                                        {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center" sx={{ minWidth: 200 }}>
                                                    {(() => {
                                                        const currentStatus = localUpdates[schedule.scheduleId]?.rollcallStatus || schedule.rollcallStatus
                                                        const isItemAttending = currentStatus === RollcallStatus.ATTENDING

                                                        return (
                                                            <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                                                <Box
                                                                    sx={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        cursor: 'pointer',
                                                                        border: isItemAttending ? '1px solid #2e7d32' : '1px solid #e0e0e0',
                                                                        borderRadius: '8px',
                                                                        px: 1.5,
                                                                        py: 0.5,
                                                                        bgcolor: isItemAttending ? '#e8f5e8' : 'transparent',
                                                                        transition: 'all 0.2s',
                                                                        '&:hover': { bgcolor: isItemAttending ? '#c8e6c9' : '#f5f5f5' }
                                                                    }}
                                                                    onClick={() => handleAttendanceChange(schedule.scheduleId, !isItemAttending)}
                                                                >
                                                                    <i
                                                                        className={isItemAttending ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'}
                                                                        style={{
                                                                            fontSize: 20,
                                                                            color: isItemAttending ? '#2e7d32' : '#757575',
                                                                            marginRight: 8
                                                                        }}
                                                                    />
                                                                    <Typography
                                                                        variant="body2"
                                                                        color={isItemAttending ? 'success.main' : 'text.primary'}
                                                                        fontWeight={isItemAttending ? 600 : 400}
                                                                    >
                                                                        Có mặt
                                                                    </Typography>
                                                                </Box>

                                                                {!isItemAttending && (
                                                                    <Select
                                                                        size="small"
                                                                        value={currentStatus}
                                                                        onChange={(e) => handleStatusChange(schedule.scheduleId, e.target.value as RollcallStatus)}
                                                                        sx={{ minWidth: 150, '.MuiSelect-select': { py: 0.75, fontSize: '0.875rem' } }}
                                                                        displayEmpty
                                                                    >
                                                                        <MenuItem value={RollcallStatus.NOT_ROLLCALL}>Chưa điểm danh</MenuItem>
                                                                        <MenuItem value={RollcallStatus.ABSENT_WITHOUT_REASON}>Vắng mặt</MenuItem>
                                                                        <MenuItem value={RollcallStatus.TRIAL}>Học thử</MenuItem>
                                                                        <MenuItem value={RollcallStatus.RETAKE}>Học lại</MenuItem>
                                                                    </Select>
                                                                )}
                                                            </Box>
                                                        )
                                                    })()}
                                                </TableCell>
                                                <TableCell sx={{ minWidth: 200 }}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        placeholder="Nhập lý do..."
                                                        defaultValue={localUpdates[schedule.scheduleId]?.reason ?? (schedule.reason || '')}
                                                        onBlur={(e) => {
                                                            const newVal = e.target.value
                                                            const currentLocalReason = localUpdates[schedule.scheduleId]?.reason
                                                            const effectiveCurrentReason = currentLocalReason ?? (schedule.reason || '')
                                                            if (newVal !== effectiveCurrentReason) {
                                                                handleReasonChange(schedule.scheduleId, localUpdates[schedule.scheduleId]?.rollcallStatus || schedule.rollcallStatus, newVal)
                                                            }
                                                        }}
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': {
                                                                bgcolor: 'white',
                                                                '& fieldset': {
                                                                    borderColor: 'transparent',
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
                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50, 100, 200, 400]}
                            component="div"
                            count={searchResults.total}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            labelRowsPerPage="Số dòng mỗi trang:"
                            labelDisplayedRows={({ from, to, count }) => `${from}-${to} trong ${count}`}
                        />
                    </>
                )}
            </CardContent>

            {/* Lock Schedule Dialog */}
            <Dialog open={lockDialogOpen} onClose={handleCloseLockDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <i className="ri-lock-2-line" style={{ color: '#ed6c02', fontSize: 24 }} />
                        <Typography variant="h6">Quản lý khóa sổ điểm danh</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 3, mt: 1 }}>
                        <Typography variant="body2">
                            Khóa sổ giúp ngăn chặn việc chỉnh sửa điểm danh và lịch học trong những ngày đã chọn.
                            Bạn có thể mở khóa lại khi cần thiết.
                        </Typography>
                    </Alert>

                    {/* Add Lock Section */}
                    <Box sx={{ mb: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid #eee' }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <i className="ri-add-circle-line" />
                            Thêm ngày khóa sổ mới
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    size="small"
                                    label="Chọn ngày khóa"
                                    value={lockDate}
                                    onChange={(e) => setLockDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Button
                                    variant="contained"
                                    color="warning"
                                    onClick={handleLockDate}
                                    disabled={!lockDate || lockScheduleMutation.isPending}
                                    startIcon={lockScheduleMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <i className="ri-lock-fill" />}
                                >
                                    Khóa sổ ngày này
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Locked List Section */}
                    <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <i className="ri-list-check" />
                        Danh sách các ngày đã khóa
                    </Typography>

                    {isLockedDatesLoading ? (
                        <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : !lockedDates || lockedDates.length === 0 ? (
                        <Box textAlign="center" py={4} bgcolor="grey.50" borderRadius={1} sx={{ borderStyle: 'dashed', borderWidth: 1, borderColor: 'grey.300' }}>
                            <Typography variant="body2" color="text.secondary">Chưa có ngày nào bị khóa</Typography>
                        </Box>
                    ) : (
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', maxHeight: 300 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Ngày khóa</TableCell>
                                        <TableCell>Thời gian tạo</TableCell>
                                        <TableCell align="right">Thao tác</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {lockedDates.map((item) => (
                                        <TableRow key={item.id} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {format(new Date(item.lockDate), 'dd/MM/yyyy')}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color="text.secondary">
                                                    {format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm')}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box display="flex" justifyContent="flex-end" gap={1}>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="success"
                                                        onClick={() => handleUnlockDate(item.lockDate)}
                                                        disabled={lockScheduleMutation.isPending}
                                                        startIcon={<i className="ri-lock-unlock-line" />}
                                                    >
                                                        Mở khóa
                                                    </Button>

                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleCloseLockDialog} color="inherit">
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>

            {editingSchedule && (
                <CreateLessonSchedule
                    open={editModalOpen}
                    onClose={() => {
                        setEditModalOpen(false)
                        setEditingSchedule(null)
                        refetchSearch()
                    }}
                    selectedSlot={{
                        day: '', // Parsed in CreateLessonSchedule
                        time: '',
                        slotIndex: editingSchedule.scheduleTime
                    }}
                    availableStudents={availableStudents}
                    courseClasses={courseClasses}
                    weekId={editingSchedule.weekId}
                    editMode={true}
                    editData={{
                        classId: editingSchedule.classId,
                        lesson: editingSchedule.lesson,
                        teacherName: editingSchedule.teacherName || '',
                        className: editingSchedule.className,
                        scheduleTime: editingSchedule.scheduleTime
                    }}
                />
            )}
        </Card>
    )
}

export default AttendanceView
