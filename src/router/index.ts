import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('@/views/Landing.vue'),
      meta: { public: true }
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/views/Auth.vue'),
      meta: { public: true, guestOnly: true }
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/ForgotPassword.vue'),
      meta: { public: true }
    },
    {
      path: '/become-organizer',
      name: 'become-organizer',
      component: () => import('@/views/BecomeOrganizer.vue'),
      meta: { public: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/Profile.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/events',
      name: 'events',
      component: () => import('@/views/EventCatalog.vue')
    },
    {
      path: '/events/:id',
      name: 'event-tickets',
      component: () => import('@/views/EventTickets.vue'),
      props: true
    },
    {
      path: '/client',
      name: 'client-dashboard',
      component: () => import('@/views/ClientDashboard.vue'),
      meta: { requiresAuth: true, role: 'client' }
    },
    {
      path: '/organizer',
      name: 'organizer-dashboard',
      component: () => import('@/views/organizer/OrganizerDashboard.vue'),
      meta: { requiresAuth: true, role: 'organizer' }
    },
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: () => import('@/views/admin/AdminDashboard.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/admin/tickets',
      name: 'admin-tickets',
      component: () => import('@/views/admin/TicketsManager.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/admin/orders',
      name: 'admin-orders',
      component: () => import('@/views/admin/OrdersManager.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/admin/clients',
      name: 'admin-clients',
      component: () => import('@/views/admin/ClientsManager.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/admin/organizers',
      name: 'admin-organizers',
      component: () => import('@/views/admin/OrganizersManager.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  if (auth.user) auth.ensureSession()
  const role = auth.effectiveRole || auth.user?.role
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next({ name: 'auth', query: { redirect: to.fullPath } })
  } else if (to.meta.guestOnly && auth.isAuthenticated) {
    next(auth.homeForRole(auth.user?.role))
  } else if (to.meta.role && role !== to.meta.role) {
    // Organisateur en attente peut accéder à /organizer
    if (to.meta.role === 'organizer' && auth.user?.organizerStatus === 'pending') {
      next()
    } else if (to.meta.role === 'client' && auth.user?.organizerStatus === 'approved') {
      // Autoriser l'accès client si mode client (effectiveRole)
      if (role === 'client') next()
      else next(auth.homeForRole(auth.user?.role))
    } else {
      next(auth.homeForRole(auth.user?.role))
    }
  } else {
    next()
  }
})

export default router
