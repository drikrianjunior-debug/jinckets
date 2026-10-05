<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { motion } from 'motion-v'
import {
  Home, Ticket, Calendar, LayoutDashboard, Users,
  ShoppingBag, LogOut, LogIn, PartyPopper, Megaphone, UserCircle, ArrowLeftRight
} from 'lucide-vue-next'
import ThemeToggle from './ThemeToggle.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isMobile = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})
onUnmounted(() => window.removeEventListener('resize', checkMobile))

const navItems = computed(() => {
  const base = [
    { to: '/', icon: Home, label: 'Accueil' },
    { to: '/events', icon: Calendar, label: 'Events' }
  ]
  const role = auth.effectiveRole
  if (auth.isAuthenticated) {
    if (role === 'admin') {
      base.push(
        { to: '/admin', icon: LayoutDashboard, label: 'Admin' },
        { to: '/admin/tickets', icon: Ticket, label: 'Tickets' },
        { to: '/admin/orders', icon: ShoppingBag, label: 'Cmd' },
        { to: '/admin/clients', icon: Users, label: 'Clients' },
        { to: '/admin/organizers', icon: Megaphone, label: 'Orgas' }
      )
    } else if (role === 'organizer') {
      base.push(
        { to: '/organizer', icon: Megaphone, label: 'Orga' },
        { to: '/profile', icon: UserCircle, label: 'Profil' }
      )
    } else {
      base.push(
        { to: '/client', icon: PartyPopper, label: 'Espace' },
        { to: '/profile', icon: UserCircle, label: 'Profil' }
      )
    }
  } else {
    base.push({ to: '/auth', icon: LogIn, label: 'Login' })
  }
  return base
})

function logout() {
  auth.logout()
  router.push('/')
}

function toggleMode() {
  if (!auth.canSwitchMode) return
  const next = auth.effectiveRole === 'organizer' ? 'client' : 'organizer'
  auth.switchMode(next)
  router.push(next === 'organizer' ? '/organizer' : '/client')
}

function isActive(to: string) {
  return route.path === to || (to !== '/' && route.path.startsWith(to))
}
</script>

<template>
  <!-- Desktop / tablet: sidebar gauche -->
  <motion.aside
    v-if="!isMobile"
    class="fixed left-0 top-0 h-full w-16 md:w-20 z-50 flex flex-col items-center py-5 gap-1.5"
    style="background: var(--bg-sidebar); border-right: 1px solid var(--border)"
    :initial="{ x: -80 }"
    :animate="{ x: 0 }"
    :transition="{ type: 'spring', stiffness: 200, damping: 20 }"
  >
    <router-link to="/" class="mb-3 group">
      <div
        class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm gold-gradient"
        style="font-family: var(--font-space); background: linear-gradient(135deg, rgba(201,162,39,0.15), rgba(45,27,78,0.3))"
      >
        J'cK
      </div>
    </router-link>

    <button
      v-if="auth.canSwitchMode"
      class="w-12 h-12 flex flex-col items-center justify-center rounded-xl text-[10px] text-[var(--accent)] hover:bg-[rgba(201,162,39,0.15)] gap-0.5"
      @click="toggleMode"
    >
      <ArrowLeftRight :size="16" />
      <span>{{ auth.effectiveRole === 'organizer' ? 'Client' : 'Orga' }}</span>
    </button>

    <nav class="flex-1 flex flex-col gap-1 w-full items-center overflow-y-auto py-1">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="relative group w-11 h-11 flex items-center justify-center rounded-xl shrink-0 nav-item-smooth"
        :class="isActive(item.to)
          ? 'bg-[var(--accent)] text-[var(--bg-primary)]'
          : 'text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[rgba(201,162,39,0.1)]'"
      >
        <component :is="item.icon" :size="18" />
        <span
          class="absolute left-14 px-2 py-1 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none glass z-50 hidden md:block"
          style="color: var(--text-primary)"
        >{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="flex flex-col gap-1 items-center mt-auto">
      <ThemeToggle />
      <button
        v-if="auth.isAuthenticated"
        class="w-11 h-11 flex items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-red-400"
        @click="logout"
      >
        <LogOut :size="18" />
      </button>
    </div>
  </motion.aside>

  <!-- Mobile: barre bas scrollable -->
  <nav
    v-else
    class="fixed bottom-0 inset-x-0 z-50 border-t"
    style="background: color-mix(in srgb, var(--bg-sidebar) 92%, transparent); border-color: var(--border); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px)"
  >
    <div
      class="flex items-stretch gap-0.5 px-1 pt-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))] overflow-x-auto no-scrollbar"
      style="scrollbar-width: none"
    >
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center justify-center shrink-0 min-w-[3.4rem] max-w-[4.5rem] py-1 px-1 rounded-lg text-[10px] gap-0.5 nav-item-smooth"
        :class="isActive(item.to) ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'"
      >
        <component :is="item.icon" :size="18" />
        <span class="truncate w-full text-center leading-tight">{{ item.label }}</span>
      </router-link>

      <button
        v-if="auth.canSwitchMode"
        class="flex flex-col items-center justify-center shrink-0 min-w-[3.4rem] py-1 px-1 text-[10px] text-[var(--accent)] gap-0.5"
        @click="toggleMode"
      >
        <ArrowLeftRight :size="16" />
        <span>{{ auth.effectiveRole === 'organizer' ? 'Client' : 'Orga' }}</span>
      </button>

      <div class="flex flex-col items-center justify-center shrink-0 min-w-[3.2rem] py-1">
        <ThemeToggle />
      </div>

      <button
        v-if="auth.isAuthenticated"
        class="flex flex-col items-center justify-center shrink-0 min-w-[3.2rem] py-1 text-[10px] text-[var(--text-secondary)] gap-0.5"
        @click="logout"
      >
        <LogOut :size="16" />
        <span>Out</span>
      </button>
    </div>
  </nav>
</template>
