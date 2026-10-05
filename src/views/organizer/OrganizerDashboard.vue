<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useEventsStore } from '@/stores/events'
import type { Event, Ticket } from '@/types'
import { motion } from 'motion-v'
import { Plus, Ticket as TicketIcon, Calendar, ShoppingBag } from 'lucide-vue-next'

const auth = useAuthStore()
const store = useEventsStore()
const orgId = computed(() => auth.user?.id || '')

const myEvents = computed(() => store.getEventsByOrganizer(orgId.value))
const myOrders = computed(() => store.getOrdersByOrganizer(orgId.value))

const showNewEvent = ref(false)
const newEvent = ref({
  title: '',
  description: '',
  date: '',
  location: '',
  image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&q=70&auto=format',
  category: 'Festival',
  videoUrl: ''
})

function createEvent() {
  if (!newEvent.value.title || !auth.user) return
  store.addEvent({
    title: newEvent.value.title,
    description: newEvent.value.description,
    date: newEvent.value.date || new Date().toISOString(),
    location: newEvent.value.location,
    image: newEvent.value.image,
    category: newEvent.value.category,
    videoUrl: newEvent.value.videoUrl || undefined,
    featured: false,
    organizerId: auth.user.id,
    organizerName: auth.user.organizationName || auth.user.name,
    organizerPhone: auth.user.phone || '+2250759128035',
    approvalStatus: 'pending'
  })
  showNewEvent.value = false
  newEvent.value = { title: '', description: '', date: '', location: '', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&q=70&auto=format', category: 'Festival', videoUrl: '' }
}

const ticketDraft = ref({ eventId: '', name: '', price: 3000, stock: 50 })
function addTicket() {
  if (!ticketDraft.value.eventId || !ticketDraft.value.name) return
  store.addTicket({
    eventId: ticketDraft.value.eventId,
    name: ticketDraft.value.name,
    price: Number(ticketDraft.value.price),
    stock: Number(ticketDraft.value.stock),
    maxPerOrder: 4,
    status: 'available'
  })
  ticketDraft.value = { eventId: '', name: '', price: 3000, stock: 50 }
}

function formatPrice(n: number) {
  return n.toLocaleString('fr-FR') + ' XOF'
}
</script>

<template>
  <div class="min-h-screen page-pad pb-24 md:pb-10">
    <motion.div :initial="{ opacity: 0, y: 16 }" :animate="{ opacity: 1, y: 0 }">
      <h1 class="text-2xl sm:text-3xl font-bold mb-1" style="font-family: var(--font-space)">
        Espace <span class="gold-gradient">Organisateur</span>
      </h1>
      <p class="text-[var(--text-secondary)] mb-8">
        {{ auth.user?.organizationName || auth.user?.name }} · Publie tes événements et suis tes ventes
      </p>

      <div class="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-10">
        <div class="glass rounded-2xl p-5" data-reveal="up" data-reveal-stagger="70">
          <Calendar class="text-[var(--accent)] mb-2" :size="20" />
          <p class="text-2xl font-bold">{{ myEvents.length }}</p>
          <p class="text-sm text-[var(--text-secondary)]">Événements</p>
        </div>
        <div class="glass rounded-2xl p-5" data-reveal="up" data-reveal-stagger="70">
          <ShoppingBag class="text-[var(--accent)] mb-2" :size="20" />
          <p class="text-2xl font-bold">{{ myOrders.length }}</p>
          <p class="text-sm text-[var(--text-secondary)]">Commandes</p>
        </div>
        <div class="glass rounded-2xl p-5" data-reveal="up" data-reveal-stagger="70">
          <TicketIcon class="text-[var(--accent)] mb-2" :size="20" />
          <p class="text-2xl font-bold">{{ myOrders.filter(o => o.format === 'digital').length }}</p>
          <p class="text-sm text-[var(--text-secondary)]">Tickets numériques</p>
        </div>
      </div>

      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Mes événements</h2>
        <button class="btn-gold px-4 py-2 rounded-xl text-sm flex items-center gap-2" @click="showNewEvent = true">
          <Plus :size="16" /> Nouvel événement
        </button>
      </div>

      <div class="space-y-4 mb-10">
        <div v-for="e in myEvents" :key="e.id" class="glass rounded-2xl p-5" data-reveal="up" data-reveal-stagger="70">
          <div class="flex flex-wrap justify-between gap-2">
            <div>
              <h3 class="font-semibold text-lg">{{ e.title }}</h3>
              <p class="text-sm text-[var(--text-secondary)]">{{ e.location }} · {{ new Date(e.date).toLocaleDateString('fr-FR') }}</p>
            </div>
            <span
              class="px-2.5 py-1 rounded-full text-xs h-fit"
              :class="{
                'bg-yellow-500/20 text-yellow-400': e.approvalStatus === 'pending',
                'bg-green-500/20 text-green-400': e.approvalStatus === 'approved',
                'bg-red-500/20 text-red-400': e.approvalStatus === 'rejected'
              }"
            >
              {{ e.approvalStatus || 'approved' }}
            </span>
          </div>
          <p class="text-xs text-[var(--text-secondary)] mt-2">
            Tickets liés : {{ store.getTicketsForEvent(e.id).length }}
          </p>
        </div>
        <p v-if="!myEvents.length" class="text-[var(--text-secondary)] text-sm">Aucun événement pour le moment.</p>
      </div>

      <!-- Add ticket -->
      <h2 class="text-xl font-semibold mb-4">Ajouter un ticket</h2>
      <div class="glass rounded-2xl p-5 mb-10 grid md:grid-cols-4 gap-3">
        <select v-model="ticketDraft.eventId" class="px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
          <option value="">Événement</option>
          <option v-for="e in myEvents" :key="e.id" :value="e.id">{{ e.title }}</option>
        </select>
        <input v-model="ticketDraft.name" placeholder="Nom du ticket" class="px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" />
        <input v-model.number="ticketDraft.price" type="number" placeholder="Prix XOF" class="px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" />
        <button class="btn-gold rounded-xl py-2" @click="addTicket">Ajouter</button>
      </div>

      <h2 class="text-xl font-semibold mb-4">Commandes reçues</h2>
      <div class="space-y-3">
        <div v-for="o in myOrders" :key="o.id" class="glass rounded-xl p-4 flex flex-wrap justify-between gap-2 text-sm">
          <div>
            <p class="font-mono text-[var(--accent)]">{{ o.code }}</p>
            <p>{{ o.userName }} · {{ o.userPhone }}</p>
            <p class="text-[var(--text-secondary)]">{{ o.format === 'digital' ? 'Numérique' : 'Physique' }} · {{ o.status }}</p>
          </div>
          <p class="font-semibold">{{ formatPrice(o.total) }}</p>
        </div>
        <p v-if="!myOrders.length" class="text-[var(--text-secondary)] text-sm">Aucune commande.</p>
      </div>
    </motion.div>

    <!-- New event modal -->
    <div v-if="showNewEvent" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div class="w-full max-w-lg glass rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold mb-4">Nouvel événement</h3>
        <p class="text-xs text-[var(--text-secondary)] mb-4">Soumis pour validation admin avant publication.</p>
        <div class="space-y-3">
          <input v-model="newEvent.title" placeholder="Titre" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" />
          <textarea v-model="newEvent.description" rows="2" placeholder="Description" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" />
          <input v-model="newEvent.date" type="datetime-local" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" />
          <input v-model="newEvent.location" placeholder="Lieu" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" />
          <input v-model="newEvent.image" placeholder="URL image" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" />
          <input v-model="newEvent.videoUrl" placeholder="URL vidéo embed (optionnel)" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" />
          <input v-model="newEvent.category" placeholder="Catégorie" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" />
        </div>
        <div class="flex gap-2 mt-6">
          <button class="btn-gold flex-1 py-2 rounded-xl" @click="createEvent">Soumettre</button>
          <button class="btn-outline-gold px-4 py-2 rounded-xl" @click="showNewEvent = false">Annuler</button>
        </div>
      </div>
    </div>
  </div>
</template>
