# Orders API Documentation

## Tổng quan

Module Orders cung cấp API CRUD để quản lý hóa đơn (orders) trong hệ thống. API hỗ trợ tạo đơn lẻ hoặc tạo hàng loạt (bulk), với các tính năng lọc và phân trang.

**Base URL:** `/orders`

**Authentication:** Tất cả endpoints yêu cầu JWT authentication. Một số endpoints yêu cầu Admin role.

---

## Endpoints

### 1. Tạo một Order (Single)

**POST** `/orders`

Tạo một hóa đơn mới.

**Authentication:** Admin only

**Request Body:**

```json
{
  "billType": 1,
  "profileId": "550e8400-e29b-41d4-a716-446655440000",
  "billCategoryId": 79,
  "billCategoryName": "Học phí",
  "paymentMethod": "cash",
  "description": "Học phí tháng 1/2025",
  "totalAmount": 5000000,
  "paidAmount": 3000000,
  "deadline": "2025-01-31"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `billType` | `integer` | Yes | Loại hóa đơn: `0` = Phiếu chi, `1` = Phiếu thu |
| `profileId` | `UUID` | Yes | ID của profile học sinh |
| `billCategoryId` | `integer` | Yes | ID danh mục hóa đơn (xem enum BillCategory) |
| `billCategoryName` | `string` | Yes | Tên danh mục hóa đơn (max 255 chars) |
| `paymentMethod` | `string` | No | Hình thức thanh toán: `cash`, `deposit`, `transfer`, `mpos`, `installment` |
| `description` | `string` | No | Mô tả chi tiết |
| `totalAmount` | `number` | Yes | Tổng tiền (BIGINT, lưu dưới dạng số nguyên) |
| `paidAmount` | `number` | No | Số tiền đã trả (mặc định: 0) |
| `deadline` | `string` | No | Hạn thanh toán (format: YYYY-MM-DD) |

**Response:**

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "billType": 1,
  "profileId": "550e8400-e29b-41d4-a716-446655440000",
  "billCategoryId": 79,
  "billCategoryName": "Học phí",
  "paymentMethod": "cash",
  "description": "Học phí tháng 1/2025",
  "totalAmount": 5000000,
  "paidAmount": 3000000,
  "deadline": "2025-01-31T00:00:00.000Z",
  "createdAt": "2025-01-12T10:00:00.000Z",
  "updatedAt": "2025-01-12T10:00:00.000Z"
}
```

---

### 2. Tạo nhiều Orders (Bulk)

**POST** `/orders/bulk`

Tạo nhiều hóa đơn cùng lúc trong một transaction.

**Authentication:** Admin only

**Request Body:**

```json
{
  "orders": [
    {
      "billType": 1,
      "profileId": "550e8400-e29b-41d4-a716-446655440000",
      "billCategoryId": 79,
      "billCategoryName": "Học phí",
      "totalAmount": 5000000,
      "paidAmount": 3000000
    },
    {
      "billType": 1,
      "profileId": "550e8400-e29b-41d4-a716-446655440000",
      "billCategoryId": 711,
      "billCategoryName": "Tiền ăn (ăn cơm, ăn vặt...)",
      "totalAmount": 500000,
      "paidAmount": 0,
      "deadline": "2025-01-31"
    }
  ]
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `orders` | `array` | Yes | Mảng các order objects (tối thiểu 1 item) |

Mỗi order object có cùng structure như Create Order (Single).

**Response:**

```json
{
  "created": 2,
  "failed": 0,
  "errors": [],
  "orders": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "billType": 1,
      "profileId": "550e8400-e29b-41d4-a716-446655440000",
      "billCategoryId": 79,
      "billCategoryName": "Học phí",
      "totalAmount": 5000000,
      "paidAmount": 3000000,
      "createdAt": "2025-01-12T10:00:00.000Z",
      "updatedAt": "2025-01-12T10:00:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440002",
      "billType": 1,
      "profileId": "550e8400-e29b-41d4-a716-446655440000",
      "billCategoryId": 711,
      "billCategoryName": "Tiền ăn (ăn cơm, ăn vặt...)",
      "totalAmount": 500000,
      "paidAmount": 0,
      "deadline": "2025-01-31T00:00:00.000Z",
      "createdAt": "2025-01-12T10:00:00.000Z",
      "updatedAt": "2025-01-12T10:00:00.000Z"
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `created` | `number` | Số lượng orders đã tạo thành công |
| `failed` | `number` | Số lượng orders thất bại |
| `errors` | `array` | Mảng các lỗi (nếu có), mỗi error có `index` và `error` message |
| `orders` | `array` | Mảng các orders đã tạo thành công |

**Lưu ý:** Nếu có lỗi trong quá trình tạo, transaction sẽ rollback và trả về error message.

---

### 3. Lấy danh sách Orders

**GET** `/orders`

Lấy danh sách orders với các filters và pagination.

**Authentication:** Required (JWT)

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `profileId` | `UUID` | No | - | Lọc theo profile ID |
| `billType` | `integer` | No | - | Lọc theo loại hóa đơn: `0` hoặc `1` |
| `billCategoryId` | `integer` | No | - | Lọc theo category ID |
| `page` | `integer` | No | `1` | Số trang |
| `limit` | `integer` | No | `10` | Số items mỗi trang |

**Request Examples:**

```
GET /orders
GET /orders?profileId=550e8400-e29b-41d4-a716-446655440000
GET /orders?billType=1&page=1&limit=20
GET /orders?profileId=550e8400-e29b-41d4-a716-446655440000&billCategoryId=79
```

**Response:**

```json
{
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "billType": 1,
      "profileId": "550e8400-e29b-41d4-a716-446655440000",
      "billCategoryId": 79,
      "billCategoryName": "Học phí",
      "paymentMethod": "cash",
      "description": "Học phí tháng 1/2025",
      "totalAmount": 5000000,
      "paidAmount": 3000000,
      "deadline": "2025-01-31T00:00:00.000Z",
      "createdAt": "2025-01-12T10:00:00.000Z",
      "updatedAt": "2025-01-12T10:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `data` | `array` | Mảng các orders |
| `total` | `number` | Tổng số orders (không phân trang) |
| `page` | `number` | Trang hiện tại |
| `limit` | `number` | Số items mỗi trang |

**Sắp xếp:** Orders được sắp xếp theo `createdAt` DESC (mới nhất trước).

---

### 4. Lấy một Order theo ID

**GET** `/orders/:id`

Lấy thông tin chi tiết của một order.

**Authentication:** Required (JWT)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `UUID` | Yes | ID của order |

**Request Example:**

```
GET /orders/660e8400-e29b-41d4-a716-446655440001
```

**Response:**

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "billType": 1,
  "profileId": "550e8400-e29b-41d4-a716-446655440000",
  "billCategoryId": 79,
  "billCategoryName": "Học phí",
  "paymentMethod": "cash",
  "description": "Học phí tháng 1/2025",
  "totalAmount": 5000000,
  "paidAmount": 3000000,
  "deadline": "2025-01-31T00:00:00.000Z",
  "createdAt": "2025-01-12T10:00:00.000Z",
  "updatedAt": "2025-01-12T10:00:00.000Z",
  "profile": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullname": "Nguyễn Văn A",
    "email": "nguyenvana@example.com"
  }
}
```

**Error Response (404):**

```json
{
  "statusCode": 404,
  "message": "Order with ID 660e8400-e29b-41d4-a716-446655440001 not found"
}
```

---

### 5. Cập nhật Order

**PUT** `/orders/:id`

Cập nhật thông tin của một order. Tất cả fields đều optional.

**Authentication:** Admin only

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `UUID` | Yes | ID của order |

**Request Body:**

```json
{
  "paidAmount": 5000000,
  "description": "Đã thanh toán đủ"
}
```

**Request Fields (tất cả optional):**

| Field | Type | Description |
|-------|------|-------------|
| `billType` | `integer` | Loại hóa đơn |
| `profileId` | `UUID` | Profile ID |
| `billCategoryId` | `integer` | Category ID |
| `billCategoryName` | `string` | Category name |
| `paymentMethod` | `string` | Payment method |
| `description` | `string` | Description |
| `totalAmount` | `number` | Total amount |
| `paidAmount` | `number` | Paid amount |
| `deadline` | `string` | Deadline (YYYY-MM-DD) |

**Response:**

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "billType": 1,
  "profileId": "550e8400-e29b-41d4-a716-446655440000",
  "billCategoryId": 79,
  "billCategoryName": "Học phí",
  "paymentMethod": "cash",
  "description": "Đã thanh toán đủ",
  "totalAmount": 5000000,
  "paidAmount": 5000000,
  "deadline": "2025-01-31T00:00:00.000Z",
  "createdAt": "2025-01-12T10:00:00.000Z",
  "updatedAt": "2025-01-12T11:00:00.000Z"
}
```

---

### 6. Xóa Order

**DELETE** `/orders/:id`

Xóa một order.

**Authentication:** Admin only

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `UUID` | Yes | ID của order |

**Request Example:**

```
DELETE /orders/660e8400-e29b-41d4-a716-446655440001
```

**Response:**

```json
{
  "message": "Order deleted successfully"
}
```

---

## Enums

### BillType

| Value | Description |
|-------|-------------|
| `0` | Phiếu chi (Payment) |
| `1` | Phiếu thu (Receipt) |

### PaymentMethod

| Value | Description |
|-------|-------------|
| `cash` | Tiền mặt |
| `deposit` | Ví đặt cọc |
| `transfer` | Chuyển khoản |
| `mpos` | Quẹt thẻ |
| `installment` | Trả góp |

### BillCategory

#### Phiếu thu (Receipt) - billType = 1

| ID | Name |
|----|------|
| `325` | Các khoản giảm trừ doanh thu |
| `314` | Doanh thu bán hàng và cung cấp dịch vụ |
| `79` | Học phí |
| `83` | Kho |
| `84` | Phí chuyển lớp |
| `126` | Ví thành viên |
| `522` | Hoàn tiền |
| `523` | Hoàn tiền học phí |
| `524` | Hoàn tiền đặt cọc |
| `509` | Hợp đồng thuê nhà |
| `512` | Dịch vụ |
| `510` | Tiền thuê nhà |
| `511` | Đặt cọc thuê nhà |
| `318` | Thu khác (Thu phát sinh) |
| `80` | Lệ phí thi IELTS |
| `81` | Giáo trình tài liệu |
| `1332` | Tiền thi thử - Mock test |
| `1188` | Tiền ký túc xá |
| `711` | Tiền ăn (ăn cơm, ăn vặt...) |
| `1185` | Phí app phát âm ELSA |

#### Phiếu chi (Payment) - billType = 0

| ID | Name |
|----|------|
| `464` | Giảm giá hàng bán |
| `459` | Hàng bán bị trả lại |
| `463` | Khuyến mại |
| `461` | Trả lại học phí |
| `462` | Trả lại tiền cọc |
| `326` | Chi khác (Chi phát sinh) |
| `78` | Học phí tháng trước nộp thừa |
| `1187` | Lệ phí thi IELTS được hoàn |
| `1333` | Chi phí đi thi IELTS |
| `1186` | Học phí tháng trước chưa hoàn thành |

---

## Ví dụ sử dụng

### cURL Examples

#### 1. Tạo một order

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "billType": 1,
    "profileId": "550e8400-e29b-41d4-a716-446655440000",
    "billCategoryId": 79,
    "billCategoryName": "Học phí",
    "paymentMethod": "cash",
    "description": "Học phí tháng 1/2025",
    "totalAmount": 5000000,
    "paidAmount": 3000000,
    "deadline": "2025-01-31"
  }'
```

#### 2. Tạo nhiều orders (bulk)

```bash
curl -X POST http://localhost:3000/orders/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "orders": [
      {
        "billType": 1,
        "profileId": "550e8400-e29b-41d4-a716-446655440000",
        "billCategoryId": 79,
        "billCategoryName": "Học phí",
        "totalAmount": 5000000,
        "paidAmount": 3000000
      },
      {
        "billType": 1,
        "profileId": "550e8400-e29b-41d4-a716-446655440000",
        "billCategoryId": 711,
        "billCategoryName": "Tiền ăn (ăn cơm, ăn vặt...)",
        "totalAmount": 500000,
        "paidAmount": 0
      }
    ]
  }'
```

#### 3. Lấy danh sách orders

```bash
curl -X GET "http://localhost:3000/orders?profileId=550e8400-e29b-41d4-a716-446655440000&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 4. Lấy một order

```bash
curl -X GET http://localhost:3000/orders/660e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 5. Cập nhật order

```bash
curl -X PUT http://localhost:3000/orders/660e8400-e29b-41d4-a716-446655440001 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "paidAmount": 5000000,
    "description": "Đã thanh toán đủ"
  }'
```

#### 6. Xóa order

```bash
curl -X DELETE http://localhost:3000/orders/660e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### JavaScript/TypeScript Examples

#### Axios

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';
const token = 'YOUR_TOKEN';

// Tạo một order
async function createOrder() {
  const response = await axios.post(
    `${API_BASE_URL}/orders`,
    {
      billType: 1,
      profileId: '550e8400-e29b-41d4-a716-446655440000',
      billCategoryId: 79,
      billCategoryName: 'Học phí',
      paymentMethod: 'cash',
      description: 'Học phí tháng 1/2025',
      totalAmount: 5000000,
      paidAmount: 3000000,
      deadline: '2025-01-31'
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}

// Tạo nhiều orders (bulk)
async function createOrdersBulk() {
  const response = await axios.post(
    `${API_BASE_URL}/orders/bulk`,
    {
      orders: [
        {
          billType: 1,
          profileId: '550e8400-e29b-41d4-a716-446655440000',
          billCategoryId: 79,
          billCategoryName: 'Học phí',
          totalAmount: 5000000,
          paidAmount: 3000000
        },
        {
          billType: 1,
          profileId: '550e8400-e29b-41d4-a716-446655440000',
          billCategoryId: 711,
          billCategoryName: 'Tiền ăn (ăn cơm, ăn vặt...)',
          totalAmount: 500000,
          paidAmount: 0
        }
      ]
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}

// Lấy danh sách orders
async function getOrders(profileId?: string, page = 1, limit = 10) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  if (profileId) {
    params.append('profileId', profileId);
  }

  const response = await axios.get(
    `${API_BASE_URL}/orders?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.data;
}

// Lấy một order
async function getOrder(id: string) {
  const response = await axios.get(
    `${API_BASE_URL}/orders/${id}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.data;
}

// Cập nhật order
async function updateOrder(id: string, updates: any) {
  const response = await axios.put(
    `${API_BASE_URL}/orders/${id}`,
    updates,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}

// Xóa order
async function deleteOrder(id: string) {
  const response = await axios.delete(
    `${API_BASE_URL}/orders/${id}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.data;
}
```

---

## Error Handling

### Validation Errors (400)

Khi request body không hợp lệ:

```json
{
  "statusCode": 400,
  "message": [
    "billType must be one of the following values: 0, 1",
    "profileId must be a UUID",
    "totalAmount should not be empty"
  ],
  "error": "Bad Request"
}
```

### Not Found (404)

Khi order không tồn tại:

```json
{
  "statusCode": 404,
  "message": "Order with ID 660e8400-e29b-41d4-a716-446655440001 not found"
}
```

### Unauthorized (401)

Khi thiếu hoặc token không hợp lệ:

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Forbidden (403)

Khi không có quyền Admin:

```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

---

## Lưu ý quan trọng

1. **Số tiền (Amount):** Tất cả số tiền được lưu dưới dạng `BIGINT` (số nguyên). Nếu cần lưu số thập phân, hãy chuyển đổi sang đơn vị nhỏ nhất (ví dụ: 1000.50 đồng → 100050).

2. **Bulk Create:** Khi tạo bulk, tất cả orders được tạo trong một transaction. Nếu có lỗi, toàn bộ transaction sẽ rollback.

3. **Deadline:** Format date là `YYYY-MM-DD`. Khi gửi request, có thể dùng string, API sẽ tự động convert sang Date object.

4. **Pagination:** Mặc định `page = 1` và `limit = 10`. Có thể điều chỉnh qua query parameters.

5. **Sorting:** Danh sách orders được sắp xếp theo `createdAt` DESC (mới nhất trước).

---

## Changelog

- **v1.0.0** (2025-01-12): Initial release với CRUD operations và bulk create

