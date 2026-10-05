<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventsStore } from '@/stores/events'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import type { PaymentMethodId, TicketFormat } from '@/types'
import { DIGITAL_FEE } from '@/types'
import { motion } from 'motion-v'
import {
  MapPin, Calendar, Plus, Minus, ShoppingBag, MessageCircle, X, Check,
  CreditCard, Smartphone, QrCode, Package
} from 'lucide-vue-next'

const props = defineProps<{ id: string }>()
const route = useRoute()
const router = useRouter()
const eventsStore = useEventsStore()
const cart = useCartStore()
const auth = useAuthStore()

const event = computed(() => eventsStore.getEvent(props.id || (route.params.id as string)))
const tickets = computed(() => eventsStore.getTicketsForEvent(event.value?.id || ''))
const quantities = ref<Record<string, number>>({})
const showCheckout = ref(false)
const step = ref<'format' | 'details'>('format')
const userName = ref(auth.user?.name || '')
const userPhone = ref(auth.user?.phone || '')
const userCountry = ref('Côte d\'Ivoire')
const userCity = ref('')
const userCommune = ref('')

function qty(id: string) {
  return quantities.value[id] || 0
}
function setQty(id: string, n: number) {
  const t = tickets.value.find(tk => tk.id === id)
  if (!t) return
  quantities.value[id] = Math.max(0, Math.min(n, t.stock, t.maxPerOrder))
}
function addToCart(ticketId: string) {
  const t = tickets.value.find(tk => tk.id === ticketId)
  if (!t || !event.value || qty(ticketId) <= 0) return
  cart.addItem({
    ticketId: t.id,
    eventId: event.value.id,
    quantity: qty(ticketId),
    ticketName: t.name,
    eventTitle: event.value.title,
    unitPrice: t.price
  })
  quantities.value[ticketId] = 0
}
function openCheckout() {
  if (cart.items.length === 0) return
  step.value = 'format'
  cart.format = null
  cart.selectedPayment = null
  cart.selectedDelivery = null
  showCheckout.value = true
}
function chooseFormat(f: TicketFormat) {
  cart.setFormat(f)
  if (f === 'physical' && eventsStore.physicalDeliveries[0]) {
    cart.setDelivery(eventsStore.physicalDeliveries[0])
  }
  if (f === 'digital' && eventsStore.paymentMethods[0]) {
    cart.setPayment(eventsStore.paymentMethods[0].id)
  }
  step.value = 'details'
}
async function confirm() {
  if (!userName.value || !userPhone.value) return
  if (!userCountry.value || !userCity.value || !userCommune.value) return
  const uid = auth.user?.id || 'guest'
  const location = {
    country: userCountry.value,
    city: userCity.value,
    commune: userCommune.value
  }
  if (cart.format === 'digital') {
    if (!cart.selectedPayment) return
    await cart.checkoutDigital(userName.value, userPhone.value, uid, location)
  } else {
    cart.checkoutPhysical(userName.value, userPhone.value, uid, location)
  }
  showCheckout.value = false
  router.push(auth.isAuthenticated ? '/client' : '/events')
}
function formatPrice(n: number) {
  return n.toLocaleString('fr-FR') + ' XOF'
}
</script>

<template>
  <div v-if="event" class="min-h-screen">
    <div class="relative h-52 sm:h-64 md:h-80 overflow-hidden">
      <img :src="event.image" :alt="event.title" class="w-full h-full object-cover" loading="eager" decoding="async" />
      <div class="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
      <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-10">
        <span class="text-xs font-medium text-[var(--accent)] uppercase tracking-wider">{{ event.category }}</span>
        <h1 class="text-3xl md:text-5xl font-bold mt-1" style="font-family: var(--font-space)">{{ event.title }}</h1>
        <div class="flex flex-wrap gap-4 mt-3 text-sm text-[var(--text-secondary)]">
          <span class="flex items-center gap-1.5"><Calendar :size="14" /> {{ new Date(event.date).toLocaleString('fr-FR') }}</span>
          <span class="flex items-center gap-1.5"><MapPin :size="14" /> {{ event.location }}</span>
        </div>
        <p v-if="event.organizerName" class="text-xs text-[var(--text-secondary)] mt-2">
          Organisé par <span class="text-[var(--accent)]">{{ event.organizerName }}</span>
        </p>
      </div>
    </div>

    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-32 md:pb-10">
      <div v-if="event.videoUrl" class="mb-10 rounded-2xl overflow-hidden aspect-video">
        <iframe :src="event.videoUrl" class="w-full h-full" frameborder="0" allowfullscreen />
      </div>
      <p class="text-[var(--text-secondary)] mb-10 max-w-2xl">{{ event.description }}</p>
      <h2 class="text-2xl font-semibold mb-6">Choisir ses tickets</h2>

      <div class="grid gap-4 md:grid-cols-2">
        <motion.div
          v-for="(ticket, idx) in tickets"
          :key="ticket.id"
          class="glass rounded-2xl p-6 flex flex-col" data-reveal="up" data-reveal-stagger="90"
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ delay: idx * 0.06 }"
          :whileHover="{ y: -4 }"
        >
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="font-semibold text-lg">{{ ticket.name }}</h3>
              <p v-if="ticket.description" class="text-sm text-[var(--text-secondary)] mt-0.5">{{ ticket.description }}</p>
            </div>
            <span class="text-xl font-bold text-[var(--accent)]">{{ formatPrice(ticket.price) }}</span>
          </div>
          <ul v-if="ticket.benefits?.length" class="text-sm text-[var(--text-secondary)] mb-4 space-y-1">
            <li v-for="b in ticket.benefits" :key="b" class="flex items-center gap-1.5">
              <Check :size="14" class="text-[var(--accent)]" /> {{ b }}
            </li>
          </ul>
          <div class="mt-auto flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div class="flex items-center gap-2">
              <button class="w-9 h-9 rounded-lg glass flex items-center justify-center" @click="setQty(ticket.id, qty(ticket.id) - 1)">
                <Minus :size="16" />
              </button>
              <span class="w-8 text-center font-medium">{{ qty(ticket.id) }}</span>
              <button class="w-9 h-9 rounded-lg glass flex items-center justify-center" @click="setQty(ticket.id, qty(ticket.id) + 1)">
                <Plus :size="16" />
              </button>
            </div>
            <span class="text-xs text-[var(--text-secondary)]">{{ ticket.stock }} restants</span>
            <button
              class="btn-gold px-4 py-2 rounded-xl text-sm disabled:opacity-40"
              :disabled="qty(ticket.id) === 0 || ticket.stock === 0"
              @click="addToCart(ticket.id)"
            >
              Ajouter
            </button>
          </div>
        </motion.div>
      </div>
    </div>

    <!-- Floating cart -->
    <Transition name="cart-pop">
    <div
      v-if="cart.totalItems > 0"
      class="fixed cart-float z-40 glass rounded-2xl px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 sm:gap-6 shadow-2xl"
    >
      <div class="flex items-center gap-2">
        <ShoppingBag :size="20" class="text-[var(--accent)]" />
        <span class="font-medium">{{ cart.totalItems }} ticket(s)</span>
        <span class="text-[var(--accent)] font-bold">{{ formatPrice(cart.subtotal) }}</span>
      </div>
      <button class="btn-gold px-5 py-2.5 rounded-xl" @click="openCheckout">Commander</button>
    </div>
    </Transition>

    <!-- Checkout modal -->
    <Transition name="modal-fade">
    <div v-if="showCheckout" class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div
        class="w-full sm:max-w-md glass rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 checkout-sheet"
      >
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-semibold">
            {{ step === 'format' ? 'Format du ticket' : (cart.format === 'digital' ? 'Paiement numérique' : 'Livraison physique') }}
          </h3>
          <button @click="showCheckout = false" class="p-1 hover:text-[var(--accent)]"><X :size="20" /></button>
        </div>

        <!-- Récap items -->
        <div class="space-y-2 mb-6 text-sm">
          <div v-for="item in cart.items" :key="item.ticketId" class="flex justify-between">
            <span>{{ item.quantity }}x {{ item.ticketName }}</span>
            <span>{{ formatPrice(item.unitPrice * item.quantity) }}</span>
          </div>
          <div class="flex justify-between text-[var(--text-secondary)] border-t border-[var(--border)] pt-2">
            <span>Sous-total</span>
            <span>{{ formatPrice(cart.subtotal) }}</span>
          </div>
        </div>

        <!-- STEP 1: Format -->
        <template v-if="step === 'format'">
          <p class="text-sm text-[var(--text-secondary)] mb-4">Comment souhaitez-vous recevoir vos tickets ?</p>
          <div class="space-y-3">
            <button
              class="w-full text-left p-4 rounded-2xl border transition-all hover:border-[var(--accent)]"
              :class="cart.format === 'digital' ? 'border-[var(--accent)] bg-[rgba(201,162,39,0.1)]' : 'border-[var(--border)]'"
              @click="chooseFormat('digital')"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-[rgba(201,162,39,0.15)] flex items-center justify-center text-[var(--accent)]">
                  <QrCode :size="20" />
                </div>
                <div class="flex-1">
                  <p class="font-semibold">Format numérique (QR)</p>
                  <p class="text-xs text-[var(--text-secondary)]">
                    +{{ DIGITAL_FEE }} XOF · paiement en ligne · ticket envoyé automatiquement sur WhatsApp
                  </p>
                </div>
              </div>
            </button>
            <button
              class="w-full text-left p-4 rounded-2xl border transition-all hover:border-[var(--accent)]"
              :class="cart.format === 'physical' ? 'border-[var(--accent)] bg-[rgba(201,162,39,0.1)]' : 'border-[var(--border)]'"
              @click="chooseFormat('physical')"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-[rgba(201,162,39,0.15)] flex items-center justify-center text-[var(--accent)]">
                  <Package :size="20" />
                </div>
                <div class="flex-1">
                  <p class="font-semibold">Format physique</p>
                  <p class="text-xs text-[var(--text-secondary)]">
                    Livraison / retrait — discussion avec l'organisateur sur WhatsApp
                  </p>
                </div>
              </div>
            </button>
          </div>
        </template>

        <!-- STEP 2 DIGITAL -->
        <template v-else-if="cart.format === 'digital'">
          <button class="text-xs text-[var(--accent)] mb-4" @click="step = 'format'">← Changer de format</button>

          <div class="flex justify-between text-sm mb-4 text-[var(--accent)]">
            <span>Frais format numérique</span>
            <span>+{{ formatPrice(DIGITAL_FEE) }}</span>
          </div>
          <div class="flex justify-between font-semibold text-lg mb-6">
            <span>Total</span>
            <span class="text-[var(--accent)]">{{ formatPrice(cart.total) }}</span>
          </div>

          <p class="text-sm font-medium mb-2 flex items-center gap-2">
            <CreditCard :size="14" /> Moyen de paiement
          </p>
          <div class="space-y-2 mb-6">
            <label
              v-for="p in eventsStore.paymentMethods"
              :key="p.id"
              class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer"
              :class="cart.selectedPayment === p.id ? 'border-[var(--accent)] bg-[rgba(201,162,39,0.1)]' : 'border-[var(--border)]'"
            >
              <input
                type="radio"
                :value="p.id"
                :checked="cart.selectedPayment === p.id"
                @change="cart.setPayment(p.id as PaymentMethodId)"
                class="mt-1 accent-[var(--accent)]"
              />
              <div>
                <span class="font-medium text-sm">{{ p.icon }} {{ p.name }}</span>
                <p class="text-xs text-[var(--text-secondary)]">{{ p.description }}</p>
              </div>
            </label>
          </div>

          <div class="space-y-3 mb-6">
            <input v-model="userName" type="text" placeholder="Ton nom (sur le ticket)"
              class="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none" />
            <input v-model="userPhone" type="tel" placeholder="WhatsApp pour recevoir le QR (+225…)"
              class="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none" />
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input v-model="userCountry" type="text" placeholder="Pays"
                class="w-full px-3 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none text-sm" />
              <input v-model="userCity" type="text" placeholder="Ville"
                class="w-full px-3 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none text-sm" />
              <input v-model="userCommune" type="text" placeholder="Commune"
                class="w-full px-3 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none text-sm" />
            </div>
          </div>

          <button
            class="btn-gold w-full py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            :disabled="!userName || !userPhone || !userCountry || !userCity || !userCommune || !cart.selectedPayment"
            @click="confirm"
          >
            <Smartphone :size="18" />
            Recevoir ticket QR + facture
          </button>
          <p class="text-[10px] text-center text-[var(--text-secondary)] mt-3">
            Après validation : facture PDF téléchargée + WhatsApp ouvert vers <strong>ton numéro</strong>
            avec le ticket QR et le récapitulatif de facture uniquement.
          </p>
        </template>

        <!-- STEP 2 PHYSICAL -->
        <template v-else>
          <button class="text-xs text-[var(--accent)] mb-4" @click="step = 'format'">← Changer de format</button>

          <p class="text-sm font-medium mb-2">Mode de réception</p>
          <div class="space-y-2 mb-4">
            <label
              v-for="m in eventsStore.physicalDeliveries"
              :key="m.id"
              class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer"
              :class="cart.selectedDelivery?.id === m.id ? 'border-[var(--accent)] bg-[rgba(201,162,39,0.1)]' : 'border-[var(--border)]'"
            >
              <input
                type="radio"
                :value="m.id"
                :checked="cart.selectedDelivery?.id === m.id"
                @change="cart.setDelivery(m)"
                class="mt-1 accent-[var(--accent)]"
              />
              <div>
                <span class="font-medium text-sm">{{ m.name }}</span>
                <p class="text-xs text-[var(--text-secondary)]">{{ m.description }}</p>
              </div>
            </label>
          </div>

          <textarea
            v-if="cart.selectedDelivery?.id === 'home'"
            v-model="cart.deliveryAddress"
            rows="2"
            placeholder="Adresse de livraison (quartier, commune, repères…)"
            class="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none mb-4 text-sm"
          />

          <div class="space-y-3 mb-6">
            <input v-model="userName" type="text" placeholder="Ton nom"
              class="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none" />
            <input v-model="userPhone" type="tel" placeholder="Ton WhatsApp (+225…)"
              class="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none" />
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input v-model="userCountry" type="text" placeholder="Pays"
                class="w-full px-3 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none text-sm" />
              <input v-model="userCity" type="text" placeholder="Ville"
                class="w-full px-3 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none text-sm" />
              <input v-model="userCommune" type="text" placeholder="Commune"
                class="w-full px-3 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none text-sm" />
            </div>
          </div>

          <div class="flex justify-between font-semibold text-lg mb-4">
            <span>Total tickets</span>
            <span class="text-[var(--accent)]">{{ formatPrice(cart.total) }}</span>
          </div>

          <button
            class="btn-gold w-full py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            :disabled="!userName || !userPhone || !userCountry || !userCity || !userCommune"
            @click="confirm"
          >
            <MessageCircle :size="18" />
            Discuter livraison sur WhatsApp
          </button>
          <p class="text-[10px] text-center text-[var(--text-secondary)] mt-3">
            Tu seras mis en relation avec l'organisateur
            <strong v-if="event.organizerName"> ({{ event.organizerName }})</strong>
            pour finaliser livraison et paiement.
          </p>
        </template>
      </div>
    </div>
    </Transition>
  </div>
  <div v-else class="min-h-screen flex items-center justify-center">
    <p class="text-[var(--text-secondary)]">Événement introuvable</p>
  </div>
</template>
