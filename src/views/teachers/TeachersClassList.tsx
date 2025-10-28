'use client'

// React Imports
import { useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

// MUI Imports
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'

// Hooks
import { useClassList } from '@/@core/hooks/useClass'
import { useTeacherList } from '@/@core/hooks/useTeacher'

interface TeachersClassListProps {
  onDeleteTeacher?: (teacherId: string, teacherName: string, userId: string) => void
}

const TeachersClassList = ({ onDeleteTeacher }: TeachersClassListProps) => {
  const router = useRouter()
  const { data: teachers, isLoading, error } = useTeacherList()
  const { data: classes, isLoading: isClassesLoading } = useClassList()

  // State for search
  const [searchTerm, setSearchTerm] = useState('')

  // Get classes for each teacher
  const getTeacherClasses = (teacherId: string) => {
    if (!classes) return []

    return classes.filter(cls => cls.teacherId === teacherId)
  }

  // Filter teachers and classes based on search term
  const filteredTeachers = useMemo(() => {
    if (!teachers || !classes) return []

    if (!searchTerm.trim()) return teachers

    const searchLower = searchTerm.toLowerCase()

    return teachers.map(teacher => {
      const teacherClasses = getTeacherClasses(teacher.id)

      // Check if teacher matches search term
      const teacherMatch =
        teacher.name?.toLowerCase().includes(searchLower) ||
        teacher.skills?.some(skill =>
          skill.toLowerCase().includes(searchLower)
        )

      // Filter classes based on search term
      const filteredClasses = teacherClasses.filter(cls =>
        cls.name?.toLowerCase().includes(searchLower)
      )

      // Return teacher with filtered classes if teacher matches or has matching classes
      if (teacherMatch || filteredClasses.length > 0) {
        return {
          ...teacher,
          filteredClasses: teacherMatch ? teacherClasses : filteredClasses
        }
      }

      return null
    }).filter((teacher): teacher is NonNullable<typeof teacher> => teacher !== null) // Remove null entries
  }, [teachers, classes, searchTerm])

  if (isLoading || isClassesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Đang tải dữ liệu giáo viên và lớp...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          Lỗi khi tải dữ liệu: {error.message}
        </Typography>
      </Box>
    )
  }

  return (
    <Paper
      sx={{
        mb: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box sx={{
        backgroundColor: '#f8f9fa',
        p: 3,
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            <i className="ri-group-line" style={{ marginRight: '12px', fontSize: '24px', color: '#1976d2' }} />
            <Box>
              <Typography variant="h6" fontWeight={600} color="#1976d2">
                Danh sách giáo viên và lớp phụ trách
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {filteredTeachers.length} / {teachers?.length || 0} giáo viên • {classes?.length || 0} lớp học
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Search Box */}
        <TextField
          fullWidth
          placeholder="Tìm kiếm theo tên giáo viên, chuyên môn hoặc tên lớp..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <i className="ri-search-line" style={{ color: '#666' }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <i
                  className="ri-close-line"
                  style={{
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                  onClick={() => setSearchTerm('')}
                />
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white',
              '&:hover fieldset': {
                borderColor: '#1976d2',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#1976d2',
              },
            }
          }}
        />
      </Box>

      {/* Content */}
      <Box sx={{ p: 3 }}>
        {filteredTeachers.length > 0 ? (
          filteredTeachers.map((teacher) => {
            const teacherClasses = getTeacherClasses(teacher.id)
            const displayClasses = (teacher as any).filteredClasses || teacherClasses
            const totalStudents = displayClasses.reduce((sum: number, cls: any) => sum + (cls.totalStudent || 0), 0)

            return (
              <Box key={teacher.id} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ mr: 2, bgcolor: '#1976d2' }}>
                    <i className="ri-user-line" />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600}>
                      {teacher.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {teacher.skills?.join(', ') || 'Không có kỹ năng'}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', mr: 2 }}>
                    <Typography variant="h6" color="primary" fontWeight={600}>
                      {teacherClasses.length} lớp
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {totalStudents} học sinh
                    </Typography>
                  </Box>
                  {onDeleteTeacher && (
                    <Tooltip title="Xóa giáo viên">
                      <IconButton
                        color="error"
                        onClick={() => onDeleteTeacher(teacher.id, teacher.name, teacher.userId)}
                        sx={{
                          '&:hover': {
                            backgroundColor: '#ffebee'
                          }
                        }}
                      >
                        <i className="ri-delete-bin-line" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

                {displayClasses.length > 0 ? (
                  <Grid container spacing={2}>
                    {displayClasses.map((cls: any) => (
                      <Grid item xs={12} sm={6} md={4} key={cls.id}>
                        <Card
                          variant="outlined"
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              borderColor: '#1976d2',
                              backgroundColor: '#f5f5f5'
                            }
                          }}
                          onClick={() => router.push(`/classes/${cls.id}`)}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box display="flex" alignItems="center" mb={1}>
                              <i className="ri-book-line" style={{ color: '#1976d2', marginRight: '8px' }} />
                              <Typography variant="subtitle2" fontWeight={600}>
                                {cls.name || 'Không có tên'}
                              </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="textSecondary">
                                {cls.classType || 'Không xác định'}
                              </Typography>
                              <Chip
                                label={`${cls.totalStudent || 0} HS`}
                                size="small"
                                sx={{
                                  backgroundColor: '#e3f2fd',
                                  color: '#1976d2',
                                  fontSize: '0.7rem'
                                }}
                              />
                            </Box>
                            <Typography variant="caption" display="block" mt={1} color="textSecondary">
                              {cls.totalLessonPerWeek || 0} buổi/tuần
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    p={3}
                    sx={{
                      backgroundColor: '#f5f5f5',
                      borderRadius: 1,
                      border: '1px dashed #ccc'
                    }}
                  >
                    <i className="ri-inbox-line" style={{ marginRight: '8px', color: '#999' }} />
                    <Typography variant="body2" color="textSecondary">
                      Chưa có lớp nào được phân công
                    </Typography>
                  </Box>
                )}
              </Box>
            )
          })
        ) : (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={6}
            sx={{
              backgroundColor: '#f5f5f5',
              borderRadius: 2,
              border: '1px dashed #ccc'
            }}
          >
            <Box textAlign="center">
              <i className="ri-search-line" style={{ fontSize: '48px', color: '#999', marginBottom: '16px' }} />
              <Typography variant="h6" color="textSecondary" mb={1}>
                Không tìm thấy giáo viên
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {searchTerm ? `Không tìm thấy giáo viên hoặc lớp nào phù hợp với từ khóa "${searchTerm}"` : 'Chưa có giáo viên nào'}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  )
}

export default TeachersClassList 
