# Admin UI - Next.js Admin Panel

Modern, responsive admin panel for the AppImmo Admin & Moderation Service.

## Features

- 🔐 **Secure Authentication** - JWT-based login with role management
- 📊 **Dashboard** - Real-time overview of reports, actions, and audit logs
- 📝 **Reports Management** - View, filter, assign, and resolve reports
- 🛡️ **Moderation Tools** - Ban users, remove properties, issue warnings
- 📜 **Audit Trail** - Complete history of all admin actions
- 👥 **Admin Users** - Manage admin accounts and permissions
- 📥 **CSV Export** - Export reports and audit logs
- 🎨 **Modern UI** - Built with Tailwind CSS and Lucide icons
- ⚡ **Fast & Responsive** - Server-side rendering with Next.js 14

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **API Client**: Axios + React Query
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 20+
- Admin Service running on http://localhost:3010

### Installation

```bash
cd backend/admin-ui
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3010/admin
```

### Development

```bash
npm run dev
```

The app will be available at http://localhost:3011

### Production

```bash
npm run build
npm start
```

## Default Credentials

You'll need to create an admin user in the backend first:

```bash
# Using the backend API
POST http://localhost:3010/admin/users
{
  "email": "admin@example.com",
  "password": "YourSecurePassword123!",
  "name": "Admin User",
  "role": "superadmin"
}
```

## Project Structure

```
admin-ui/
├── app/
│   ├── dashboard/          # Protected dashboard pages
│   │   ├── page.tsx        # Dashboard home
│   │   ├── reports/        # Reports management
│   │   ├── moderation/     # Moderation actions
│   │   ├── audit/          # Audit logs
│   │   └── users/          # Admin users
│   ├── login/
│   │   └── page.tsx        # Login page
│   ├── layout.tsx          # Root layout
│   ├── providers.tsx       # React Query provider
│   └── globals.css         # Global styles
├── components/
│   ├── Sidebar.tsx         # Navigation sidebar
│   ├── TopBar.tsx          # Top navigation bar
│   └── LoginForm.tsx       # Login form component
├── lib/
│   ├── api.ts              # API client and endpoints
│   └── auth-store.ts       # Auth state management
├── public/
├── next.config.js
├── tailwind.config.js
└── package.json
```

## Features Detail

### Authentication
- JWT token storage in localStorage
- Auto-redirect on token expiration
- Role-based UI rendering
- Secure logout with token revocation

### Dashboard
- Real-time statistics
- Recent reports overview
- Recent moderation actions
- Quick action buttons

### Reports Management
- Filter by status and type
- Assign reports to admins
- Update report status
- View detailed report information
- CSV export

### Moderation Tools
- Ban/unban users
- Remove/restore properties
- Issue warnings
- View action history
- Link actions to reports

### Audit Logs
- Complete action history
- Filter by actor, action, resource
- Date range filtering
- CSV export

### Admin Users
- Create/edit/delete admin users
- Role management (moderator, admin, superadmin)
- Permission assignment
- Activity tracking

## API Integration

The UI communicates with the Admin Service backend:

```typescript
// Example API call
import { reportsApi } from '@/lib/api'

const { data } = await reportsApi.getAll({ 
  status: 'open', 
  page: 1, 
  limit: 20 
})
```

## Security

- All API calls include JWT bearer token
- 401 errors trigger automatic logout
- Role-based access control on frontend
- Input validation with Zod schemas
- Protected routes with auth middleware

## Deployment

### Docker

```bash
# Build image
docker build -t admin-ui:latest .

# Run container
docker run -p 3011:3011 \
  -e NEXT_PUBLIC_API_URL=http://your-api-url \
  admin-ui:latest
```

### Vercel

```bash
vercel deploy
```

Make sure to set `NEXT_PUBLIC_API_URL` in Vercel environment variables.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Support

For issues or questions, contact the development team.
