# Admin Service - Quick Fix & Start Guide

## Issues Fixed ✅

1. ✅ TypeScript compilation errors in app.module.ts (JWT expiresIn type)
2. ✅ Type errors in reports.service.ts (save() method, response.data)
3. ✅ Added .gitignore files for both projects
4. ✅ Created installation script

## Install Dependencies

The main issue is missing node_modules. Run this command:

```powershell
cd backend
.\install-admin-deps.ps1
```

This will install all dependencies for both admin-service and admin-ui.

## Manual Installation (if script fails)

### Backend
```powershell
cd backend\admin-service
npm install
```

### Frontend
```powershell
cd backend\admin-ui
npm install
```

## Start Services

### 1. Backend (Terminal 1)
```powershell
cd backend\admin-service
npm run start:dev
```

Backend will run on: http://localhost:3010

### 2. Frontend (Terminal 2)
```powershell
cd backend\admin-ui
npm run dev
```

Frontend will run on: http://localhost:3011

## Access

- **Admin UI**: http://localhost:3011
- **API**: http://localhost:3010
- **Swagger Docs**: http://localhost:3010/api/docs
- **Health Check**: http://localhost:3010/admin/health

## Default Login

After creating your first admin user:
- Email: `admin@example.com`
- Password: `Admin123456!`

## Troubleshooting

### Issue: Module not found errors
**Solution**: Run `npm install` in the respective folder

### Issue: MongoDB connection error
**Solution**: Update MONGO_URI in `admin-service/.env`

### Issue: CORS errors
**Solution**: Check CORS_ORIGINS in `admin-service/.env`

### Issue: Port already in use
**Solution**: 
- Change PORT in `admin-service/.env` (default 3010)
- Change port in `admin-ui/next.config.js` (default 3011)

## First Time Setup Checklist

- [ ] Install dependencies (run install-admin-deps.ps1)
- [ ] Copy `admin-service/.env.example` to `admin-service/.env`
- [ ] Update MongoDB URI in `.env`
- [ ] Copy `admin-ui/.env.example` to `admin-ui/.env.local`
- [ ] Start backend service
- [ ] Create first admin user (see ADMIN_SERVICE_SETUP.md)
- [ ] Start frontend
- [ ] Login and test

## What's Working Now

After running npm install, all TypeScript errors will be resolved and you can:

✅ Start the backend service
✅ Start the frontend application
✅ Access the admin panel
✅ Use all API endpoints
✅ View Swagger documentation
✅ Perform CRUD operations
✅ Export data to CSV

## Need Help?

Check these files:
- **Complete Setup**: ADMIN_SERVICE_SETUP.md
- **Implementation Summary**: ADMIN_SERVICE_COMPLETE.md
- **Backend Docs**: admin-service/README.md
- **Frontend Docs**: admin-ui/README.md
