# Food Ordering Service - Backend API

NestJS backend API สำหรับระบบสั่งอาหารออนไลน์

## Technology Stack

- **Framework**: NestJS 10.x
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Real-time**: WebSocket (Socket.io)
- **Authentication**: JWT (JSON Web Token)
- **Validation**: class-validator
- **API Documentation**: Swagger

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for PostgreSQL)
- npm or yarn

### Installation

1. **Clone และติดตั้ง dependencies**

```bash
cd food-ordering-service
npm install
```

2. **ตั้งค่า Environment Variables**

```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env` ตามต้องการ:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5433/food_ordering"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=5555
```

3. **รัน PostgreSQL ด้วย Docker**

```bash
docker-compose up -d
```

4. **สร้าง Database Schema**

```bash
npx prisma migrate dev --name init
```

5. **Seed ข้อมูลตัวอย่าง**

```bash
npx prisma db seed
```

6. **รัน Development Server**

```bash
npm run start:dev
```

Server จะรันที่ http://localhost:5555

## API Documentation

เข้าถึง Swagger UI ได้ที่: http://localhost:5555/api/docs

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register (Admin only) |
| GET | /api/auth/profile | Get profile |

### Menu
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/menu | Get all menu items |
| GET | /api/menu/:id | Get menu item by ID |
| GET | /api/menu/categories | Get all categories |
| POST | /api/menu | Create menu (Admin) |
| PUT | /api/menu/:id | Update menu (Admin) |
| DELETE | /api/menu/:id | Delete menu (Admin) |

### Add-ons
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/addons | Get all add-ons |
| GET | /api/addon-groups | Get all add-on groups |
| POST | /api/addons | Create add-on (Admin) |
| POST | /api/addon-groups | Create group (Admin) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/orders | Create order |
| GET | /api/orders | Get all orders |
| GET | /api/orders/:id | Get order by ID |
| GET | /api/orders/today | Get today's orders |
| PATCH | /api/orders/:id/status | Update status |

### Queue (Kiosk)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/queue | Create queue ticket |
| GET | /api/queue | Get all tickets |
| GET | /api/queue/waiting | Get waiting queue |
| GET | /api/queue/ready | Get ready queue |
| GET | /api/queue/stats | Get queue stats |
| PATCH | /api/queue/:id/status | Update status |
| POST | /api/queue/:id/call | Call queue |

### Tables
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tables | Get all tables |
| GET | /api/tables/available | Get available tables |
| GET | /api/tables/stats | Get table stats |
| PATCH | /api/tables/:id/status | Update status |
| POST | /api/tables/:id/merge | Merge tables |

### Service Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/service-requests | Create request |
| GET | /api/service-requests | Get all requests |
| GET | /api/service-requests/pending | Get pending |
| PATCH | /api/service-requests/:id/status | Update status |

### Members
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/members | Create member |
| GET | /api/members | Get all members |
| GET | /api/members/:id | Get member by ID |
| POST | /api/members/:id/add-points | Add points |
| POST | /api/members/:id/redeem-points | Redeem points |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard/stats | Overview stats |
| GET | /api/dashboard/queue-stats | Queue stats |
| GET | /api/dashboard/order-stats | Order stats |
| GET | /api/dashboard/popular-items | Popular items |
| GET | /api/dashboard/revenue-by-hour | Hourly revenue |

## WebSocket Events

### Queue Namespace: `/queue`

**Server Events (emit to clients)**
- `queue:created` - เมื่อมีคิวใหม่
- `queue:called` - เมื่อเรียกคิว
- `queue:statusChanged` - เมื่อสถานะคิวเปลี่ยน

**Client Events (send to server)**
- `subscribe:queue` - subscribe รับ updates
- `unsubscribe:queue` - unsubscribe

### WebSocket Client Example

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5555/queue');

socket.emit('subscribe:queue');

socket.on('queue:created', (ticket) => {
  console.log('New ticket:', ticket);
});

socket.on('queue:called', (ticket) => {
  console.log('Queue called:', ticket.queueNumber);
});
```

## Default Users

หลังจาก seed ข้อมูลแล้ว จะมี users ตัวอย่าง:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | ADMIN |
| staff | staff123 | STAFF |
| chef | chef123 | CHEF |

## Project Structure

```
food-ordering-service/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
├── src/
│   ├── main.ts            # Entry point
│   ├── app.module.ts      # Root module
│   ├── prisma/            # Prisma service
│   ├── common/            # Guards, decorators
│   └── modules/
│       ├── auth/          # Authentication
│       ├── menu/          # Menu CRUD
│       ├── addons/        # Add-ons CRUD
│       ├── orders/        # Orders
│       ├── queue/         # Queue + WebSocket
│       ├── tables/        # Table management
│       ├── service-requests/
│       ├── members/       # Membership
│       └── dashboard/     # Analytics
├── docker-compose.yml
├── .env.example
└── package.json
```

## Scripts

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Database
npx prisma migrate dev    # Create migration
npx prisma db push        # Push schema changes
npx prisma db seed        # Seed data
npx prisma studio         # Open Prisma Studio

# Testing
npm run test
npm run test:e2e
```

## License

MIT
# food-ordering-service


### FOR RABBITMQ ###
rabbitmqctl add_user nathee nathee
rabbitmqctl set_permissions -p / nathee ".*" ".*" ".*"
rabbitmqctl set_user_tags nathee administrator

rabbitmqctl list_users
rabbitmqctl list_permissions -p /

### SETUP ###
docker build -t food-ordering-service:test .
