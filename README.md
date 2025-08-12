# MSR Milk Center Management System

A comprehensive milk collection and management system built with React, Node.js, Express, and MongoDB.

## Features

- **User Management**: Create and manage milk suppliers
- **Milk Collection**: Record daily milk collections with fat percentage
- **Advance Management**: Track advance payments to suppliers
- **Fat Rate Configuration**: Configure rates based on fat percentage
- **Reports**: Generate detailed reports and summaries
- **Authentication**: Secure login system with role-based access
- **Helper System**: Limited access accounts for data entry
- **Responsive Design**: Works on desktop and mobile devices
- **Print Support**: Generate printable reports

## Tech Stack

### Frontend

- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Vite for build tooling

### Backend

- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- bcrypt for password hashing
- Rate limiting and security middleware

## Prerequisites

- **Node.js** (version 18 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn** package manager

## Quick Start

### 1. Clone and Setup

```bash
npm install

cd server
npm install
cd ..
```

### 2. Database Setup

Make sure MongoDB is running, then seed the database:

```bash
cd server
npm run seed
```

This creates:

- Default admin user (username: `admin`, password: `admin123`)
- Default fat rates configuration

### 3. Environment Configuration

**Frontend (`.env`):**

```env
VITE_API_URL=http://localhost:5000/api
```

**Backend (`server/.env`):**

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/msr-milk-center
JWT_SECRET=msr-milk-center-super-secret-jwt-key-change-this-in-production-2024
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### 4. Start the Application

#### Start Both Frontend and Backend Together

```bash
npm run start:full
```

#### Start Separately

**Backend:**

```bash
cd server
npm run dev
```

**Frontend:**

```bash
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **API Health Check**: http://localhost:5000/api/health

### 6. Login

Default credentials:

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Important**: Change the default admin password after first login!

## Available Scripts

**Frontend:**

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

**Backend:**

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run seed` - Seed database with default data

**Combined:**

- `npm run start:full` - Start both frontend and backend
- `npm run start:server` - Start only backend from root

## Project Structure

```
milk-center/
├── public/                 # Static assets
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── utils/             # Utility functions and API service
│   ├── types/             # TypeScript type definitions
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   └── main.tsx           # Application entry point
├── server/                # Backend source code
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   ├── config/        # Configuration files
│   │   ├── scripts/       # Utility scripts
│   │   └── server.js      # Server entry point
│   ├── .env               # Environment variables
│   └── package.json       # Backend dependencies
├── .env                   # Frontend environment variables
├── package.json           # Frontend dependencies
└── README.md             # This file
```

## API Documentation

### Authentication

- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/register` - Register new user (admin only)

### Users

- `GET /api/users` - Get all users (with pagination)
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/:id/stats` - Get user statistics
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Collections

- `GET /api/collections` - Get milk collections (with filters)
- `GET /api/collections/summary` - Get collections summary
- `GET /api/collections/:id` - Get collection by ID
- `POST /api/collections` - Create new collection
- `PUT /api/collections/:id` - Update collection
- `DELETE /api/collections/:id` - Delete collection

### Advances

- `GET /api/advances` - Get advance payments (with filters)
- `GET /api/advances/summary` - Get advances summary
- `GET /api/advances/:id` - Get advance by ID
- `POST /api/advances` - Create new advance
- `PUT /api/advances/:id` - Update advance
- `DELETE /api/advances/:id` - Delete advance

### Fat Rates

- `GET /api/fat-rates` - Get all fat rates
- `GET /api/fat-rates/:id` - Get fat rate by ID
- `POST /api/fat-rates` - Create fat rate (admin only)
- `PUT /api/fat-rates/:id` - Update fat rate (admin only)
- `PUT /api/fat-rates/bulk` - Bulk update fat rates (admin only)
- `DELETE /api/fat-rates/:id` - Delete fat rate (admin only)

### Helpers

- `GET /api/helpers` - Get all helpers (admin only)
- `GET /api/helpers/:id` - Get helper by ID (admin only)
- `POST /api/helpers` - Create new helper (admin only)
- `PUT /api/helpers/:id` - Update helper (admin only)
- `DELETE /api/helpers/:id` - Delete helper (admin only)

### Health Check

- `GET /api/health` - Server health check

## User Roles

### Admin

- Full access to all features
- User and helper management
- Fat rate configuration
- System administration

### User

- Milk collection management
- View reports and statistics
- Advance management
- User profile management

### Helper

- Limited access for data entry
- Can create milk collections only
- Cannot modify or delete existing records
- Password expires after set period

## Features Overview

### User Management

- Add, edit, and delete milk suppliers
- Track contact information and addresses
- View user statistics and summaries
- User activation/deactivation

### Milk Collection

- Record daily milk collections
- Automatic rate calculation based on fat percentage
- Manual amount override option
- Time-based filtering (AM/PM sessions)
- Edit and update existing records (admin/user only)

### Advance Management

- Track advance payments to suppliers
- Categorize advances with descriptions
- View advance history and summaries
- Support for both advances and repayments

### Fat Rate Configuration

- Configure rates for different fat percentages
- Bulk update capabilities
- Admin-only access for rate management

### Helper System

- Create temporary access accounts
- Password expiration management
- Limited permissions for data entry
- Account activation/deactivation

### Reports and Analytics

- Detailed user reports with collection history
- Summary statistics and totals
- Printable reports with professional formatting
- Date range filtering and sorting

### Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (admin/user/helper)
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS protection
- Helmet.js security headers

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**

   - Ensure MongoDB is running
   - Check the connection string in `server/.env`

2. **Port Already in Use**

   - Change the port in `server/.env` if 5000 is occupied
   - Update the frontend `.env` file accordingly

3. **API Not Responding**

   - Verify both frontend and backend are running
   - Check the API URL in frontend `.env` file
   - Look for CORS errors in browser console

4. **Login Issues**
   - Ensure database is seeded: `cd server && npm run seed`
   - Use correct credentials: `admin` / `admin123`
   - Check browser network tab for API responses

### Database Reset

If you need to reset the database:

```bash
mongo msr-milk-center
db.dropDatabase()
exit

cd server
npm run seed
```

## Development Notes

- **Production Ready**: The entire codebase has been cleaned of all comments for production deployment
- **Authentication**: All routes require authentication except login
- **Security**: Admin-only routes are protected with additional middleware
- **Performance**: Database indexes are set up for optimal performance
- **Error Handling**: Comprehensive error handling and logging implemented
- **Modern Stack**: ES modules used throughout the backend, TypeScript for frontend type safety
- **Clean Code**: All inline comments and documentation comments have been removed from source files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
