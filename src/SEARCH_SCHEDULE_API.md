# Search Schedule API

## Tổng quan

API này cho phép tìm kiếm lịch học (schedule) dựa trên nhiều tiêu chí:
- **Tên khóa học** (course name)
- **Tên học sinh** (student fullname)
- **Email học sinh** (student email)
- **Profile ID** (học sinh cụ thể)
- **Teacher ID** (giáo viên cụ thể)
- **Khoảng thời gian** (startDate, endDate) - dựa trên ngày thực tế của schedule
- **Trạng thái điểm danh** (rollcallStatus)
- **Tuần học** (weekId)
- **Khung giờ** (scheduleTimes) - mảng các khung giờ (1-42), cho phép filter theo nhiều khung giờ cùng lúc

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
| `scheduleTimes` | number[] | No | Mảng các mã thời gian học (1-42). Nếu không cung cấp, sẽ tìm kiếm tất cả các khung giờ. Ví dụ: `[1, 2, 3]` để tìm schedules có schedule_time là 1, 2 hoặc 3 |
| `profileId` | string | No | UUID của profile (học sinh). Lọc schedules theo học sinh cụ thể |
| `teacherId` | string | No | UUID của giáo viên. Lọc schedules theo giáo viên cụ thể |
| `startDate` | string | No | Ngày bắt đầu (ISO 8601 format: YYYY-MM-DD). Lọc schedules có ngày thực tế >= startDate. Ngày được tính từ week.start_date + offset từ scheduleTime |
| `endDate` | string | No | Ngày kết thúc (ISO 8601 format: YYYY-MM-DD). Lọc schedules có ngày thực tế <= endDate. Ngày được tính từ week.start_date + offset từ scheduleTime |
| `rollcallStatus` | string | No | Trạng thái điểm danh. Lọc schedules theo trạng thái điểm danh (not_rollcall, attending, absent_without_reason, etc.) |
| `limit` | number | No | Số lượng kết quả mỗi trang (mặc định: 50, tối đa: 100) |
| `page` | number | No | Số trang (mặc định: 1) |

**Lưu ý (đã lưu cột schedule_date):**
- Tất cả các tham số đều là optional
- Nếu không cung cấp `search`, API sẽ trả về tất cả schedules (có thể filter theo các tham số khác)
- Nếu không cung cấp `weekId`, API sẽ tìm kiếm trong tất cả các tuần
- Nếu không cung cấp `scheduleTimes`, API sẽ tìm kiếm tất cả các khung giờ
- Search sử dụng `ILIKE` (case-insensitive) và hỗ trợ partial match (ví dụ: "ielts" sẽ match "IELTS Foundation")
- `scheduleTimes` phải là mảng các số nguyên từ 1 đến 42 (tương ứng với 42 khung giờ trong tuần). Mỗi phần tử trong mảng phải nằm trong khoảng 1-42. Mảng có thể chứa từ 1 đến 42 phần tử
- `profileId` phải là UUID hợp lệ
- `teacherId` phải là UUID hợp lệ của giáo viên
- `startDate` và `endDate` phải theo định dạng ISO 8601 (YYYY-MM-DD). Ngày thực tế của schedule được lưu vào cột `schedule_date` (được tính từ `week.start_date + offset` dựa trên `scheduleTime`). Bộ lọc ngày sử dụng trực tiếp cột `schedule_date`.
- `rollcallStatus` có thể là: `not_rollcall`, `attending`, `absent_without_reason`, `absent_with_reason`, `absent_with_late_reason`, `trial`, `retake`
- `limit` phải là số nguyên từ 1 đến 100 (mặc định: 50)
- `page` phải là số nguyên >= 1 (mặc định: 1)

## Response Format

### Success Response (200 OK)

Trả về một object `SearchSchedulePaginationResponseDto` với pagination metadata:

```typescript
{
  data: SearchScheduleResponseDto[],      // Mảng các schedules
  total: number,                          // Tổng số records
  page: number,                           // Trang hiện tại
  limit: number,                          // Số lượng records mỗi trang
  totalPages: number                      // Tổng số trang
}

// SearchScheduleResponseDto:
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
    scheduleDate?: string                  // Ngày thực tế của buổi học (YYYY-MM-DD)
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
  }
}
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
{
  "data": [
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
      "scheduleDate": "2024-01-15",
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
  ],
  "total": 1,
  "page": 1,
  "limit": 50,
  "totalPages": 1
}
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

### 6. Filter theo schedule time (một khung giờ)

```bash
GET /search-schedule?scheduleTimes=1&weekId=123e4567-e89b-12d3-a456-426614174000
```

Tìm kiếm tất cả schedules có `schedule_time = 1` (8:00-10:00 Monday) trong tuần được chỉ định.

### 6a. Filter theo nhiều schedule times

```bash
GET /search-schedule?scheduleTimes=1&scheduleTimes=2&scheduleTimes=3&weekId=123e4567-e89b-12d3-a456-426614174000
```

Hoặc sử dụng query string array format:
```bash
GET /search-schedule?scheduleTimes[]=1&scheduleTimes[]=2&scheduleTimes[]=3&weekId=123e4567-e89b-12d3-a456-426614174000
```

Tìm kiếm tất cả schedules có `schedule_time` là 1, 2 hoặc 3 trong tuần được chỉ định.

### 7. Kết hợp nhiều filters

```bash
GET /search-schedule?search=IELTS&weekId=123e4567-e89b-12d3-a456-426614174000&scheduleTimes=1&scheduleTimes=7
```

Tìm kiếm schedules có:
- Tên khóa học, tên học sinh, hoặc email chứa "IELTS"
- Trong tuần có `weekId` được chỉ định
- Có `schedule_time` là 1 (8:00-10:00 Monday) hoặc 7 (8:00-10:00 Tuesday)

### 8. Sử dụng pagination

```bash
GET /search-schedule?search=IELTS&page=1&limit=20
```

Trả về trang đầu tiên với 20 kết quả mỗi trang.

```bash
GET /search-schedule?search=IELTS&page=2&limit=20
```

Trả về trang thứ 2 với 20 kết quả mỗi trang.

**Response với pagination:**
```json
{
  "data": [...],
  "total": 45,
  "page": 2,
  "limit": 20,
  "totalPages": 3
}
```

### 9. Filter theo profileId (học sinh cụ thể)

```bash
GET /search-schedule?profileId=123e4567-e89b-12d3-a456-426614174000
```

Tìm kiếm tất cả lịch học của học sinh có `profileId` được chỉ định.

### 9a. Filter theo teacherId (giáo viên cụ thể)

```bash
GET /search-schedule?teacherId=123e4567-e89b-12d3-a456-426614174000
```

Tìm kiếm tất cả lịch học của giáo viên có `teacherId` được chỉ định.

```bash
GET /search-schedule?teacherId=123e4567-e89b-12d3-a456-426614174000&weekId=456e7890-e89b-12d3-a456-426614174000
```

Tìm kiếm tất cả lịch học của giáo viên trong tuần cụ thể.

### 10. Filter theo khoảng thời gian (startDate và endDate)

```bash
GET /search-schedule?startDate=2024-01-01&endDate=2024-01-31
```

Tìm kiếm tất cả schedules có ngày thực tế nằm trong khoảng từ 2024-01-01 đến 2024-01-31. Ngày thực tế được tính từ `week.start_date + offset` dựa trên `scheduleTime`.

**Lưu ý:** 
- `startDate` và `endDate` có thể sử dụng độc lập hoặc kết hợp
- Nếu chỉ có `startDate`: lọc schedules có ngày >= startDate
- Nếu chỉ có `endDate`: lọc schedules có ngày <= endDate
- Nếu có cả hai: lọc schedules có ngày trong khoảng [startDate, endDate]

```bash
GET /search-schedule?startDate=2024-01-15
```

Tìm kiếm tất cả schedules từ ngày 2024-01-15 trở đi.

### 11. Filter theo rollcallStatus

```bash
GET /search-schedule?rollcallStatus=attending
```

Tìm kiếm tất cả schedules có trạng thái điểm danh là "attending".

```bash
GET /search-schedule?rollcallStatus=not_rollcall&weekId=123e4567-e89b-12d3-a456-426614174000
```

Tìm kiếm tất cả schedules chưa được điểm danh trong tuần cụ thể.

### 12. Kết hợp nhiều filters nâng cao

```bash
GET /search-schedule?profileId=123e4567-e89b-12d3-a456-426614174000&startDate=2024-01-01&endDate=2024-01-31&rollcallStatus=attending
```

Tìm kiếm schedules có:
- `profileId` được chỉ định
- Ngày thực tế trong khoảng 2024-01-01 đến 2024-01-31
- Trạng thái điểm danh là "attending"

```bash
GET /search-schedule?teacherId=123e4567-e89b-12d3-a456-426614174000&weekId=456e7890-e89b-12d3-a456-426614174000&scheduleTimes=1&scheduleTimes=7&rollcallStatus=attending
```

Tìm kiếm schedules có:
- `teacherId` được chỉ định
- Trong tuần có `weekId` được chỉ định
- Có `schedule_time` là 1 hoặc 7 (8:00-10:00 Monday hoặc Tuesday)
- Trạng thái điểm danh là "attending"

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

Nếu `scheduleTimes` không hợp lệ (không phải mảng, rỗng, hoặc có phần tử không nằm trong khoảng 1-42):

```json
{
  "statusCode": 400,
  "message": [
    "scheduleTimes must be an array",
    "scheduleTimes must not be empty",
    "each value in scheduleTimes must be an integer number",
    "each value in scheduleTimes must not be less than 1",
    "each value in scheduleTimes must not be greater than 42"
  ],
  "error": "Bad Request"
}
```

Nếu `limit` không nằm trong khoảng 1-100:

```json
{
  "statusCode": 400,
  "message": ["limit must be an integer number", "limit must not be less than 1", "limit must not be greater than 100"],
  "error": "Bad Request"
}
```

Nếu `page` nhỏ hơn 1:

```json
{
  "statusCode": 400,
  "message": ["page must be an integer number", "page must not be less than 1"],
  "error": "Bad Request"
}
```

Nếu `profileId` không phải là UUID hợp lệ:

```json
{
  "statusCode": 400,
  "message": ["profileId must be a UUID"],
  "error": "Bad Request"
}
```

Nếu `teacherId` không phải là UUID hợp lệ:

```json
{
  "statusCode": 400,
  "message": ["teacherId must be a UUID"],
  "error": "Bad Request"
}
```

Nếu `startDate` hoặc `endDate` không đúng định dạng ISO 8601:

```json
{
  "statusCode": 400,
  "message": ["startDate must be a valid ISO 8601 date string"],
  "error": "Bad Request"
}
```

### No Results

Nếu không tìm thấy kết quả, API trả về object với data rỗng:

```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "limit": 50,
  "totalPages": 0
}
```

## Lưu ý

1. **Case-insensitive search**: Tìm kiếm không phân biệt hoa thường
2. **Partial match**: Hỗ trợ tìm kiếm một phần của từ khóa
3. **Multiple fields**: Từ khóa `search` sẽ tìm kiếm trong 3 trường: course name, student fullname, và email
4. **Schedule Info**: Thông tin lịch lớp (schedule info) có thể null nếu chưa được tạo
5. **Performance**: Với dữ liệu lớn, nên sử dụng `weekId`, `scheduleTimes`, `profileId`, `teacherId`, hoặc `startDate`/`endDate` để giới hạn phạm vi tìm kiếm
6. **Ordering**: Kết quả được sắp xếp theo course name → class name → lesson → schedule time để dễ đọc
7. **Schedule Times**: Mảng các giá trị từ 1-42, tương ứng với 42 khung giờ trong tuần (6 khung giờ/ngày × 7 ngày). Cho phép filter theo nhiều khung giờ cùng lúc. Ví dụ: `[1, 7, 13]` để tìm schedules vào 8:00-10:00 của Thứ 2, Thứ 3, và Thứ 4
8. **Date Filtering**: `startDate` và `endDate` lọc dựa trên ngày thực tế của schedule, được lưu trong cột `schedule_date`. Mỗi `scheduleTime` tương ứng với một ngày cụ thể trong tuần (1-6 = Monday, 7-12 = Tuesday, ..., 37-42 = Sunday)
9. **Rollcall Status**: Có thể filter theo các trạng thái điểm danh: `not_rollcall`, `attending`, `absent_without_reason`, `absent_with_reason`, `absent_with_late_reason`, `trial`, `retake`
10. **Pagination**: API hỗ trợ pagination với `page` và `limit`. Mặc định: `page=1`, `limit=50`. Tối đa `limit=100`
11. **Total Count**: API luôn trả về `total` (tổng số records) và `totalPages` để dễ dàng implement pagination UI
12. **Combined Filters**: Tất cả các filters có thể kết hợp với nhau để tạo ra các truy vấn phức tạp và chính xác

## Database Schema

API join các bảng sau:
- `schedule` (s) - Bảng lịch học chính
- `profiles` (p) - Thông tin học sinh
- `class` (c) - Thông tin lớp học
- `courses` (course) - Thông tin khóa học
- `week` (w) - Thông tin tuần học (dùng để tính ngày thực tế từ startDate + scheduleTime offset)
- `teachers` (t) - Thông tin giáo viên (LEFT JOIN)
- `schedule_info` (si) - Thông tin lịch lớp (LEFT JOIN)

## Authentication

Hiện tại API không yêu cầu authentication (guard đã được comment). Có thể thêm `@UseGuards(JwtAuthGuard)` nếu cần bảo mật.
