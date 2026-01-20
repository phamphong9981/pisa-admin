# Search Schedule API

## Tổng quan

API này cho phép tìm kiếm lịch học (schedule) dựa trên:
- **Tên khóa học** (course name)
- **Tên học sinh** (student fullname)
- **Email học sinh** (student email)

API trả về danh sách lịch học kèm theo thông tin chi tiết về lớp học, khóa học, và lịch lớp (schedule info).

## Endpoint

```
GET /search-schedule
```

## Request Parameters

### Query Parameters

| Parameter | Type   | Required | Description                                                                 |
|-----------|--------|----------|-----------------------------------------------------------------------------|
| `search`  | string | No       | Từ khóa tìm kiếm (tên khóa học, tên học sinh, hoặc email). Không phân biệt hoa thường, hỗ trợ partial match |
| `weekId`  | string | No       | UUID của tuần học. Nếu không cung cấp, sẽ tìm kiếm trong tất cả các tuần |

**Lưu ý:**
- Cả hai tham số đều là optional
- Nếu không cung cấp `search`, API sẽ trả về tất cả schedules (có thể filter theo `weekId`)
- Nếu không cung cấp `weekId`, API sẽ tìm kiếm trong tất cả các tuần
- Search sử dụng `ILIKE` (case-insensitive) và hỗ trợ partial match (ví dụ: "ielts" sẽ match "IELTS Foundation")

## Response Format

### Success Response (200 OK)

Trả về một mảng các object `SearchScheduleResponseDto`:

```typescript
[
  {
    // Schedule fields
    scheduleId: string                    // UUID của schedule
    profileId: string                      // UUID của profile (học sinh)
    profileFullname: string                // Tên đầy đủ của học sinh
    profileEmail: string                   // Email của học sinh
    classId: string                        // UUID của lớp học
    className: string                      // Tên lớp học
    courseId: string                       // UUID của khóa học
    courseName: string                     // Tên khóa học
    lesson: number                         // Số buổi học (1, 2, 3, ...)
    weekId: string                         // UUID của tuần học
    scheduleTime: number                  // Mã thời gian (1-42)
    teacherId?: string                     // UUID của giáo viên (optional)
    teacherName?: string                   // Tên giáo viên (optional)
    status: string                         // Trạng thái schedule (active, cancelled, etc.)
    rollcallStatus: string                 // Trạng thái điểm danh
    startTime?: string                     // Giờ bắt đầu (HH:MM:SS)
    endTime?: string                       // Giờ kết thúc (HH:MM:SS)
    totalTime?: number                     // Tổng thời gian (giờ)
    note?: string                          // Ghi chú của schedule (optional)
    
    // Schedule Info fields
    scheduleInfoId?: string                 // UUID của schedule info (optional)
    scheduleInfoNote?: string               // Ghi chú của lịch lớp (optional)
    scheduleInfoStartTime?: string          // Giờ bắt đầu của lịch lớp (optional)
    scheduleInfoEndTime?: string            // Giờ kết thúc của lịch lớp (optional)
    scheduleInfoTeacherNote?: string        // Ghi chú của giáo viên (optional)
  },
  ...
]
```

### Response được sắp xếp theo:
1. Tên khóa học (course name) - ASC
2. Tên lớp học (class name) - ASC
3. Số buổi học (lesson) - ASC
4. Mã thời gian (schedule time) - ASC

## Ví dụ sử dụng

### 1. Tìm kiếm theo tên khóa học

```bash
GET /search-schedule?search=IELTS&weekId=123e4567-e89b-12d3-a456-426614174000
```

**Response:**
```json
[
  {
    "scheduleId": "abc-123-def",
    "profileId": "profile-123",
    "profileFullname": "Nguyễn Văn A",
    "profileEmail": "nguyenvana@example.com",
    "classId": "class-123",
    "className": "IELTS Listening 1",
    "courseId": "course-123",
    "courseName": "IELTS Foundation",
    "lesson": 1,
    "weekId": "123e4567-e89b-12d3-a456-426614174000",
    "scheduleTime": 1,
    "teacherId": "teacher-123",
    "teacherName": "Nguyễn Thị B",
    "status": "active",
    "rollcallStatus": "not_rollcall",
    "startTime": "08:00:00",
    "endTime": "10:00:00",
    "totalTime": 2.0,
    "scheduleInfoId": "info-123",
    "scheduleInfoStartTime": "08:00:00",
    "scheduleInfoEndTime": "10:00:00"
  }
]
```

### 2. Tìm kiếm theo tên học sinh

```bash
GET /search-schedule?search=Nguyễn Văn A
```

Tìm kiếm tất cả lịch học của học sinh có tên chứa "Nguyễn Văn A" trong tất cả các tuần.

### 3. Tìm kiếm theo email

```bash
GET /search-schedule?search=student@example.com&weekId=123e4567-e89b-12d3-a456-426614174000
```

Tìm kiếm lịch học của học sinh có email chứa "student@example.com" trong tuần cụ thể.

### 4. Lấy tất cả schedules trong một tuần

```bash
GET /search-schedule?weekId=123e4567-e89b-12d3-a456-426614174000
```

Trả về tất cả schedules trong tuần được chỉ định (không filter theo search term).

### 5. Tìm kiếm partial match

```bash
GET /search-schedule?search=ielts
```

Sẽ match với:
- "IELTS Foundation"
- "IELTS Advanced"
- "Pre-IELTS"
- v.v.

## Error Handling

### Validation Errors (400 Bad Request)

Nếu `weekId` không phải là UUID hợp lệ:

```json
{
  "statusCode": 400,
  "message": ["weekId must be a UUID"],
  "error": "Bad Request"
}
```

### No Results

Nếu không tìm thấy kết quả, API trả về mảng rỗng:

```json
[]
```

## Lưu ý

1. **Case-insensitive search**: Tìm kiếm không phân biệt hoa thường
2. **Partial match**: Hỗ trợ tìm kiếm một phần của từ khóa
3. **Multiple fields**: Từ khóa `search` sẽ tìm kiếm trong 3 trường: course name, student fullname, và email
4. **Schedule Info**: Thông tin lịch lớp (schedule info) có thể null nếu chưa được tạo
5. **Performance**: Với dữ liệu lớn, nên sử dụng `weekId` để giới hạn phạm vi tìm kiếm
6. **Ordering**: Kết quả được sắp xếp theo course name → class name → lesson → schedule time để dễ đọc

## Database Schema

API join các bảng sau:
- `schedule` (s) - Bảng lịch học chính
- `profiles` (p) - Thông tin học sinh
- `class` (c) - Thông tin lớp học
- `courses` (course) - Thông tin khóa học
- `teachers` (t) - Thông tin giáo viên (LEFT JOIN)
- `schedule_info` (si) - Thông tin lịch lớp (LEFT JOIN)

## Authentication

Hiện tại API không yêu cầu authentication (guard đã được comment). Có thể thêm `@UseGuards(JwtAuthGuard)` nếu cần bảo mật.
