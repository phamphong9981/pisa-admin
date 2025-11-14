'use client'

import { useState, useCallback } from 'react'
import {
    Box,
    Button,
    Typography,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Link
} from '@mui/material'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'

import { ClassType } from '@/types/classes'
import type { CreateClassDto } from '@/@core/hooks/useClass'
import { useCreateClassBulk } from '@/@core/hooks/useClass'
import { useTeacherList } from '@/@core/hooks/useTeacher'

interface ParsedClassRow {
    courseName: string
    className: string
    classType: string
    teacherName: string
    autoSchedule: string
}

interface ProcessedClass extends CreateClassDto {
    originalTeacherName: string
    rowIndex: number
}

interface ImportClassesFromCSVProps {
    courseId: string
    onSuccess?: () => void
    open: boolean
    onClose: () => void
}

const ImportClassesFromCSV = ({ courseId, onSuccess, open, onClose }: ImportClassesFromCSVProps) => {
    const [csvData, setCsvData] = useState<ParsedClassRow[]>([])
    const [processedClasses, setProcessedClasses] = useState<ProcessedClass[]>([])
    const [errors, setErrors] = useState<string[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [showPreview, setShowPreview] = useState(false)

    const { data: teachers, isLoading: isLoadingTeachers } = useTeacherList()
    const createClassMutation = useCreateClassBulk(courseId)

    // Map teacher name to teacher ID
    const getTeacherIdByName = useCallback((teacherName: string): string | null => {
        if (!teachers) return null

        // Normalize teacher name for comparison
        const normalizedName = teacherName.trim().toLowerCase()

        const teacher = teachers.find(t => {
            const tName = t.name.trim().toLowerCase()
            return tName === normalizedName ||
                tName.includes(normalizedName) ||
                normalizedName.includes(tName)
        })

        return teacher?.id || null
    }, [teachers])

    // Map class type string to ClassType enum
    const getClassType = (classTypeStr: string): ClassType => {
        const normalized = classTypeStr.trim().toLowerCase()

        if (normalized.includes('listening') || normalized.includes('nghe')) {
            return ClassType.FT_LISTENING
        }
        if (normalized.includes('reading') || normalized.includes('đọc')) {
            return ClassType.FT_READING
        }
        if (normalized.includes('writing') || normalized.includes('viết')) {
            return ClassType.FT_WRITING
        }
        if (normalized.includes('speaking') || normalized.includes('nói')) {
            return ClassType.FT_SPEAKING
        }

        return ClassType.OTHER
    }

    // Determine auto_schedule based on "Loại lớp học" column
    const getAutoSchedule = (autoScheduleStr: string): boolean => {
        const normalized = autoScheduleStr.trim().toLowerCase()
        return normalized.includes('chính thức') || normalized.includes('official')
    }

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data as any[]

                // Map CSV columns to our structure
                const parsed: ParsedClassRow[] = data.map((row: any) => ({
                    courseName: row['Lớp'] || row['Course'] || '',
                    className: row['Kỹ năng'] || row['Class Name'] || '',
                    classType: row['Trình độ lớp học'] || row['Class Type'] || '',
                    teacherName: row['Giáo viên phụ trách'] || row['Teacher'] || '',
                    autoSchedule: row['Loại lớp học'] || row['Schedule Type'] || ''
                }))

                setCsvData(parsed)
                setShowPreview(true)
                setErrors([])
            },
            error: (error) => {
                setErrors([`Lỗi đọc file CSV: ${error.message}`])
            }
        })
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.csv']
        },
        multiple: false
    })

    const processCSVData = useCallback(() => {
        if (!teachers) {
            setErrors(['Chưa tải được danh sách giáo viên'])
            return
        }

        setIsProcessing(true)
        const processed: ProcessedClass[] = []
        const errorList: string[] = []

        csvData.forEach((row, index) => {
            const teacherId = getTeacherIdByName(row.teacherName)

            if (!teacherId) {
                errorList.push(`Dòng ${index + 2}: Không tìm thấy giáo viên "${row.teacherName}"`)
            }

            if (!row.className || !row.classType) {
                errorList.push(`Dòng ${index + 2}: Thiếu thông tin tên lớp hoặc kỹ năng`)
            }

            if (!teacherId || !row.className || !row.classType) {
                return // Skip this row
            }

            const classData: ProcessedClass = {
                name: row.className.trim(),
                totalLessonPerWeek: 2,
                classType: getClassType(row.classType),
                teacherId: teacherId,
                courseId: courseId,
                autoSchedule: getAutoSchedule(row.autoSchedule),
                originalTeacherName: row.teacherName,
                rowIndex: index + 2
            }

            processed.push(classData)
        })

        setProcessedClasses(processed)
        setErrors(errorList)
        setIsProcessing(false)
    }, [csvData, teachers, courseId, getTeacherIdByName])

    const handleImport = async () => {
        if (processedClasses.length === 0) {
            setErrors(['Không có lớp học nào để import'])
            return
        }

        try {
            setIsProcessing(true)

            // Remove extra fields before sending to API
            const classesToCreate = processedClasses.map(({ originalTeacherName, rowIndex, ...rest }) => rest)

            await createClassMutation.mutateAsync(classesToCreate)

            // Success
            setCsvData([])
            setProcessedClasses([])
            setShowPreview(false)
            setErrors([])
            onSuccess?.()
            onClose()
        } catch (error: any) {
            setErrors([`Lỗi khi tạo lớp học: ${error?.message || 'Unknown error'}`])
        } finally {
            setIsProcessing(false)
        }
    }

    const handleClose = () => {
        setCsvData([])
        setProcessedClasses([])
        setShowPreview(false)
        setErrors([])
        onClose()
    }

    const getClassTypeLabel = (classType: ClassType) => {
        switch (classType) {
            case ClassType.FT_LISTENING: return 'Nghe'
            case ClassType.FT_WRITING: return 'Viết'
            case ClassType.FT_READING: return 'Đọc'
            case ClassType.FT_SPEAKING: return 'Nói'
            case ClassType.OTHER: return 'Khác'
            default: return classType
        }
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <i className="ri-file-upload-line" style={{ fontSize: 24 }} />
                    <Typography variant="h6">Import lớp học từ CSV</Typography>
                </Box>
            </DialogTitle>

            <DialogContent>
                {/* Download Sample File */}
                <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Bạn muốn xem mẫu file CSV để nhập nhiều lớp học cùng lúc?
                    </Typography>
                    <Link
                        href="/import-class-example.csv"
                        download="import-class-example.csv"
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'primary.main',
                            textDecoration: 'none',
                            '&:hover': {
                                textDecoration: 'underline'
                            }
                        }}
                    >
                        <i className="ri-download-line" />
                        <Typography variant="body2" fontWeight={500}>
                            Tải file mẫu ở đây
                        </Typography>
                    </Link>
                </Box>

                {/* Instructions */}
                <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                        <strong>Định dạng file CSV yêu cầu:</strong>
                    </Typography>
                    <Typography variant="body2" component="div">
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                            <li>Cột 1: <strong>Lớp</strong> - Tên khóa học</li>
                            <li>Cột 2: <strong>Kỹ năng</strong> - Tên lớp kỹ năng</li>
                            <li>Cột 3: <strong>Trình độ lớp học</strong> - Loại kỹ năng (FT_listening, FT_reading, FT_writing, FT_speaking, other)</li>
                            <li>Cột 4: <strong>Giáo viên phụ trách</strong> - Tên giáo viên</li>
                            <li>Cột 5: <strong>Loại lớp học</strong> - "Lớp chính thức" hoặc "Lớp bổ trợ"</li>
                        </ul>
                    </Typography>
                </Alert>

                {isLoadingTeachers && (
                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                        <CircularProgress size={20} />
                        <Typography variant="body2">Đang tải danh sách giáo viên...</Typography>
                    </Box>
                )}

                {/* Upload Area */}
                {!showPreview && (
                    <Box
                        {...getRootProps()}
                        sx={{
                            border: '2px dashed',
                            borderColor: isDragActive ? 'primary.main' : 'divider',
                            borderRadius: 2,
                            p: 4,
                            textAlign: 'center',
                            cursor: 'pointer',
                            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                            transition: 'all 0.2s',
                            '&:hover': {
                                bgcolor: 'action.hover',
                                borderColor: 'primary.main'
                            }
                        }}
                    >
                        <input {...getInputProps()} />
                        <i className="ri-upload-cloud-2-line" style={{ fontSize: 48, color: '#666' }} />
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                            {isDragActive ? 'Thả file tại đây' : 'Kéo thả file CSV hoặc click để chọn'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Chỉ chấp nhận file .csv
                        </Typography>
                    </Box>
                )}

                {/* Preview Table */}
                {showPreview && csvData.length > 0 && (
                    <Box>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                            <Typography variant="h6">
                                Preview: {csvData.length} lớp học
                            </Typography>
                            <Box display="flex" gap={1}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => {
                                        setCsvData([])
                                        setShowPreview(false)
                                        setProcessedClasses([])
                                        setErrors([])
                                    }}
                                >
                                    Chọn file khác
                                </Button>
                                {processedClasses.length === 0 && (
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={processCSVData}
                                        disabled={isProcessing || isLoadingTeachers}
                                    >
                                        {isProcessing ? 'Đang xử lý...' : 'Xử lý dữ liệu'}
                                    </Button>
                                )}
                            </Box>
                        </Box>

                        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>STT</TableCell>
                                        <TableCell>Tên lớp</TableCell>
                                        <TableCell>Kỹ năng</TableCell>
                                        <TableCell>Giáo viên</TableCell>
                                        <TableCell>Loại</TableCell>
                                        <TableCell>Trạng thái</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {csvData.map((row, index) => {
                                        const processed = processedClasses.find(p => p.rowIndex === index + 2)
                                        const hasError = errors.some(e => e.includes(`Dòng ${index + 2}`))

                                        return (
                                            <TableRow key={index} hover>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>{row.className}</TableCell>
                                                <TableCell>
                                                    {processed && (
                                                        <Chip
                                                            label={getClassTypeLabel(processed.classType)}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                    {!processed && row.classType}
                                                </TableCell>
                                                <TableCell>{row.teacherName}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={row.autoSchedule.includes('chính thức') ? 'Chính thức' : 'Bổ trợ'}
                                                        size="small"
                                                        color={row.autoSchedule.includes('chính thức') ? 'success' : 'default'}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {processed && (
                                                        <Chip label="Sẵn sàng" size="small" color="success" icon={<i className="ri-check-line" />} />
                                                    )}
                                                    {!processed && hasError && (
                                                        <Chip label="Lỗi" size="small" color="error" icon={<i className="ri-close-line" />} />
                                                    )}
                                                    {!processed && !hasError && processedClasses.length === 0 && (
                                                        <Chip label="Chờ xử lý" size="small" color="default" />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {/* Errors */}
                {errors.length > 0 && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        <Typography variant="body2" gutterBottom>
                            <strong>Có {errors.length} lỗi:</strong>
                        </Typography>
                        <Box component="ul" sx={{ margin: 0, paddingLeft: 20 }}>
                            {errors.map((error, index) => (
                                <li key={index}>
                                    <Typography variant="body2">{error}</Typography>
                                </li>
                            ))}
                        </Box>
                    </Alert>
                )}

                {/* Success Summary */}
                {processedClasses.length > 0 && errors.length === 0 && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                            Đã xử lý thành công {processedClasses.length} lớp học. Sẵn sàng để import!
                        </Typography>
                    </Alert>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={isProcessing}>
                    Hủy
                </Button>
                <Button
                    variant="contained"
                    onClick={handleImport}
                    disabled={processedClasses.length === 0 || isProcessing || errors.length > 0}
                    startIcon={isProcessing ? <CircularProgress size={16} /> : <i className="ri-upload-line" />}
                >
                    {isProcessing ? 'Đang import...' : `Import ${processedClasses.length} lớp học`}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ImportClassesFromCSV

