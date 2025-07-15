# Task Management System

A full-stack, enterprise-grade task management application featuring a Vue.js frontend, an Express.js backend, and a PostgreSQL database. It includes a robust Role-Based Access Control (RBAC) system, JWT authentication, and a comprehensive API.

## Features

### Core Functionality
- **User Roles**: Three distinct user roles: **Admin**, **Manager**, and **User**.
- **Role-Based Permissions**: Granular access control for all operations, ensuring users only see and do what they are permitted to.
- **Task Management**: Full CRUD operations for tasks, including creation, assignment, status updates, and tracking with deadlines and priorities.
- **User Management**: Admins can manage the entire user lifecycle (CRUD).
- **Email Notifications**: Automatic notifications for task assignments and other events (future implementation).

### Technical Features
- **Modern Tech Stack**: Vue.js 3 (Composition API) frontend and a Node.js/Express.js backend.
- **Secure Authentication**: Full JWT authentication flow with access and refresh tokens, secure password hashing (bcrypt), and token blacklisting for secure logout.
- **Database**: PostgreSQL for robust and reliable data storage. Includes scripts for easy database initialization, seeding, and resetting.
- **Comprehensive API**: A well-documented RESTful API with endpoints for users, tasks, and authentication.
- **Security-Focused**: Implements security best practices including Helmet for security headers, CORS, rate limiting, input validation with Joi, and prevention against SQL injection.
- **Developer Friendly**: Comes with mock authentication for easy API testing, detailed documentation, and a clean project structure.

## Tech Stack

**Frontend:**
- **Framework**: Vue.js 3 with Composition API
- **Routing**: Vue Router
- **State Management**: Pinia
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Styling**: Tailwind CSS

**Backend:**
- **Framework**: Node.js with Express.js
- **Database**: PostgreSQL on NeonDb
- **Authentication**: JSON Web Tokens (JWT)
- **Emailing**: Nodemailer
- **Validation**: Joi
- **Security**: Helmet, CORS, bcrypt

## Architecture

The project is a monorepo with two main parts: `frontend` and `backend`.


## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm (comes with Node.js)

### Installation & Setup

1.  **Clone the repository**

2.  **Install all dependencies** for both frontend and backend:
    ```bash
    npm run install:all
    ```

3.  **Set up Backend Environment Variables**:
    ```bash
    cd backend
    cp .env.example .env
    ```
    Now, edit `backend/.env` with your PostgreSQL database credentials and a JWT secret.

4.  **Set up Frontend Environment Variables**:
    ```bash
    cd frontend
    cp .env.example .env.local
    ```
    The default `VITE_API_BASE_URL` should point to your backend server (default: `http://localhost:3000/api`).

5.  **Setup Database**:
    Make sure your PostgreSQL server is running. Then, create the database:
    ```bash
    # In psql or your favorite DB tool
    createdb task_management_db
    ```
    Then, initialize the schema and seed it with sample data:
    ```bash
    # From the backend directory
    cd backend
    npm run db:reset
    ```

### Running the Application

You can start both frontend and backend servers concurrently from the root directory:
```bash
# Start both frontend (port 5173) and backend (port 3000)
npm run dev:all
```

Alternatively, you can start them individually in separate terminals:
```bash
# From /frontend directory
npm run dev

# From /backend directory
npm run dev
```

Once running, you can access the application at `http://localhost:5173`.

## API

The backend provides a comprehensive RESTful API for managing users and tasks.

- **Base URL**: `/api`
- **Authentication**: `Bearer <accessToken>` in the `Authorization` header.

### Key Endpoints

**Authentication**
- `POST /auth/login`: Authenticate and get tokens.
- `POST /auth/register`: Register a new user.
- `POST /auth/refresh`: Refresh an expired access token.
- `POST /auth/logout`: Log out and invalidate token.
- `GET /auth/me`: Get current authenticated user's info.

**User Management (Admin only)**
- `GET /users`: Get all users.
- `POST /users`: Create a user.
- `GET /users/:id`: Get a single user.
- `PATCH /users/:id`: Update a user.
- `DELETE /users/:id`: Delete a user.

**Task Management**
- `GET /tasks`: Get tasks (results depend on user role).
- `POST /tasks`: Create a task (Manager/Admin).
- `GET /tasks/:id`: Get a single task.
- `PATCH /tasks/:id`: Update a task.
- `DELETE /tasks/:id`: Delete a task (Manager/Admin).
- `PATCH /tasks/:id/status`: Update a task's status.

For detailed information on all endpoints, request/response schemas, and examples, please refer to the documentation in the `/docs` directory, especially `docs/backend-api-reference.md` and `docs/API_TESTING.md`.

## Role-Based Access Control (RBAC)

The application enforces a strict permission system based on user roles.

-   **Admin**:
    -   ✅ Full access to all users and tasks.
    -   ✅ Can create, read, update, and delete any resource.
-   **Manager**:
    -   ✅ Can create and manage tasks.
    -   ✅ Can view tasks they created or are assigned to.
    -   ✅ Can assign/unassign tasks they created.
    -   ✅ Can view all users.
-   **User**:
    -   ✅ Can view tasks assigned to them.
    -   ✅ Can update the status of their assigned tasks.
    -   ❌ Cannot create, delete, or assign tasks.

## Database

The PostgreSQL database schema is designed to be robust and scalable.

### Main Tables
- `users`: Stores user information, credentials, and roles.
- `tasks`: Stores task details, including status, priority, and deadlines.
- `roles`: Defines the available user roles.
- `task_assigned_users`: A join table for many-to-many task assignments.
- `refresh_tokens`: Stores active refresh tokens for JWT authentication.
- `token_blacklist`: Stores invalidated JWTs upon logout.

### Database Management Scripts
The backend includes helpful npm scripts for managing the database:
```bash
# From the /backend directory

# Check connection and schema status
npm run db:status

# Drop all tables, re-initialize schema, and seed with sample data
npm run db:reset

# Initialize schema without seeding
npm run db:init

# Seed the database with sample data
npm run db:seed
```

## Testing

The application is designed to be testable. The `/docs/API_TESTING.md` file provides comprehensive instructions and `curl` examples for testing every API endpoint and user workflow.

### Quick Health Check
You can quickly check if the backend server and database are running correctly:
```bash
curl http://localhost:3000/health
```

### Sample Users for Testing
After seeding the database (`npm run db:reset`), you can use these sample users:
- **Admin**: `kimeudom02@gmail.com` / `pass1234`
- **Manager**: `manager@example.com` / `password123`
- **User**: `user@example.com` / `password123`

## License

This project is licensed under the MIT License.