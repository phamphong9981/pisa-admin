'use client'

// React Imports
import { useMemo, useState } from 'react'

// Styled Components
import { styled } from '@mui/material/styles'

// MUI Imports
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Paper,
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
import { SCHEDULE_TIME } from '@/@core/hooks/useSchedule'
import { useCourseInfo, useCourseList } from '@/@core/hooks/useCourse'

const StyledHeaderCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 700,
  backgroundColor: theme.palette.grey[100],
  color: theme.palette.text.primary,
  borderBottom: `2px solid ${theme.palette.divider}`,
  fontSize: '0.9rem',
  position: 'sticky',
  top: 0,
  zIndex: 1
}))

const DayCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: theme.palette.grey[50],
  borderRight: `1px solid ${theme.palette.divider}`,
  minWidth: 140
}))

const GridCell = styled(TableCell)(({ theme }) => ({
  verticalAlign: 'top',
  padding: theme.spacing(1),
  minWidth: 220,
  borderRight: `1px solid ${theme.palette.divider}`
}))

const SchedulePlanner = () => {
  const { data: courses, isLoading: isCoursesLoading, error: coursesError } = useCourseList()
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const { data: courseInfo, isLoading: isCourseInfoLoading, error: courseInfoError } = useCourseInfo(selectedCourseId)
  const [classSearch, setClassSearch] = useState<string>('')

  // Parse SCHEDULE_TIME into day + time
  const parsedSlots = useMemo(() => {
    return SCHEDULE_TIME.map((s) => {
      const [time, day] = s.split(' ')
      return { time, day }
    })
  }, [])

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

  const indexFromDayTime = (day: string, time: string) => {
    const idx = parsedSlots.findIndex(p => p.day === day && p.time === time)
    return idx >= 0 ? idx + 1 : -1
  }

  const freeStudentsByIndex = useMemo(() => {
    const map: Record<number, { id: string; fullname: string }[]> = {}
    if (!courseInfo) return map
    const profiles = (courseInfo.profileCourses || []).map(pc => pc.profile)

    for (let i = 1; i <= SCHEDULE_TIME.length; i++) {
      map[i] = profiles
        .filter(p => !(p.busyScheduleArr || []).includes(i))
        .map(p => ({ id: p.id, fullname: p.fullname }))
    }

    return map
  }, [courseInfo])

  const filteredClasses = useMemo(() => {
    const cls = courseInfo?.classes || []
    if (!classSearch.trim()) return cls
    const keyword = classSearch.toLowerCase()
    return cls.filter(c => c.name.toLowerCase().includes(keyword))
  }, [courseInfo, classSearch])

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardHeader title="Xếp lịch học theo khóa học" subheader="Chọn khóa học để xem lưới thời gian và các học sinh rảnh trong từng khung giờ" />
        <CardContent>
          <Box display="flex" gap={1} flexWrap="wrap">
            {isCoursesLoading ? (
              <CircularProgress size={20} />
            ) : coursesError ? (
              <Alert severity="error">Lỗi tải danh sách khóa học: {coursesError.message}</Alert>
            ) : (courses || []).map(course => (
              <Chip
                key={course.id}
                label={course.name}
                color={selectedCourseId === course.id ? 'primary' : 'default'}
                variant={selectedCourseId === course.id ? 'filled' : 'outlined'}
                onClick={() => setSelectedCourseId(course.id)}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {selectedCourseId ? (
        <Card>
          <CardHeader title="Lưới học sinh rảnh theo khung giờ" />
          <CardContent>
            <Box display="flex" gap={1} alignItems="center" mb={2} flexWrap="wrap">
              <TextField
                label="Tìm lớp"
                size="small"
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
              />
              <Box display="flex" gap={0.5} flexWrap="wrap">
                {filteredClasses.map(cls => (
                  <Chip key={cls.id} size="small" label={cls.name} />
                ))}
                {filteredClasses.length === 0 && (
                  <Typography variant="caption" color="text.secondary">Không có lớp phù hợp</Typography>
                )}
              </Box>
            </Box>

            {isCourseInfoLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : courseInfoError ? (
              <Alert severity="error">Lỗi tải thông tin khóa học: {courseInfoError.message}</Alert>
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <StyledHeaderCell>Thứ / Giờ</StyledHeaderCell>
                      {times.map(t => (
                        <StyledHeaderCell key={t} align="center">{t}</StyledHeaderCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {days.map(day => (
                      <TableRow key={day} hover={false}>
                        <DayCell>{day}</DayCell>
                        {times.map(time => {
                          const index = indexFromDayTime(day, time)
                          const free = index > 0 ? (freeStudentsByIndex[index] || []) : []
                          return (
                            <GridCell key={`${day}|${time}`}>
                              <Box display="flex" gap={0.5} flexDirection="column">
                                {free.length === 0 ? (
                                  <Typography variant="caption" color="text.secondary">Không có HS rảnh</Typography>
                                ) : (
                                  <Box display="flex" gap={0.5} flexWrap="wrap">
                                    {free.map(s => (
                                      <Chip key={s.id} size="small" label={s.fullname} />
                                    ))}
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
            )}
          </CardContent>
        </Card>
      ) : (
        <Alert severity="info">Hãy chọn một khóa học để xem lưới học sinh rảnh.</Alert>
      )}
    </Box>
  )
}

export default SchedulePlanner


