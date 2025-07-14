/**
 * Vue Router Configuration
 * Defines all application routes with authentication guards
 */

import { createRouter, createWebHistory } from 'vue-router'
import { metaGuard } from './guards'

// Import views
import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import EmailVerificationView from '@/views/auth/EmailVerificationView.vue'
import EmailVerificationSuccessView from '@/views/auth/EmailVerificationSuccessView.vue'
import CheckEmailView from '@/views/auth/CheckEmailView.vue'
import DashboardView from '@/views/DashboardView.vue'
import TasksView from '@/views/tasks/TasksView.vue'
import TaskDetailView from '@/views/tasks/TaskDetailView.vue'
import GanttChartView from '@/views/tasks/GanttChartView.vue'
import UsersView from '@/views/users/UsersView.vue'
import UserDetailView from '@/views/users/UserDetailView.vue'
import ProfileView from '@/views/ProfileView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

const routes = [
  // Authentication routes
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      requiresGuest: true,
      title: 'Login'
    }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: {
      requiresGuest: true,
      title: 'Register'
    }
  },
  {
    path: '/verify-email',
    name: 'verify-email',
    component: EmailVerificationView,
    meta: {
      title: 'Verify Email'
    }
  },
  {
    path: '/email-verified',
    name: 'email-verified',
    component: EmailVerificationSuccessView,
    meta: {
      title: 'Email Verified'
    }
  },
  {
    path: '/check-email',
    name: 'check-email',
    component: CheckEmailView,
    meta: {
      title: 'Check Your Email'
    }
  },

  // Protected routes
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: {
      requiresAuth: true,
      title: 'Dashboard'
    }
  },
  {
    path: '/tasks',
    name: 'tasks',
    component: TasksView,
    meta: {
      requiresAuth: true,
      permission: 'tasks.view',
      title: 'Tasks'
    }
  },
  {
    path: '/tasks/create',
    name: 'task-create',
    component: () => import('@/views/tasks/TaskCreateView.vue'),
    meta: {
      requiresAuth: true,
      permission: 'tasks.create',
      title: 'Create Task'
    }
  },
  {
    path: '/tasks/:id',
    name: 'task-detail',
    component: TaskDetailView,
    meta: {
      requiresAuth: true,
      permission: 'tasks.view',
      title: 'Task Details'
    }
  },
  {
    path: '/tasks/:id/edit',
    name: 'task-edit',
    component: () => import('@/views/tasks/TaskEditView.vue'),
    meta: {
      requiresAuth: true,
      permission: 'tasks.edit',
      title: 'Edit Task'
    }
  },
  {
    path: '/gantt',
    name: 'gantt-chart',
    component: GanttChartView,
    meta: {
      requiresAuth: true,
      permission: 'tasks.view',
      title: 'Gantt Chart'
    }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: {
      requiresAuth: true,
      title: 'Profile'
    }
  },

  // Admin only routes
  {
    path: '/users',
    name: 'users',
    component: UsersView,
    meta: {
      requiresAuth: true,
      permission: 'users.list',
      title: 'User Management'
    }
  },
  {
    path: '/users/create',
    name: 'user-create',
    component: () => import('@/views/users/UserCreateView.vue'),
    meta: {
      requiresAuth: true,
      permission: 'users.create',
      title: 'Create User'
    }
  },
  {
    path: '/users/:id',
    name: 'user-detail',
    component: UserDetailView,
    meta: {
      requiresAuth: true,
      permission: 'users.view',
      title: 'User Details'
    }
  },
  {
    path: '/users/:id/edit',
    name: 'user-edit',
    component: () => import('@/views/users/UserEditView.vue'),
    meta: {
      requiresAuth: true,
      permission: 'users.edit',
      title: 'Edit User'
    }
  },

  // Unauthorized page
  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: () => import('@/views/UnauthorizedView.vue'),
    meta: {
      title: 'Unauthorized'
    }
  },

  // Catch all route - must be last
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: {
      title: 'Page Not Found'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_, __, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Global navigation guards
router.beforeEach(async (to, from, next) => {
  // Update document title
  document.title = to.meta.title ? `${to.meta.title} - Task Management` : 'Task Management'

  // Use the meta-based guard for comprehensive permission checking
  await metaGuard(to, from, next)
})

export default router
