# Admin & Moderation Microservice

A comprehensive admin panel and moderation system for the real estate platform built with NestJS, MongoDB, and Redis.

## 🏗️ Architecture

- **Backend**: NestJS + TypeScript
- **Database**: MongoDB (5 collections: reports, moderation_actions, audit_logs, admin_users, admin_sessions)
- **Cache**: Redis (event subscriptions, rate limiting)
- **Auth**: JWT + RBAC (3 roles: moderator, admin, superadmin)
- **API Gateway Integration**: Calls property/user services via internal API

## 📋 Features

### Core Capabilities
- ✅ **Report Management**: Create, assign, review, and resolve user reports
- ✅ **Moderation Actions**: Ban users, remove properties, warnings, restore content
- ✅ **Audit Logging**: Complete trail of all admin actions with before/after snapshots
- ✅ **Role-Based Access Control**: Fine-grained permissions (moderator/admin/superadmin)
- ✅ **CSV Export**: Stream large datasets without memory issues
- ✅ **Metrics**: Prometheus-compatible metrics endpoint
- ✅ **Health Checks**: Docker-compatible health monitoring

### Security Features
- JWT authentication with secure session management
- IP allow-listing for critical operations
- Rate limiting on all endpoints
- Audit trail for compliance
- Password hashing with bcrypt

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- MongoDB 7+
- Redis 7+
- Docker & Docker Compose (optional)

### Installation

```bash
# Install dependencies
cd backend/admin-service
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
# Important: Update MONGO_URI, JWT_SECRET, API_GATEWAY_URL

# Run in development
npm run start:dev

# Run in production
npm run build
npm run start:prod
```

### Docker Deployment

```bash
# Build image
docker build -t admin-service:latest .

# Run with docker-compose
docker-compose up -d
```

## 📡 API Endpoints

### Authentication
```
POST   /admin/auth/login          # Admin login
POST   /admin/auth/logout         # Logout and revoke session
GET    /admin/auth/me             # Get current admin user
```

### Reports Management
```
GET    /admin/reports                    # List reports (with filters)
GET    /admin/reports/:id                # Get report details
POST   /admin/reports/:id/assign         # Assign report to moderator
POST   /admin/reports/:id/action         # Take moderation action
GET    /admin/reports/export?format=csv  # Export reports to CSV
```

### Moderation Actions
```
POST   /admin/actions/ban-user           # Ban a user
POST   /admin/actions/unban-user         # Unban a user
POST   /admin/actions/remove-property    # Remove a property
POST   /admin/actions/restore-property   # Restore a property
POST   /admin/actions/warning            # Issue warning
GET    /admin/actions                    # List all actions
```

### User Management
```
GET    /admin/users                   # Search users
GET    /admin/users/:id               # Get user details
POST   /admin/users/:id/role          # Change user role
GET    /admin/users/:id/activity      # Get user activity
```

### Audit & Logs
```
GET    /admin/audit                   # List audit logs
GET    /admin/audit/:id               # Get specific audit entry
GET    /admin/audit/export?format=csv # Export audit logs
```

### Health & Metrics
```
GET    /admin/health                  # Health check
GET    /admin/metrics                 # Prometheus metrics
```

## 🔐 Authentication

All admin endpoints require JWT authentication:

```bash
# Login
curl -X POST http://localhost:3010/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "your-password"}'

# Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "role": "admin",
    "name": "Admin User"
  }
}

# Use token in subsequent requests
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3010/admin/reports
```

## 👥 Roles & Permissions

### Moderator
- View reports
- Assign reports
- Issue warnings
- View audit logs (own actions only)

### Admin
- All moderator permissions
- Ban/unban users
- Remove/restore properties
- View all audit logs
- Export data

### Superadmin
- All admin permissions
- Manage admin users
- Change roles
- System configuration

## 📊 Database Collections

### reports
```typescript
{
  reporterId: ObjectId,
  targetType: "property" | "user" | "message",
  targetId: ObjectId,
  reason: string,
  description: string,
  status: "open" | "in_review" | "resolved" | "invalid",
  assignedTo: ObjectId | null,
  targetSnapshot: {},
  mediaUrls: string[],
  createdAt: Date,
  updatedAt: Date
}
```

### moderation_actions
```typescript
{
  actionType: "remove_property" | "ban_user" | "warning" | "restore_property",
  performedBy: ObjectId,
  targetType: "property" | "user" | "message",
  targetId: ObjectId,
  reason: string,
  metadata: {},
  durationDays: number | null,
  expiresAt: Date | null,
  createdAt: Date
}
```

### audit_logs
```typescript
{
  actorId: ObjectId,
  action: string,
  resource: { type: string, id: string },
  before: {},
  after: {},
  ip: string,
  userAgent: string,
  metadata: {},
  createdAt: Date
}
```

### admin_users
```typescript
{
  email: string,
  passwordHash: string,
  role: "moderator" | "admin" | "superadmin",
  name: string,
  isActive: boolean,
  lastLoginAt: Date,
  permissions: string[],
  createdAt: Date
}
```

## 🔗 Integration with Other Services

The admin service integrates with other microservices through the API Gateway:

### Remove Property
```typescript
// Calls: DELETE /api/v1/properties/:id
await this.httpService.delete(
  `${this.apiGatewayUrl}/properties/${propertyId}`,
  { headers: { 'X-Internal-Key': this.internalKey } }
);
```

### Ban User
```typescript
// Calls: POST /api/v1/users/:id/ban
await this.httpService.post(
  `${this.apiGatewayUrl}/users/${userId}/ban`,
  { durationDays, reason },
  { headers: { 'X-Internal-Key': this.internalKey } }
);
```

## 📦 CSV Export

Stream large datasets efficiently:

```bash
# Export all open reports
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3010/admin/reports/export?status=open&format=csv" \
  -o reports.csv

# Export audit logs for date range
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3010/admin/audit/export?from=2025-01-01&to=2025-12-31&format=csv" \
  -o audit_logs.csv
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 📈 Monitoring

### Prometheus Metrics

Available at `GET /admin/metrics`:

```
# Reports
admin_reports_open_total
admin_reports_resolved_total
admin_reports_by_type

# Moderation
admin_moderation_actions_total
admin_action_latency_seconds

# System
admin_api_requests_total
admin_api_errors_total
```

### Alerts

Recommended alerts:
- Spike in reports (> 100/hour)
- High action failure rate (> 5%)
- Repeated actions by same admin (possible compromise)
- Slow query performance (> 1s)

## 🔒 Security Best Practices

1. **JWT Secret**: Use strong, random secret (min 32 chars)
2. **Password Policy**: Enforce strong passwords for admin users
3. **IP Allow-listing**: Restrict access to known IPs for production
4. **Rate Limiting**: Default 100 requests/minute per IP
5. **Audit Everything**: All actions logged with before/after snapshots
6. **Session Management**: Auto-expire sessions after 24h
7. **HTTPS Only**: Always use TLS in production

## 🛠️ Development

### Project Structure
```
admin-service/
├── src/
│   ├── config/           # Configuration
│   ├── common/           # Guards, interceptors, decorators
│   ├── schemas/          # MongoDB schemas
│   ├── modules/
│   │   ├── reports/      # Report management
│   │   ├── moderation/   # Moderation actions
│   │   ├── audit/        # Audit logging
│   │   └── admin-users/  # Admin user management
│   ├── app.module.ts
│   └── main.ts
├── test/                 # E2E tests
├── Dockerfile
├── docker-compose.yml
└── package.json
```

### Creating a New Admin User

```typescript
// Use the seed script or API
POST /admin/users
{
  "email": "newadmin@example.com",
  "password": "SecurePassword123!",
  "name": "New Admin",
  "role": "moderator"
}
```

## 📝 Example Workflows

### Workflow 1: Handle Report
```bash
# 1. Get open reports
GET /admin/reports?status=open

# 2. View report details
GET /admin/reports/:reportId

# 3. Assign to yourself
POST /admin/reports/:reportId/assign
{ "assignedTo": "myAdminUserId" }

# 4. Take action
POST /admin/reports/:reportId/action
{
  "actionType": "remove_property",
  "reason": "Violated community guidelines"
}
```

### Workflow 2: Ban User
```bash
# 1. Search user
GET /admin/users?query=suspicious@user.com

# 2. Ban user
POST /admin/actions/ban-user
{
  "userId": "USER_ID",
  "durationDays": 30,
  "reason": "Spam activity detected"
}

# 3. Verify audit log
GET /admin/audit?action=ban_user&targetId=USER_ID
```

## 🚧 Roadmap

- [ ] Admin UI (Next.js React app)
- [ ] Two-factor authentication (2FA)
- [ ] Advanced search with Elasticsearch
- [ ] Automated moderation with AI
- [ ] Webhook notifications
- [ ] Multi-language support
- [ ] Mobile admin app

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

For issues or questions:
- GitHub Issues: [link]
- Email: admin@example.com
- Slack: #admin-service

---

Built with ❤️ for secure and scalable moderation
