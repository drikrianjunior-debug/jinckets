<script setup lang="ts">
import { computed } from 'vue'
import { useEventsStore } from '@/stores/events'
import { useAuthStore } from '@/stores/auth'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { motion } from 'motion-v'
import { Ticket, ShoppingBag, Users, TrendingUp } from 'lucide-vue-next'

ChartJS.register(ArcElement, Tooltip, Legend)

const store = useEventsStore()
const auth = useAuthStore()

const stats = computed(() => store.orderStats)
const totalOrders = computed(() => Object.values(stats.value).reduce((a, b) => a + b, 0))
const totalTickets = computed(() => store.tickets.length)
const totalEvents = computed(() => store.events.length)
const pendingCount = computed(() => store.pendingEvents.length)
const totalRevenue = computed(() =>
  store.orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)
)
const digitalCount = computed(() => store.orders.filter(o => o.format === 'digital').length)
const physicalCount = computed(() => store.orders.filter(o => o.format === 'physical').length)

const chartData = computed(() => ({
  labels: ['En attente', 'Payées / confirmées', 'Livrées', 'Annulées'],
  datasets: [{
    data: [
      stats.value.pending || 0,
      (stats.value.confirmed || 0) + (stats.value.paid || 0),
      stats.value.delivered || 0,
      stats.value.cancelled || 0
    ],
    backgroundColor: ['#f59e0b', '#22c55e', '#3b82f6', '#ef4444'],
    borderWidth: 0,
    hoverOffset: 8
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { color: '#b8b0d0', padding: 16, font: { size: 12 } }
    }
  }
}
</script>

<template>
  <div class="min-h-screen page-pad pb-24 md:pb-10">
    <motion.div :initial="{ opacity: 0, y: 20 }" :animate="{ opacity: 1, y: 0 }">
      <h1 class="text-3xl font-bold mb-1" style="font-family: var(--font-space)">
        Dashboard <span class="gold-gradient">Admin</span>
      </h1>
      <p class="text-[var(--text-secondary)] mb-10">Bienvenue {{ auth.user?.name }}</p>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
        <motion.div
          v-for="(kpi, i) in [
            { label: 'Commandes', value: totalOrders, icon: ShoppingBag, color: 'text-blue-400' },
            { label: 'Tickets types', value: totalTickets, icon: Ticket, color: 'text-[var(--accent)]' },
            { label: 'Événements', value: totalEvents, icon: TrendingUp, color: 'text-purple-400' },
            { label: 'Revenus', value: totalRevenue.toLocaleString('fr-FR') + ' XOF', icon: Users, color: 'text-green-400' }
          ]"
          :key="kpi.label"
          class="glass rounded-2xl p-3 sm:p-5" data-reveal="up" data-reveal-stagger="70"
          :initial="{ opacity: 0, y: 15 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ delay: i * 0.08 }"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm text-[var(--text-secondary)]">{{ kpi.label }}</span>
            <component :is="kpi.icon" :size="18" :class="kpi.color" />
          </div>
          <p class="kpi-value font-bold">{{ kpi.value }}</p>
        </motion.div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <div class="glass rounded-xl p-4 text-sm">
          <span class="text-[var(--text-secondary)]">Numériques</span>
          <p class="text-xl font-bold text-[var(--accent)]">{{ digitalCount }}</p>
        </div>
        <div class="glass rounded-xl p-4 text-sm">
          <span class="text-[var(--text-secondary)]">Physiques</span>
          <p class="text-xl font-bold">{{ physicalCount }}</p>
        </div>
        <div class="glass rounded-xl p-4 text-sm">
          <span class="text-[var(--text-secondary)]">Événements à valider</span>
          <p class="text-xl font-bold text-yellow-400">{{ pendingCount }}</p>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-6">
        <div class="glass rounded-2xl p-6" data-reveal="left">
          <h2 class="text-lg font-semibold mb-4">Statuts des commandes</h2>
          <div class="h-64">
            <Doughnut :data="chartData" :options="chartOptions" />
          </div>
        </div>

        <div class="glass rounded-2xl p-6" data-reveal="right">
          <h2 class="text-lg font-semibold mb-4">Accès rapide</h2>
          <div class="space-y-3">
            <router-link
              v-for="link in [
                { to: '/admin/organizers', label: 'Organisateurs & validations', desc: 'Approuver événements, liste annonciateurs' },
                { to: '/admin/tickets', label: 'Tickets & stocks', desc: 'Éditer, ajouter, vidéo' },
                { to: '/admin/orders', label: 'Commandes', desc: 'Numérique / physique, PDF, QR' },
                { to: '/admin/clients', label: 'Clients', desc: 'Utilisateurs inscrits' }
              ]"
              :key="link.to"
              :to="link.to"
              class="block p-4 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
            >
              <p class="font-medium">{{ link.label }}</p>
              <p class="text-sm text-[var(--text-secondary)]">{{ link.desc }}</p>
            </router-link>
          </div>
        </div>
      </div>
    </motion.div>
  </div>
</template>
