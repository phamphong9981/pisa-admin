# Profile Search API Documentation

## Tổng quan

API tìm kiếm profile (hồ sơ học sinh) theo tên, email hoặc tên khóa học. API hỗ trợ tìm kiếm không phân biệt hoa thường và tìm kiếm một phần.

## Base URL

```
/user/profiles/search
```

## Endpoint

### Tìm kiếm Profile

Tìm kiếm profile theo `fullname`, `email`, hoặc `courseName` (tên khóa học mà học sinh đang tham gia).

**Endpoint:** `GET /user/profiles/search`

**Query Parameters:**
- `search` (string, optional): Từ khóa tìm kiếm (tìm kiếm trong fullname, email, hoặc course name)

**Example Requests:**
```bash
# Tìm tất cả profiles (không có filter)
GET /user/profiles/search

# Tìm theo tên
GET /user/profiles/search?search=Nguyễn

# Tìm theo email
GET /user/profiles/search?search=example@gmail.com

# Tìm theo tên khóa học
GET /user/profiles/search?search=IELTS

# Tìm kiếm một phần
GET /user/profiles/search?search=nguyen
```

**Response:** `200 OK`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "fullname": "Nguyễn Văn A",
    "email": "nguyenvana@gmail.com",
    "phone": "0123456789",
    "image": "https://example.com/image.jpg",
    "ieltsPoint": "7.5",
    "currentWeekBusyScheduleArr": [1, 5, 9],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "profileCourses": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "profileId": "550e8400-e29b-41d4-a716-446655440000",
        "courseId": "550e8400-e29b-41d4-a716-446655440020",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "course": {
          "id": "550e8400-e29b-41d4-a716-446655440020",
          "name": "IELTS Foundation",
          "type": "foundation",
          "teacherId": "550e8400-e29b-41d4-a716-446655440030",
          "region": 1,
          "status": "active",
          "createdAt": "2024-01-01T00:00:00.000Z",
          "updatedAt": "2024-01-01T00:00:00.000Z"
        }
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440011",
        "profileId": "550e8400-e29b-41d4-a716-446655440000",
        "courseId": "550e8400-e29b-41d4-a716-446655440021",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "course": {
          "id": "550e8400-e29b-41d4-a716-446655440021",
          "name": "IELTS Intermediate",
          "type": "intermediate",
          "teacherId": "550e8400-e29b-41d4-a716-446655440031",
          "region": 1,
          "status": "active",
          "createdAt": "2024-01-01T00:00:00.000Z",
          "updatedAt": "2024-01-01T00:00:00.000Z"
        }
      }
    ]
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "userId": "550e8400-e29b-41d4-a716-446655440003",
    "fullname": "Trần Thị B",
    "email": "tranthib@example.com",
    "phone": "0987654321",
    "image": "https://example.com/image2.jpg",
    "ieltsPoint": "6.5",
    "currentWeekBusyScheduleArr": [],
    "createdAt": "2024-01-02T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z",
    "profileCourses": []
  }
]
```

**Response Fields:**

- `id`: UUID của profile
- `userId`: UUID của user liên kết
- `fullname`: Họ và tên học sinh
- `email`: Email của học sinh
- `phone`: Số điện thoại
- `image`: URL hình ảnh đại diện
- `ieltsPoint`: Điểm IELTS
- `currentWeekBusyScheduleArr`: Mảng các thời gian bận trong tuần hiện tại (schedule time slots)
- `createdAt`: Thời gian tạo (ISO 8601 format)
- `updatedAt`: Thời gian cập nhật cuối (ISO 8601 format)
- `profileCourses`: Mảng các khóa học mà học sinh đang tham gia
  - `id`: UUID của profile_course record
  - `profileId`: UUID của profile
  - `courseId`: UUID của course
  - `course`: Thông tin chi tiết của khóa học
    - `id`: UUID của course
    - `name`: Tên khóa học
    - `type`: Loại khóa học (foundation, intermediate, advanced, ielts, toefl, toeic)
    - `teacherId`: UUID của giáo viên
    - `region`: Vùng (region number)
    - `status`: Trạng thái (active, inactive)
    - `createdAt`: Thời gian tạo
    - `updatedAt`: Thời gian cập nhật

**Lưu ý:**
- Nếu không có `search` parameter, API trả về tất cả profiles (sắp xếp theo createdAt DESC)
- `profileCourses` có thể là mảng rỗng `[]` nếu học sinh chưa đăng ký khóa học nào
- Response được sắp xếp theo `createdAt DESC` (mới nhất trước)

---

## Tính năng tìm kiếm

### Search Behavior

- **Case-insensitive**: Không phân biệt hoa thường
  - Ví dụ: `search=nguyen` sẽ tìm thấy "Nguyễn", "NGUYỄN", "nguyễn"
  
- **Partial match**: Tìm kiếm một phần
  - Ví dụ: `search=nguyen` sẽ tìm thấy "Nguyễn Văn A", "Trần Nguyễn B"
  
- **Multi-field search**: Tìm kiếm trong nhiều trường
  - `profile.fullname`: Tên học sinh
  - `profile.email`: Email học sinh
  - `course.name`: Tên khóa học (thông qua relation profileCourses)

### Logic tìm kiếm

API sử dụng PostgreSQL `ILIKE` operator với pattern `%search%`:
```sql
WHERE (profile.fullname ILIKE '%search%' 
   OR profile.email ILIKE '%search%' 
   OR course.name ILIKE '%search%')
```

### Ví dụ tìm kiếm

1. **Tìm theo tên:**
   ```
   GET /user/profiles/search?search=Nguyễn
   ```
   - Tìm tất cả profile có fullname chứa "Nguyễn"
   - Tìm tất cả profile có email chứa "Nguyễn" (hiếm khi xảy ra)
   - Tìm tất cả profile có course name chứa "Nguyễn"

2. **Tìm theo email:**
   ```
   GET /user/profiles/search?search=example@gmail.com
   ```
   - Tìm profile có email chứa "example@gmail.com"
   - Có thể tìm thấy nếu fullname hoặc course name chứa chuỗi này (hiếm)

3. **Tìm theo tên khóa học:**
   ```
   GET /user/profiles/search?search=IELTS
   ```
   - Tìm tất cả profile có tham gia khóa học có tên chứa "IELTS"
   - Ví dụ: "IELTS Foundation", "IELTS Intermediate", "IELTS Advanced"

4. **Tìm kiếm một phần:**
   ```
   GET /user/profiles/search?search=ielts
   ```
   - Tìm kiếm không phân biệt hoa thường
   - Sẽ tìm thấy "IELTS", "ielts", "Ielts", v.v.

---

## Use Cases

### 1. Tìm kiếm học sinh theo tên

```typescript
// Tìm học sinh có tên "Nguyễn"
const response = await fetch('/user/profiles/search?search=Nguyễn');
const profiles = await response.json();

profiles.forEach(profile => {
  console.log(`${profile.fullname} - ${profile.email}`);
});
```

### 2. Tìm học sinh trong một khóa học cụ thể

```typescript
// Tìm tất cả học sinh tham gia khóa học "IELTS Foundation"
const response = await fetch('/user/profiles/search?search=IELTS Foundation');
const profiles = await response.json();

profiles.forEach(profile => {
  const courses = profile.profileCourses.map(pc => pc.course.name);
  console.log(`${profile.fullname}: ${courses.join(', ')}`);
});
```

### 3. Tìm học sinh theo email

```typescript
// Tìm học sinh theo email
const email = 'example@gmail.com';
const response = await fetch(`/user/profiles/search?search=${email}`);
const profiles = await response.json();

if (profiles.length > 0) {
  console.log('Found:', profiles[0]);
}
```

### 4. Lấy tất cả profiles

```typescript
// Lấy tất cả profiles (không filter)
const response = await fetch('/user/profiles/search');
const profiles = await response.json();

console.log(`Total profiles: ${profiles.length}`);
```

---

## Status Codes

| Status Code | Mô tả |
|------------|-------|
| 200 | OK - Request thành công |
| 400 | Bad Request - Validation error (nếu có validation rule vi phạm) |

---

## Validation

- `search`: Phải là string hợp lệ (nếu được cung cấp)
- Không có validation nghiêm ngặt về độ dài tối đa của search term

---

## Notes

- Tất cả các endpoints đều sử dụng `ClassSerializerInterceptor` và `TransformInterceptor` để format response
- Timestamps được trả về theo format ISO 8601
- API không yêu cầu authentication (public endpoint)
- Kết quả được sắp xếp theo `createdAt DESC` để hiển thị profiles mới nhất trước
- Nếu một profile có nhiều khóa học, tất cả các khóa học sẽ được trả về trong `profileCourses` array
- Relation `profileCourses` và `course` được load tự động để cung cấp thông tin đầy đủ về khóa học

