# Search Profiles API Documentation

## Tổng quan

API tìm kiếm profiles (hồ sơ học sinh) theo tên, email hoặc tên khóa học. API tự động lấy lịch bận (busy schedule) của học sinh từ bảng `busy_schedule` và trả về kèm trong response.

## Base URL

```
/user/profiles/search
```

## Cấu trúc dữ liệu

### Profile Entity

```typescript
{
  id: string;                    // UUID của profile
  userId: string;                // UUID của user
  fullname: string;             // Họ và tên
  email: string;                 // Email
  phone: string;                 // Số điện thoại
  image: string;                 // URL ảnh đại diện
  ieltsPoint: string;            // Điểm IELTS
  createdAt: Date;               // Thời gian tạo
  updatedAt: Date;               // Thời gian cập nhật
  busyScheduleArr?: number[];    // Mảng các slot thời gian bận (1-42), được populate từ busy_schedule table
  profileCourses?: ProfileCourse[]; // Danh sách khóa học của học sinh
  schedules?: Schedule[];        // Danh sách lịch học (nếu có)
}
```

### ProfileCourse (nested)

```typescript
{
  id: string;                    // UUID của profile course
  profileId: string;             // UUID của profile
  courseId: string;              // UUID của course
  course?: Course;                // Thông tin khóa học
}
```

### Course (nested)

```typescript
{
  id: string;                    // UUID của course
  name: string;                  // Tên khóa học
  // ... các trường khác
}
```

## Authentication

API này **không yêu cầu authentication**, có thể gọi công khai.

## API Endpoint

### Tìm kiếm Profiles

**GET** `/user/profiles/search`

Tìm kiếm profiles theo tên, email hoặc tên khóa học. Kết quả được sắp xếp theo thời gian tạo giảm dần (mới nhất trước). API tự động lấy lịch bận của học sinh từ bảng `busy_schedule` và populate vào `busyScheduleArr`.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Từ khóa tìm kiếm (tìm trong fullname, email, hoặc course name). Không phân biệt hoa thường. |
| `weekId` | UUID | No | Week ID để lấy lịch bận. Nếu không cung cấp, hệ thống sẽ tự động sử dụng open week. |

**Search Behavior:**

- Tìm kiếm không phân biệt hoa thường (case-insensitive)
- Tìm kiếm trong 3 trường:
  - `profile.fullname` - Họ và tên
  - `profile.email` - Email
  - `course.name` - Tên khóa học
- Sử dụng pattern matching với `ILIKE` (PostgreSQL)
- Nếu không có `search`, trả về tất cả profiles

**Busy Schedule Behavior:**

- Nếu có `weekId`: Lấy lịch bận của week đó
- Nếu không có `weekId`: Tự động lấy lịch bận của open week
- Nếu không có open week: `busyScheduleArr` sẽ là mảng rỗng `[]`
- Lịch bận được lấy từ bảng `busy_schedule` với điều kiện `profile_id` và `week_id`

**Response:**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "fullname": "Nguyễn Văn A",
    "email": "nguyenvana@example.com",
    "phone": "0123456789",
    "image": "https://example.com/image.jpg",
    "ieltsPoint": "7.5",
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z",
    "busyScheduleArr": [1, 2, 3, 7, 8, 13, 14],
    "profileCourses": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "profileId": "550e8400-e29b-41d4-a716-446655440000",
        "courseId": "770e8400-e29b-41d4-a716-446655440000",
        "course": {
          "id": "770e8400-e29b-41d4-a716-446655440000",
          "name": "IELTS Foundation"
        }
      }
    ]
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "userId": "123e4567-e89b-12d3-a456-426614174001",
    "fullname": "Trần Thị B",
    "email": "tranthib@example.com",
    "phone": "0987654321",
    "image": "https://example.com/image2.jpg",
    "ieltsPoint": "6.5",
    "createdAt": "2024-01-09T10:00:00.000Z",
    "updatedAt": "2024-01-09T10:00:00.000Z",
    "busyScheduleArr": [19, 20, 25, 26],
    "profileCourses": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "profileId": "550e8400-e29b-41d4-a716-446655440001",
        "courseId": "770e8400-e29b-41d4-a716-446655440001",
        "course": {
          "id": "770e8400-e29b-41d4-a716-446655440001",
          "name": "TOEIC Advanced"
        }
      }
    ]
  }
]
```

**Example Requests:**

### 1. Tìm kiếm với từ khóa (sử dụng open week)

```bash
curl -X GET \
  "http://localhost:3000/user/profiles/search?search=Nguyễn"
```

**Response:** Danh sách profiles có tên, email hoặc khóa học chứa "Nguyễn", kèm lịch bận của open week.

### 2. Tìm kiếm với từ khóa và weekId cụ thể

```bash
curl -X GET \
  "http://localhost:3000/user/profiles/search?search=IELTS&weekId=550e8400-e29b-41d4-a716-446655440000"
```

**Response:** Danh sách profiles có tên khóa học chứa "IELTS", kèm lịch bận của week được chỉ định.

### 3. Lấy tất cả profiles (không có search)

```bash
curl -X GET \
  "http://localhost:3000/user/profiles/search"
```

**Response:** Tất cả profiles, sắp xếp theo thời gian tạo giảm dần, kèm lịch bận của open week.

### 4. Lấy profiles với weekId cụ thể (không có search)

```bash
curl -X GET \
  "http://localhost:3000/user/profiles/search?weekId=550e8400-e29b-41d4-a716-446655440000"
```

**Response:** Tất cả profiles, kèm lịch bận của week được chỉ định.

---

## Giải thích về Busy Schedule

### Schedule Time Slots (1-42)

Lịch bận được biểu diễn bằng mảng các số từ 1 đến 42, mỗi số đại diện cho một slot thời gian:

- **1-6**: Thứ 2 (Monday)
- **7-12**: Thứ 3 (Tuesday)
- **13-18**: Thứ 4 (Wednesday)
- **19-24**: Thứ 5 (Thursday)
- **25-30**: Thứ 6 (Friday)
- **31-36**: Thứ 7 (Saturday)
- **37-42**: Chủ nhật (Sunday)

Ví dụ: `[1, 2, 3, 7, 8]` có nghĩa là học sinh bận vào:
- Thứ 2: slot 1, 2, 3
- Thứ 3: slot 7, 8

### Nguồn dữ liệu

Lịch bận được lấy từ bảng `busy_schedule` với cấu trúc:
- `profile_id`: UUID của profile
- `week_id`: UUID của week
- `busy_schedule_arr`: Mảng các số (1-42) đại diện cho các slot thời gian bận

### Logic lấy lịch bận

1. **Nếu có `weekId` trong query**: Lấy lịch bận của week đó
2. **Nếu không có `weekId`**: 
   - Tự động tìm open week (week có `schedule_status = 'open'`)
   - Lấy lịch bận của open week
3. **Nếu không có open week**: `busyScheduleArr` sẽ là mảng rỗng `[]`

---

## Luồng hoạt động

1. Client gửi request với query parameters (search, weekId)
2. Server tìm kiếm profiles theo từ khóa (nếu có)
3. Server xác định weekId:
   - Nếu có `weekId` trong query → dùng weekId đó
   - Nếu không → tìm open week
4. Server query lịch bận từ bảng `busy_schedule` với `profile_id` và `week_id`
5. Server map lịch bận vào `busyScheduleArr` cho mỗi profile
6. Server trả về danh sách profiles kèm lịch bận

---

## Ví dụ sử dụng

### Scenario 1: Tìm học sinh theo tên

```bash
curl -X GET \
  "http://localhost:3000/user/profiles/search?search=Nguyễn Văn"
```

**Kết quả:** Tất cả học sinh có tên chứa "Nguyễn Văn", kèm lịch bận của open week.

### Scenario 2: Tìm học sinh theo email

```bash
curl -X GET \
  "http://localhost:3000/user/profiles/search?search=@gmail.com"
```

**Kết quả:** Tất cả học sinh có email chứa "@gmail.com", kèm lịch bận của open week.

### Scenario 3: Tìm học sinh theo khóa học

```bash
curl -X GET \
  "http://localhost:3000/user/profiles/search?search=IELTS Foundation"
```

**Kết quả:** Tất cả học sinh đang học khóa "IELTS Foundation", kèm lịch bận của open week.

### Scenario 4: Lấy lịch bận của week cụ thể

```bash
curl -X GET \
  "http://localhost:3000/user/profiles/search?search=Nguyễn&weekId=550e8400-e29b-41d4-a716-446655440000"
```

**Kết quả:** Học sinh có tên chứa "Nguyễn", kèm lịch bận của week được chỉ định.

---

## Lưu ý

1. **Không yêu cầu authentication**: API này có thể gọi công khai, không cần JWT token
2. **Case-insensitive search**: Tìm kiếm không phân biệt hoa thường
3. **Partial matching**: Tìm kiếm sử dụng pattern matching, không cần từ khóa chính xác
4. **Open week fallback**: Nếu không có `weekId`, hệ thống tự động dùng open week
5. **Empty busy schedule**: Nếu không có open week hoặc không có lịch bận, `busyScheduleArr` sẽ là `[]`
6. **Performance**: API sử dụng raw SQL query để lấy lịch bận cho nhiều profiles cùng lúc, đảm bảo hiệu năng tốt
7. **Sorting**: Kết quả được sắp xếp theo `createdAt DESC` (mới nhất trước)

---

## Error Responses

API này không trả về lỗi cụ thể, chỉ trả về mảng rỗng `[]` nếu không tìm thấy kết quả.

**Empty Response:**

```json
[]
```

---

## Schedule Time Reference

Để hiểu rõ hơn về các slot thời gian (1-42), tham khảo constant `SCHEDULE_TIME` trong codebase. Mỗi slot đại diện cho một khoảng thời gian cụ thể trong tuần.

