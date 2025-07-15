# Task Management System

A full-stack task management application with role-based access control (RBAC).

## Features

- **Three User Roles**: Admin, Manager, User
- **Role-Based Permissions**: Granular access control for different operations
- **Task Management**: Create, assign, and track tasks with deadlines
- **Email Notifications**: Automatic notifications for task assignments
- **Modern Tech Stack**: Vue.js frontend + Express.js backend + PostgreSQL

```

## Quick Start

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Set up environment variables**:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database and email credentials
   ```

3. **Start development servers**:
   ```bash
   # Start both frontend and backend
   npm run dev:all

   # Or start individually
   npm run dev:frontend  # Vue.js dev server (port 5173)
   npm run dev:backend   # Express.js server (port 3000)
   ```


**Frontend:**
- Vue.js 3 with Composition API
- Vue Router for routing
- Pinia for state management
- Axios for HTTP requests
- Vite for build tooling

**Backend:**
- Node.js with Express.js
- PostgreSQL database
- JWT authentication
- Nodemailer for emails
- Joi for validation