<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEventsStore } from '@/stores/events'
import type { Ticket, Event } from '@/types'
import { motion } from 'motion-v'
import { Plus, Pencil, Trash2, Save, X, Video } from 'lucide-vue-next'

const store = useEventsStore()
const editingTicket = ref<Ticket | null>(null)
const editingEvent = ref<Event | null>(null)
const showNewTicket = ref(false)
const showNewEvent = ref(false)

const newTicket = ref<Partial<Ticket>>({
  name: '', price: 0, stock: 0, maxPerOrder: 4, status: 'available', eventId: ''
})
const newEvent = ref<Partial<Event>>({
  title: '', description: '', date: '', location: '', image: '', category: 'Festival', featured: false, videoUrl: ''
})

function startEditTicket(t: Ticket) {
  editingTicket.value = { ...t }
}
function saveTicket() {
  if (editingTicket.value) {
    store.updateTicket(editingTicket.value)
    editingTicket.value = null
  }
}
function createTicket() {
  if (!newTicket.value.name || !newTicket.value.eventId) return
  store.addTicket({
    eventId: newTicket.value.eventId!,
    name: newTicket.value.name!,
    description: newTicket.value.description,
    price: Number(newTicket.value.price) || 0,
    stock: Number(newTicket.value.stock) || 0,
    maxPerOrder: Number(newTicket.value.maxPerOrder) || 4,
    status: (newTicket.value.status as Ticket['status']) || 'available',
    benefits: newTicket.value.benefits
  })
  showNewTicket.value = false
  newTicket.value = { name: '', price: 0, stock: 0, maxPerOrder: 4, status: 'available', eventId: '' }
}
function startEditEvent(e: Event) {
  editingEvent.value = { ...e }
}
function saveEvent() {
  if (editingEvent.value) {
    store.updateEvent(editingEvent.value)
    editingEvent.value = null
  }
}
function createEvent() {
  if (!newEvent.value.title) return
  store.addEvent({
    title: newEvent.value.title!,
    subtitle: newEvent.value.subtitle,
    description: newEvent.value.description || '',
    date: newEvent.value.date || new Date().toISOString(),
    location: newEvent.value.location || '',
    image: newEvent.value.image || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    videoUrl: newEvent.value.videoUrl,
    category: newEvent.value.category || 'Festival',
    featured: !!newEvent.value.featured
  })
  showNewEvent.value = false
  newEvent.value = { title: '', description: '', date: '', location: '', image: '', category: 'Festival', featured: false }
}

const ticketsByEvent = computed(() => {
  const map: Record<string, Ticket[]> = {}
  store.tickets.forEach(t => {
    if (!map[t.eventId]) map[t.eventId] = []
    map[t.eventId].push(t)
  })
  return map
})
</script>

<template>
  <div class="min-h-screen page-pad pb-24 md:pb-10">
    <div class="flex flex-col sm:flex-row sm:flex-wrap sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
      <h1 class="text-3xl font-bold" style="font-family: var(--font-space)">Tickets & Événements</h1>
      <div class="flex flex-wrap gap-2">
        <button class="btn-outline-gold px-4 py-2 rounded-xl text-sm flex items-center gap-2" @click="showNewEvent = true">
          <Plus :size="16" /> Événement
        </button>
        <button class="btn-gold px-4 py-2 rounded-xl text-sm flex items-center gap-2" @click="showNewTicket = true">
          <Plus :size="16" /> Ticket
        </button>
      </div>
    </div>

    <!-- Events list with tickets -->
    <div class="space-y-8">
      <div v-for="event in store.events" :key="event.id" class="glass rounded-2xl p-6">
        <div class="flex flex-wrap justify-between items-start gap-4 mb-4">
          <div>
            <h2 class="text-xl font-semibold">{{ event.title }}</h2>
            <p class="text-sm text-[var(--text-secondary)]">{{ event.location }} · {{ new Date(event.date).toLocaleDateString('fr-FR') }}</p>
            <p v-if="event.organizerName" class="text-xs text-[var(--accent)] mt-0.5">Orga: {{ event.organizerName }} · {{ event.approvalStatus || 'approved' }}</p>
            <p v-if="event.videoUrl" class="text-xs text-[var(--accent)] flex items-center gap-1 mt-1">
              <Video :size="12" /> Vidéo de présentation
            </p>
          </div>
          <button class="p-2 rounded-lg hover:bg-[rgba(201,162,39,0.1)] text-[var(--text-secondary)] hover:text-[var(--accent)]" @click="startEditEvent(event)">
            <Pencil :size="16" />
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-[var(--text-secondary)] border-b border-[var(--border)]">
                <th class="pb-2 pr-4">Nom</th>
                <th class="pb-2 pr-4">Prix</th>
                <th class="pb-2 pr-4">Stock</th>
                <th class="pb-2 pr-4">Max/cmd</th>
                <th class="pb-2 pr-4">Statut</th>
                <th class="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in (ticketsByEvent[event.id] || [])" :key="t.id" class="border-b border-[var(--border)]/50">
                <td class="py-3 pr-4 font-medium">{{ t.name }}</td>
                <td class="py-3 pr-4">{{ t.price }}€</td>
                <td class="py-3 pr-4">{{ t.stock }}</td>
                <td class="py-3 pr-4">{{ t.maxPerOrder }}</td>
                <td class="py-3 pr-4">
                  <span class="px-2 py-0.5 rounded-full text-xs" :class="t.status === 'available' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'">
                    {{ t.status }}
                  </span>
                </td>
                <td class="py-3 flex gap-1">
                  <button class="p-1.5 rounded hover:bg-[rgba(201,162,39,0.1)]" @click="startEditTicket(t)"><Pencil :size="14" /></button>
                  <button class="p-1.5 rounded hover:bg-red-500/10 text-red-400" @click="store.deleteTicket(t.id)"><Trash2 :size="14" /></button>
                </td>
              </tr>
              <tr v-if="!(ticketsByEvent[event.id]?.length)">
                <td colspan="6" class="py-4 text-[var(--text-secondary)] text-center">Aucun ticket</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Edit Ticket Modal -->
    <div v-if="editingTicket" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div class="w-full max-w-md glass rounded-2xl p-5 sm:p-6 modal-panel">
        <h3 class="text-lg font-semibold mb-4">Éditer ticket</h3>
        <div class="space-y-3">
          <input v-model="editingTicket.name" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" placeholder="Nom" />
          <input v-model.number="editingTicket.price" type="number" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" placeholder="Prix" />
          <input v-model.number="editingTicket.stock" type="number" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" placeholder="Stock" />
          <input v-model.number="editingTicket.maxPerOrder" type="number" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" placeholder="Max par commande" />
          <select v-model="editingTicket.status" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
            <option value="available">available</option>
            <option value="sold_out">sold_out</option>
            <option value="draft">draft</option>
          </select>
        </div>
        <div class="flex gap-2 mt-6">
          <button class="btn-gold flex-1 py-2 rounded-xl flex items-center justify-center gap-2" @click="saveTicket"><Save :size="16" /> Sauver</button>
          <button class="btn-outline-gold px-4 py-2 rounded-xl" @click="editingTicket = null"><X :size="16" /></button>
        </div>
      </div>
    </div>

    <!-- Edit Event Modal (with video) -->
    <div v-if="editingEvent" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div class="w-full max-w-lg glass rounded-2xl p-5 sm:p-6 modal-panel">
        <h3 class="text-lg font-semibold mb-4">Éditer événement</h3>
        <div class="space-y-3">
          <input v-model="editingEvent.title" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" placeholder="Titre" />
          <input v-model="editingEvent.subtitle" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" placeholder="Sous-titre" />
          <textarea v-model="editingEvent.description" rows="3" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" placeholder="Description" />
          <input v-model="editingEvent.date" type="datetime-local" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" />
          <input v-model="editingEvent.location" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" placeholder="Lieu" />
          <input v-model="editingEvent.image" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" placeholder="URL image" />
          <input v-model="editingEvent.videoUrl" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" placeholder="URL vidéo YouTube embed" />
          <input v-model="editingEvent.category" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" placeholder="Catégorie" />
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="editingEvent.featured" class="accent-[var(--accent)]" /> Featured
          </label>
          <select v-model="editingEvent.approvalStatus" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
            <option value="approved">approved</option>
            <option value="pending">pending</option>
            <option value="rejected">rejected</option>
          </select>
        </div>
        <div class="flex gap-2 mt-6">
          <button class="btn-gold flex-1 py-2 rounded-xl" @click="saveEvent">Sauver</button>
          <button class="btn-outline-gold px-4 py-2 rounded-xl" @click="editingEvent = null">Annuler</button>
        </div>
      </div>
    </div>

    <!-- New Ticket Modal -->
    <div v-if="showNewTicket" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div class="w-full max-w-md glass rounded-2xl p-5 sm:p-6 modal-panel">
        <h3 class="text-lg font-semibold mb-4">Nouveau ticket</h3>
        <div class="space-y-3">
          <select v-model="newTicket.eventId" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
            <option value="">Choisir événement</option>
            <option v-for="e in store.events" :key="e.id" :value="e.id">{{ e.title }}</option>
          </select>
          <input v-model="newTicket.name" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" placeholder="Nom du ticket" />
          <input v-model.number="newTicket.price" type="number" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" placeholder="Prix" />
          <input v-model.number="newTicket.stock" type="number" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" placeholder="Stock" />
        </div>
        <div class="flex gap-2 mt-6">
          <button class="btn-gold flex-1 py-2 rounded-xl" @click="createTicket">Créer</button>
          <button class="btn-outline-gold px-4 py-2 rounded-xl" @click="showNewTicket = false">Annuler</button>
        </div>
      </div>
    </div>

    <!-- New Event Modal -->
    <div v-if="showNewEvent" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div class="w-full max-w-lg glass rounded-2xl p-5 sm:p-6 modal-panel">
        <h3 class="text-lg font-semibold mb-4">Nouvel événement</h3>
        <div class="space-y-3">
          <input v-model="newEvent.title" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" placeholder="Titre" />
          <textarea v-model="newEvent.description" rows="2" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" placeholder="Description" />
          <input v-model="newEvent.date" type="datetime-local" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" />
          <input v-model="newEvent.location" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" placeholder="Lieu" />
          <input v-model="newEvent.image" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" placeholder="URL image" />
          <input v-model="newEvent.videoUrl" class="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]" placeholder="URL vidéo embed (optionnel)" />
        </div>
        <div class="flex gap-2 mt-6">
          <button class="btn-gold flex-1 py-2 rounded-xl" @click="createEvent">Créer</button>
          <button class="btn-outline-gold px-4 py-2 rounded-xl" @click="showNewEvent = false">Annuler</button>
        </div>
      </div>
    </div>
  </div>
</template>
