# Total Study Hours API Documentation

## Tổng quan

API tính toán và xuất báo cáo tổng giờ học thực tế của học sinh dựa trên điểm danh. Hệ thống chỉ tính các buổi học có trạng thái điểm danh là `attending`, `trial`, hoặc `retake`. API hỗ trợ tìm kiếm, lọc theo week, phân trang và xuất file Excel.

## Base URL

```
/total-study-hours
```

## Cấu trúc dữ liệu

### Study Hours Response Item

```typescript
{
  username: string;              // Username của học sinh
  fullname: string;              // Họ và tên
  email: string;                 // Email
  courseName: string;            // Tên khóa học
  className: string;             // Tên lớp học
  totalActualHours: number;      // Tổng giờ học thực tế (tính bằng giờ, làm tròn 1 chữ số thập phân)
  totalAttendedSessions: number; // Tổng số buổi đã tham gia
  teacherName: string;           // Tên giáo viên
}
```

### Pagination Response

```typescript
{
  data: StudyHoursResponseItem[]; // Danh sách kết quả
  pagination: {
    page: number;                // Trang hiện tại
    limit: number;               // Số items mỗi trang
    total: number;                // Tổng số records
    totalPages: number;           // Tổng số trang
    hasNext: boolean;             // Có trang tiếp theo không
    hasPrev: boolean;             // Có trang trước không
  }
}
```

## Authentication

API này hiện tại **không yêu cầu authentication** (có thể thay đổi trong tương lai).

## API Endpoints

### 1. Lấy danh sách tổng giờ học thực tế (có phân trang)

**GET** `/total-study-hours`

Lấy danh sách tổng giờ học thực tế của học sinh với hỗ trợ tìm kiếm, lọc theo week và phân trang.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `search` | string | No | - | Từ khóa tìm kiếm (username hoặc course name). Không phân biệt hoa thường. |
| `weekId` | UUID | No | - | Week ID để lọc theo week cụ thể. |
| `page` | number | No | 1 | Số trang (min: 1). |
| `limit` | number | No | 10 | Số items mỗi trang (min: 1, max: 100). |

**Search Behavior:**

- Tìm kiếm không phân biệt hoa thường (case-insensitive)
- Tìm kiếm trong 2 trường:
  - `u.username` - Username
  - `c.name` - Tên khóa học
- Sử dụng pattern matching với `ILIKE` (PostgreSQL)

**Filter Behavior:**

- **Rollcall Status**: Chỉ tính các schedule có `rollcall_status` là:
  - `attending` - Có mặt
  - `trial` - Học thử
  - `retake` - Học lại
- **Week Filter**: Nếu có `weekId`, chỉ tính schedule của week đó
- **Grouping**: Dữ liệu được nhóm theo (username, fullname, email, course_name, class_name, teacher_name)

**Sorting:**

- Sắp xếp theo `total_actual_hours DESC` (giờ học nhiều nhất trước)
- Secondary sort theo `username ASC` (tên đăng nhập tăng dần)

**Response:**

```json
{
  "data": [
    {
      "username": "john_doe",
      "fullname": "John Doe",
      "email": "john@example.com",
      "courseName": "IELTS Foundation",
      "className": "IELTS F1",
      "totalActualHours": 45.5,
      "totalAttendedSessions": 15,
      "teacherName": "Mr. Smith"
    },
    {
      "username": "jane_smith",
      "fullname": "Jane Smith",
      "email": "jane@example.com",
      "courseName": "TOEIC Advanced",
      "className": "TOEIC A1",
      "totalActualHours": 38.0,
      "totalAttendedSessions": 12,
      "teacherName": "Mrs. Johnson"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Example Requests:**

### Lấy trang đầu tiên (default)

```bash
curl -X GET \
  "http://localhost:3000/total-study-hours"
```

### Lấy với pagination

```bash
curl -X GET \
  "http://localhost:3000/total-study-hours?page=2&limit=20"
```

### Tìm kiếm theo username hoặc course name

```bash
curl -X GET \
  "http://localhost:3000/total-study-hours?search=IELTS"
```

### Lọc theo week

```bash
curl -X GET \
  "http://localhost:3000/total-study-hours?weekId=550e8400-e29b-41d4-a716-446655440000"
```

### Kết hợp tất cả filters

```bash
curl -X GET \
  "http://localhost:3000/total-study-hours?search=John&weekId=550e8400-e29b-41d4-a716-446655440000&page=1&limit=25"
```

---

### 2. Xuất báo cáo tổng giờ học thực tế ra file Excel

**GET** `/total-study-hours/export`

Xuất toàn bộ dữ liệu tổng giờ học thực tế ra file Excel. API này **bỏ qua pagination** và xuất tất cả dữ liệu thỏa mãn điều kiện tìm kiếm và lọc.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Từ khóa tìm kiếm (username hoặc course name). Không phân biệt hoa thường. |
| `weekId` | UUID | No | Week ID để lọc theo week cụ thể. |

**Lưu ý quan trọng:**

- **Không có pagination**: API này xuất **toàn bộ** dữ liệu thỏa mãn điều kiện, không giới hạn số lượng
- **Cùng filters**: Sử dụng cùng logic filter như endpoint GET (search, weekId)
- **Excel format**: File Excel được tạo bằng thư viện `exceljs` với formatting đẹp

**Excel File Format:**

- **Worksheet name**: "Actual Study Hours"
- **Orientation**: Landscape (ngang)
- **Paper size**: A4
- **Columns** (8 cột):
  1. Username (width: 20)
  2. Họ và tên (width: 25)
  3. Email (width: 30)
  4. Khóa học (width: 25)
  5. Lớp học (width: 25)
  6. Tổng giờ học thực tế (width: 18, center aligned)
  7. Tổng số buổi đã tham gia (width: 20, center aligned)
  8. Giáo viên (width: 20)

**Excel Styling:**

- **Header row**: Bold, gray background (#E0E0E0), center aligned, height 25px
- **Data rows**: Borders, left aligned (numeric columns center aligned), height 20px
- **Font size**: 11pt

**Filename Format:**

Tên file được tạo tự động theo format:
```
actual_study_hours_YYYY-MM-DD[_week_xxxx][_searchterm].xlsx
```

Ví dụ:
- `actual_study_hours_2024-01-15.xlsx` - Export tất cả
- `actual_study_hours_2024-01-15_week_550e8400.xlsx` - Export với week filter
- `actual_study_hours_2024-01-15_IELTS.xlsx` - Export với search
- `actual_study_hours_2024-01-15_week_550e8400_IELTS.xlsx` - Export với cả week và search

**Response Headers:**

```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="actual_study_hours_2024-01-15.xlsx"
Content-Length: <file_size_in_bytes>
```

**Response Body:**

File Excel (binary data) - Browser sẽ tự động download file.

**Example Requests:**

### Export tất cả dữ liệu

```bash
curl -X GET \
  "http://localhost:3000/total-study-hours/export" \
  --output actual_study_hours.xlsx
```

### Export với filter theo week

```bash
curl -X GET \
  "http://localhost:3000/total-study-hours/export?weekId=550e8400-e29b-41d4-a716-446655440000" \
  --output actual_study_hours_week.xlsx
```

### Export với search

```bash
curl -X GET \
  "http://localhost:3000/total-study-hours/export?search=IELTS" \
  --output actual_study_hours_ielts.xlsx
```

### Export với cả week và search

```bash
curl -X GET \
  "http://localhost:3000/total-study-hours/export?weekId=550e8400-e29b-41d4-a716-446655440000&search=John" \
  --output actual_study_hours_filtered.xlsx
```

**Browser Usage:**

Trong browser, chỉ cần truy cập URL và file sẽ tự động download:

```
http://localhost:3000/total-study-hours/export?weekId=550e8400-e29b-41d4-a716-446655440000
```

---

## Logic tính toán

### Tổng giờ học thực tế (totalActualHours)

- Tính bằng cách `SUM(s.total_time)` của tất cả schedule có:
  - `rollcall_status` IN (`attending`, `trial`, `retake`)
  - Thỏa mãn các điều kiện filter (weekId, search)
- Đơn vị: Giờ (hours), làm tròn 1 chữ số thập phân
- Ví dụ: `45.5` giờ = 45 giờ 30 phút

### Tổng số buổi đã tham gia (totalAttendedSessions)

- Tính bằng cách `COUNT(s.id)` của tất cả schedule có:
  - `rollcall_status` IN (`attending`, `trial`, `retake`)
  - Thỏa mãn các điều kiện filter (weekId, search)
- Đơn vị: Số buổi (sessions)

### Grouping

Dữ liệu được nhóm theo các trường sau để tránh trùng lặp:
- `u.username`
- `p.fullname`
- `p.email`
- `c.name` (course name)
- `cl.name` (class name)
- `t.name` (teacher name)

Điều này có nghĩa là nếu một học sinh học nhiều lớp khác nhau hoặc nhiều khóa học khác nhau, mỗi combination sẽ là một dòng riêng biệt.

---

## Luồng hoạt động

### Endpoint GET (với pagination)

1. Client gửi request với query parameters (search, weekId, page, limit)
2. Server xây dựng WHERE clause với filters
3. Server thực hiện COUNT query để tính tổng số records
4. Server tính toán pagination (offset, totalPages)
5. Server thực hiện main query với LIMIT và OFFSET
6. Server group và aggregate dữ liệu
7. Server trả về JSON với data và pagination metadata

### Endpoint Export (không pagination)

1. Client gửi request với query parameters (search, weekId)
2. Server xây dựng WHERE clause với filters (giống GET)
3. Server thực hiện query **KHÔNG có LIMIT** để lấy toàn bộ dữ liệu
4. Server group và aggregate dữ liệu
5. Server tạo Excel workbook với exceljs
6. Server format và style Excel file
7. Server generate buffer và trả về file download

---

## Ví dụ sử dụng

### Scenario 1: Xem báo cáo tổng giờ học của tất cả học sinh

```bash
# Lấy trang đầu tiên
GET /total-study-hours?page=1&limit=50

# Lấy trang tiếp theo
GET /total-study-hours?page=2&limit=50
```

### Scenario 2: Tìm kiếm học sinh theo khóa học

```bash
# Tìm tất cả học sinh học IELTS
GET /total-study-hours?search=IELTS&page=1&limit=20
```

### Scenario 3: Xem báo cáo của một week cụ thể

```bash
# Lấy dữ liệu của week cụ thể
GET /total-study-hours?weekId=550e8400-e29b-41d4-a716-446655440000&page=1&limit=100
```

### Scenario 4: Export báo cáo để báo cáo kế toán

```bash
# Export tất cả dữ liệu
GET /total-study-hours/export

# Export dữ liệu của week cụ thể
GET /total-study-hours/export?weekId=550e8400-e29b-41d4-a716-446655440000

# Export với tìm kiếm
GET /total-study-hours/export?search=IELTS Foundation
```

---

## Lưu ý quan trọng

1. **Rollcall Status**: Chỉ tính các buổi học có điểm danh là `attending`, `trial`, hoặc `retake`. Các trạng thái khác (`not_rollcall`, `absent_*`) không được tính.

2. **Grouping**: Một học sinh có thể xuất hiện nhiều lần nếu học nhiều lớp/khóa học khác nhau. Mỗi combination (học sinh + khóa học + lớp + giáo viên) là một dòng riêng.

3. **Total Time**: `total_time` được lấy từ cột `total_time` trong bảng `schedule`, tính bằng giờ (hours).

4. **Schedule Info Join**: API join với bảng `schedule_info` để lấy thông tin giáo viên. Điều kiện join:
   - `s.class_id = si.class_id`
   - `s.week_id = si.week_id`
   - `s.lesson = si.lesson`
   - `s.schedule_time = si.schedule_time`

5. **Export Performance**: Khi export, API sẽ query toàn bộ dữ liệu không có LIMIT. Với dữ liệu lớn, có thể mất thời gian. Nên sử dụng filters (weekId, search) để giới hạn dữ liệu.

6. **Pagination Limits**: 
   - `page`: Minimum 1
   - `limit`: Minimum 1, Maximum 100
   - Default: `page=1`, `limit=10`

7. **Search Pattern**: Tìm kiếm sử dụng `ILIKE` với pattern `%searchTerm%`, có nghĩa là tìm kiếm partial match, không phân biệt hoa thường.

8. **Week Filter**: Nếu không có `weekId`, API sẽ tính tất cả các week. Nếu có `weekId`, chỉ tính schedule của week đó.

---

## Error Responses

API này không trả về lỗi cụ thể cho các trường hợp:
- Không tìm thấy dữ liệu → Trả về mảng rỗng `[]` hoặc `data: []`
- Invalid weekId → Có thể trả về dữ liệu rỗng nếu weekId không tồn tại
- Invalid page/limit → Validation error từ class-validator

**Empty Response (GET):**

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

## Performance Considerations

1. **Pagination**: Luôn sử dụng pagination khi query dữ liệu lớn để tránh timeout
2. **Export**: Export endpoint không có pagination, nên sử dụng filters để giới hạn dữ liệu
3. **Indexes**: Đảm bảo có indexes trên:
   - `schedule.rollcall_status`
   - `schedule.week_id`
   - `schedule.profile_lesson_class_id`
   - `schedule.class_id`, `schedule.week_id`, `schedule.lesson`, `schedule.schedule_time` (composite index cho join với schedule_info)

---

## Use Cases

### 1. Báo cáo kế toán hàng tuần

```bash
# Lấy dữ liệu của week hiện tại
GET /total-study-hours?weekId=<current_week_id>&page=1&limit=100

# Export để gửi kế toán
GET /total-study-hours/export?weekId=<current_week_id>
```

### 2. Tìm kiếm học sinh có giờ học cao nhất

```bash
# Sắp xếp mặc định là DESC theo totalActualHours
GET /total-study-hours?page=1&limit=10
```

### 3. Báo cáo theo khóa học

```bash
# Tìm tất cả học sinh của một khóa học
GET /total-study-hours?search=IELTS Foundation&page=1&limit=50

# Export báo cáo
GET /total-study-hours/export?search=IELTS Foundation
```

### 4. So sánh giữa các week

```bash
# Week 1
GET /total-study-hours?weekId=<week1_id>

# Week 2
GET /total-study-hours?weekId=<week2_id>
```

