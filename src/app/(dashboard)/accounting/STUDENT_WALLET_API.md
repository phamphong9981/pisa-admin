# Student Wallet API Documentation

## Tổng quan

API quản lý ví học sinh (Student Wallet) cho phép tạo, đọc, cập nhật và xóa thông tin ví của học sinh. Mỗi học sinh có thể có một ví chứa các loại voucher khác nhau (v0-v7).

Mỗi loại ví (v0-v7) lưu trữ dưới dạng JSON với cấu trúc:
- **tang**: Tăng - Lượng đã nạp vào ví qua controller
- **giam**: Giảm - Lượng đã bị trừ vì rollcall
- **ton**: Tồn - Số lượng còn lại (balance)

## Base URL

```
/student-wallets
```

## Các loại ví (Wallet Types)

- **v0**: Buổi chính
- **v1**: Bổ trợ BTG với Giáo viên
- **v2**: Bổ trợ BTG với Tutor
- **v3**: Bổ trợ yếu BTS
- **v4**: Mock 3 kỹ năng LRW (Listening, Reading, Writing)
- **v5**: Mock S GVTT (Speaking với Giáo viên)
- **v6**: Mock S Chuyên gia (Speaking với Chuyên gia)
- **v7**: Ví dự trữ (Reserve wallet) - Hỗ trợ đặc biệt cho v0

---

## Cấu trúc dữ liệu Wallet

Mỗi loại ví (v0-v7) có cấu trúc JSON như sau:

```json
{
  "tang": 10,  // Tăng: Lượng đã nạp vào ví
  "giam": 3,   // Giảm: Lượng đã bị trừ vì rollcall
  "ton": 7     // Tồn: Số lượng còn lại = tang - giam
}
```

**Quy tắc:**
- Khi nạp tiền qua controller: Tăng `tang` và `ton`
- Khi rollcall (điểm danh): Tăng `giam` và giảm `ton`
- Công thức: `ton = tang - giam`

---

## Endpoints

### 1. Lấy tất cả ví học sinh

Lấy danh sách tất cả các ví học sinh trong hệ thống.

**Endpoint:** `GET /student-wallets`

**Response:** `200 OK`

```json
[
  {
    "id": "uuid",
    "studentId": "uuid",
    "student": {
      "id": "uuid",
      "fullname": "Tên học sinh",
      "email": "email@example.com",
      ...
    },
    "v0": {
      "tang": 10,
      "giam": 3,
      "ton": 7
    },
    "v1": {
      "tang": 5,
      "giam": 0,
      "ton": 5
    },
    "v2": {
      "tang": 3,
      "giam": 2,
      "ton": 1
    },
    "v3": {
      "tang": 2,
      "giam": 0,
      "ton": 2
    },
    "v4": {
      "tang": 1,
      "giam": 0,
      "ton": 1
    },
    "v5": {
      "tang": 0,
      "giam": 0,
      "ton": 0
    },
    "v6": {
      "tang": 0,
      "giam": 0,
      "ton": 0
    },
    "v7": {
      "tang": 0,
      "giam": 0,
      "ton": 0
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 2. Lấy tất cả profile học sinh kèm ví (có phân trang và tìm kiếm)

Lấy danh sách các profile có UserType là 'user' kèm theo ví tương ứng (nếu có) và tên các khóa học. Endpoint hỗ trợ phân trang và tìm kiếm theo tên, email, hoặc tên khóa học.

**Endpoint:** `GET /student-wallets/profiles/all`

**Query Parameters:**
- `search` (string, optional): Tìm kiếm theo fullname, email, hoặc courseNames (case-insensitive, partial match)
- `page` (number, optional): Số trang (mặc định: 1, tối thiểu: 1)
- `limit` (number, optional): Số lượng item mỗi trang (mặc định: 10, tối thiểu: 1, tối đa: 100)

**Example Requests:**
```
GET /student-wallets/profiles/all?page=1&limit=10
GET /student-wallets/profiles/all?search=Nguyễn&page=1&limit=10
GET /student-wallets/profiles/all?search=ielts&page=1&limit=20
GET /student-wallets/profiles/all?search=example@gmail.com
```

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "fullname": "Tên học sinh",
      "email": "email@example.com",
      "phone": "0123456789",
      "image": "image-url",
      "ieltsPoint": "7.5",
      "currentWeekBusyScheduleArr": [1, 5, 9],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "wallet": {
        "id": "uuid",
        "studentId": "uuid",
        "v0": {
          "tang": 10,
          "giam": 3,
          "ton": 7
        },
        "v1": {
          "tang": 5,
          "giam": 0,
          "ton": 5
        },
        "v2": {
          "tang": 3,
          "giam": 2,
          "ton": 1
        },
        "v3": {
          "tang": 2,
          "giam": 0,
          "ton": 2
        },
        "v4": {
          "tang": 1,
          "giam": 0,
          "ton": 1
        },
        "v5": {
          "tang": 0,
          "giam": 0,
          "ton": 0
        },
        "v6": {
          "tang": 0,
          "giam": 0,
          "ton": 0
        },
        "v7": {
          "tang": 0,
          "giam": 0,
          "ton": 0
        },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      "courseNames": ["IELTS Foundation", "IELTS Intermediate"]
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

**Response Fields:**
- `data`: Mảng các profile với thông tin ví và khóa học
- `total`: Tổng số profile khớp với điều kiện tìm kiếm (nếu có) có UserType là 'user' (không phụ thuộc pagination)
- `page`: Số trang hiện tại
- `limit`: Số lượng item mỗi trang

**Search Behavior:**
- Tìm kiếm không phân biệt hoa thường (case-insensitive)
- Hỗ trợ tìm kiếm một phần (partial match)
- Tìm kiếm trong các trường: `fullname`, `email`, và `courseNames`
- Ví dụ: `search=nguyen` sẽ tìm tất cả profile có fullname, email, hoặc courseNames chứa "nguyen" (không phân biệt hoa thường)

**Lưu ý:** 
- Trường `wallet` có thể là `null` nếu học sinh chưa có ví
- Trường `courseNames` là mảng tên các khóa học mà học sinh đang tham gia (có thể là mảng rỗng `[]` nếu chưa có khóa học nào)
- Khi sử dụng `search`, kết quả sẽ được filter theo điều kiện tìm kiếm và `total` sẽ phản ánh số lượng profile khớp với điều kiện

---

### 3. Lấy ví học sinh theo ID

Lấy thông tin chi tiết một ví học sinh theo ID của ví.

**Endpoint:** `GET /student-wallets/:id`

**Parameters:**
- `id` (UUID, required): ID của ví học sinh

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "studentId": "uuid",
  "student": {
    "id": "uuid",
    "fullname": "Tên học sinh",
    "email": "email@example.com",
    ...
  },
  "v0": {
    "tang": 10,
    "giam": 3,
    "ton": 7
  },
  "v1": {
    "tang": 5,
    "giam": 0,
    "ton": 5
  },
  "v2": {
    "tang": 3,
    "giam": 2,
    "ton": 1
  },
  "v3": {
    "tang": 2,
    "giam": 0,
    "ton": 2
  },
  "v4": {
    "tang": 1,
    "giam": 0,
    "ton": 1
  },
  "v5": {
    "tang": 0,
    "giam": 0,
    "ton": 0
  },
  "v6": {
    "tang": 0,
    "giam": 0,
    "ton": 0
  },
  "v7": {
    "tang": 0,
    "giam": 0,
    "ton": 0
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Response:** `404 Not Found`

```json
{
  "statusCode": 404,
  "message": "Student wallet with ID {id} not found"
}
```

---

### 4. Lấy ví học sinh theo Student ID

Lấy thông tin ví học sinh theo ID của học sinh (profile ID).

**Endpoint:** `GET /student-wallets/student/:studentId`

**Parameters:**
- `studentId` (UUID, required): ID của học sinh (profile ID)

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "studentId": "uuid",
  "student": {
    "id": "uuid",
    "fullname": "Tên học sinh",
    "email": "email@example.com",
    ...
  },
  "v0": {
    "tang": 10,
    "giam": 3,
    "ton": 7
  },
  "v1": {
    "tang": 5,
    "giam": 0,
    "ton": 5
  },
  "v2": {
    "tang": 3,
    "giam": 2,
    "ton": 1
  },
  "v3": {
    "tang": 2,
    "giam": 0,
    "ton": 2
  },
  "v4": {
    "tang": 1,
    "giam": 0,
    "ton": 1
  },
  "v5": {
    "tang": 0,
    "giam": 0,
    "ton": 0
  },
  "v6": {
    "tang": 0,
    "giam": 0,
    "ton": 0
  },
  "v7": {
    "tang": 0,
    "giam": 0,
    "ton": 0
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Response:** `404 Not Found`

```json
{
  "statusCode": 404,
  "message": "Student wallet for student ID {studentId} not found"
}
```

---

### 5. Tạo hoặc tăng số lượng ví học sinh

**⚠️ THAY ĐỔI MỚI:** API này thay thế cho POST `/student-wallets` và PUT `/student-wallets/:id` / PUT `/student-wallets/student/:studentId`.

Tạo ví mới nếu chưa tồn tại, hoặc tăng số lượng nếu ví đã tồn tại. Khi tương tác với API này, giá trị sẽ được cộng vào `tang` (tăng) và `ton` (tồn).

**Endpoint:** `POST /student-wallets/increase`

**Request Body:**

```json
{
  "studentId": "uuid",  // Required: ID của học sinh (profile ID)
  "v0": 5,              // Optional: Số lượng tăng vào v0 (phải >= 0)
  "v1": 3,              // Optional: Số lượng tăng vào v1 (phải >= 0)
  "v2": 0,              // Optional: Số lượng tăng vào v2 (phải >= 0)
  "v3": 0,              // Optional: Số lượng tăng vào v3 (phải >= 0)
  "v4": 0,              // Optional: Số lượng tăng vào v4 (phải >= 0)
  "v5": 0,              // Optional: Số lượng tăng vào v5 (phải >= 0)
  "v6": 0,              // Optional: Số lượng tăng vào v6 (phải >= 0)
  "v7": 0               // Optional: Số lượng tăng vào v7 - ví dự trữ (phải >= 0)
}
```

**Validation Rules:**
- `studentId`: Phải là UUID hợp lệ (required)
- `v0-v7`: Phải là số nguyên >= 0 (optional, nếu không cung cấp sẽ không thay đổi)

**Behavior:**
- **Nếu ví chưa tồn tại:** Tạo ví mới với các giá trị được cung cấp
  - `tang` = giá trị được cung cấp
  - `giam` = 0
  - `ton` = giá trị được cung cấp (bằng tang)
- **Nếu ví đã tồn tại:** Tăng các giá trị
  - `tang` += giá trị được cung cấp
  - `ton` += giá trị được cung cấp
  - `giam` không thay đổi

**Response:** `200 OK` hoặc `201 Created`

```json
{
  "id": "uuid",
  "studentId": "uuid",
  "v0": {
    "tang": 5,
    "giam": 0,
    "ton": 5
  },
  "v1": {
    "tang": 3,
    "giam": 0,
    "ton": 3
  },
  "v2": {
    "tang": 0,
    "giam": 0,
    "ton": 0
  },
  "v3": {
    "tang": 0,
    "giam": 0,
    "ton": 0
  },
  "v4": {
    "tang": 0,
    "giam": 0,
    "ton": 0
  },
  "v5": {
    "tang": 0,
    "giam": 0,
    "ton": 0
  },
  "v6": {
    "tang": 0,
    "giam": 0,
    "ton": 0
  },
  "v7": {
    "tang": 0,
    "giam": 0,
    "ton": 0
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Ví dụ: Tăng thêm vào ví đã tồn tại**

Giả sử ví hiện tại có:
```json
{
  "v0": {
    "tang": 10,
    "giam": 3,
    "ton": 7
  }
}
```

Nếu gọi API với `{"studentId": "uuid", "v0": 5}`, kết quả sẽ là:
```json
{
  "v0": {
    "tang": 15,  // 10 + 5
    "giam": 3,   // Không đổi
    "ton": 12    // 7 + 5
  }
}
```

**Error Responses:**

`400 Bad Request` - Validation error:
```json
{
  "statusCode": 400,
  "message": ["studentId must be a UUID", "v0 must be an integer", "v0 must not be less than 0"]
}
```

`404 Not Found` - Student not found:
```json
{
  "statusCode": 404,
  "message": "Student with ID {studentId} not found"
}
```

---

### 6. Xóa ví học sinh theo ID

Xóa một ví học sinh theo ID của ví.

**Endpoint:** `DELETE /student-wallets/:id`

**Parameters:**
- `id` (UUID, required): ID của ví học sinh

**Response:** `204 No Content`

**Error Response:** `404 Not Found`

```json
{
  "statusCode": 404,
  "message": "Student wallet with ID {id} not found"
}
```

---

### 7. Xóa ví học sinh theo Student ID

Xóa ví học sinh theo ID của học sinh (profile ID).

**Endpoint:** `DELETE /student-wallets/student/:studentId`

**Parameters:**
- `studentId` (UUID, required): ID của học sinh (profile ID)

**Response:** `204 No Content`

**Error Response:** `404 Not Found`

```json
{
  "statusCode": 404,
  "message": "Student wallet for student ID {studentId} not found"
}
```

---

## Tương tác với Rollcall

Khi sử dụng batch rollcall (điểm danh hàng loạt), hệ thống sẽ tự động cập nhật ví học sinh:

### Logic chung cho các ví (v1-v7)

- **Khi chuyển sang trạng thái positive (ATTENDING, TRIAL, RETAKE):**
  - `giam` += 1
  - `ton` -= 1

- **Khi chuyển từ trạng thái positive sang không positive:**
  - `giam` -= 1
  - `ton` += 1

### Logic đặc biệt cho V0 (Buổi chính) với V7 (Ví dự trữ)

V0 có logic đặc biệt khi rollcall, sử dụng V7 như một ví dự trữ:

**Khi điểm danh thành công (chuyển sang positive):**
1. Nếu `v0.ton > 0`: Trừ v0 như bình thường
   - `v0.giam` += 1
   - `v0.ton` -= 1

2. Nếu `v0.ton <= 0` và `v7.ton > 0`: Trừ v7 (ví dự trữ)
   - `v7.giam` += 1
   - `v7.ton` -= 1

3. Nếu `v0.ton <= 0` và `v7.ton <= 0`: Trừ v0 (cho phép về âm)
   - `v0.giam` += 1
   - `v0.ton` -= 1 (có thể < 0)

**Khi rollback (chuyển từ positive sang không positive):**
1. Nếu `v7.giam > 0`: Khôi phục v7 (đã dùng v7 trước đó)
   - `v7.giam` -= 1
   - `v7.ton` += 1

2. Nếu không: Khôi phục v0 (đã dùng v0, có thể là số dương hoặc đã âm)
   - `v0.giam` -= 1
   - `v0.ton` += 1

**Ví dụ:**

Tình huống 1: V0 còn dư, V7 có sẵn
```
v0: {tang: 10, giam: 3, ton: 7}
v7: {tang: 5, giam: 0, ton: 5}

Khi rollcall → Trừ v0
v0: {tang: 10, giam: 4, ton: 6}  // ton vẫn > 0
v7: {tang: 5, giam: 0, ton: 5}   // không thay đổi
```

Tình huống 2: V0 hết, V7 còn
```
v0: {tang: 10, giam: 10, ton: 0}
v7: {tang: 5, giam: 0, ton: 5}

Khi rollcall → Trừ v7
v0: {tang: 10, giam: 10, ton: 0}  // không thay đổi
v7: {tang: 5, giam: 1, ton: 4}    // trừ từ v7
```

Tình huống 3: V0 hết, V7 cũng hết
```
v0: {tang: 10, giam: 10, ton: 0}
v7: {tang: 5, giam: 5, ton: 0}

Khi rollcall → Trừ v0 (cho phép âm)
v0: {tang: 10, giam: 11, ton: -1}  // cho phép về âm
v7: {tang: 5, giam: 5, ton: 0}     // không thay đổi
```

**Lưu ý:** 
- Việc cập nhật ví khi rollcall được thực hiện tự động bởi hệ thống, không cần gọi API thủ công
- V7 chỉ được sử dụng khi rollcall cho V0 (buổi chính)
- V0 có thể có giá trị âm (`ton < 0`) khi cả V0 và V7 đều hết

---

## Status Codes

| Status Code | Mô tả |
|------------|-------|
| 200 | OK - Request thành công |
| 201 | Created - Tạo resource thành công |
| 204 | No Content - Xóa thành công (không có response body) |
| 400 | Bad Request - Validation error hoặc request không hợp lệ |
| 404 | Not Found - Resource không tồn tại |

## Validation

- Tất cả ID phải là UUID hợp lệ
- Các giá trị ví (v0-v7) trong request phải là số nguyên >= 0
- Mỗi học sinh chỉ có thể có một ví duy nhất
- `studentId` trong request body là bắt buộc

## Notes

- Tất cả các endpoints đều sử dụng `TransformInterceptor` và `ClassSerializerInterceptor` để format response
- Timestamps được trả về theo format ISO 8601
- Mỗi loại ví (v0-v7) lưu trữ dưới dạng JSON với cấu trúc `{tang, giam, ton}`
- API `POST /student-wallets/increase` sẽ tự động tạo ví nếu chưa tồn tại, hoặc tăng số lượng nếu đã tồn tại
- Việc cập nhật ví khi rollcall được thực hiện tự động bởi hệ thống trong quá trình điểm danh
- **V7 (Ví dự trữ):** Chỉ được sử dụng tự động khi rollcall cho V0 (buổi chính). V7 không được sử dụng trực tiếp trong rollcall cho các loại lớp khác
- **V0 có thể về âm:** Khi cả V0 và V7 đều hết (`ton <= 0`), hệ thống sẽ cho phép V0 có giá trị âm để tiếp tục điểm danh
