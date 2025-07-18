'use client'

// React Imports
import { useState } from 'react'

import { useRouter } from 'next/navigation'

// MUI Imports
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography
} from '@mui/material'

// Hooks
import { useTeacherList } from '@/@core/hooks/useTeacher'
import { useClassList } from '@/@core/hooks/useClass'

const TeachersClassList = () => {
  const router = useRouter()
  const { data: teachers, isLoading, error } = useTeacherList()
  const { data: classes, isLoading: isClassesLoading } = useClassList()
  
  // State for accordion expansion
  const [expanded, setExpanded] = useState<string | false>('panel1')

  // Get classes for each teacher
  const getTeacherClasses = (teacherId: string) => {
    if (!classes) return []
    
return classes.filter(cls => cls.teacherId === teacherId)
  }

  // Handle accordion expansion
  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

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
    <Accordion 
      expanded={expanded === 'panel1'} 
      onChange={handleAccordionChange('panel1')}
      sx={{ 
        mb: 3,
        '&:before': {
          display: 'none',
        },
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: 2
      }}
    >
      <AccordionSummary
        expandIcon={<i className="ri-arrow-down-s-line" style={{ fontSize: '20px', color: '#1976d2' }} />}
        sx={{
          backgroundColor: '#f8f9fa',
          borderBottom: expanded === 'panel1' ? '1px solid #e0e0e0' : 'none',
          '&:hover': {
            backgroundColor: '#e3f2fd'
          }
        }}
      >
        <Box display="flex" alignItems="center" width="100%">
          <i className="ri-group-line" style={{ marginRight: '12px', fontSize: '24px', color: '#1976d2' }} />
          <Box>
            <Typography variant="h6" fontWeight={600} color="#1976d2">
              Danh sách giáo viên và lớp phụ trách
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {teachers?.length || 0} giáo viên • {classes?.length || 0} lớp học
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      
      <AccordionDetails sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {teachers?.map((teacher) => {
            const teacherClasses = getTeacherClasses(teacher.id)
            const totalStudents = teacherClasses.reduce((sum, cls) => sum + (cls.totalStudent || 0), 0)
            
            return (
              <Box key={teacher.id} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ mr: 2, bgcolor: '#1976d2' }}>
                    <i className="ri-user-line" />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {teacher.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {teacher.skills?.join(', ') || 'Không có kỹ năng'}
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                    <Typography variant="h6" color="primary" fontWeight={600}>
                      {teacherClasses.length} lớp
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {totalStudents} học sinh
                    </Typography>
                  </Box>
                </Box>
                
                {teacherClasses.length > 0 ? (
                  <Grid container spacing={2}>
                    {teacherClasses.map((cls) => (
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
          })}
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}

export default TeachersClassList 
