<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useEventsStore } from '@/stores/events'
import { generateQRDataURL } from '@/composables/useQRCode'
import { generateInvoicePDF } from '@/composables/useInvoicePDF'
import { motion } from 'motion-v'
import { Ticket, Download } from 'lucide-vue-next'

const auth = useAuthStore()
const eventsStore = useEventsStore()

const orders = computed(() => eventsStore.getOrdersByUser(auth.user?.id || 'client-1'))
const qrMap = ref<Record<string, string>>({})

async function loadQRs() {
  for (const o of orders.value) {
    if (o.format === 'digital' && !qrMap.value[o.id]) {
      qrMap.value[o.id] = await generateQRDataURL(o.qrData, 180)
    }
  }
}

onMounted(loadQRs)
watch(orders, loadQRs, { deep: true })

async function downloadInvoice(order: (typeof orders.value)[0]) {
  await generateInvoicePDF(order)
}

function formatPrice(n: number) {
  return n.toLocaleString('fr-FR') + ' XOF'
}
</script>

<template>
  <div class="min-h-screen page-pad pb-24 md:pb-10">
    <motion.div :initial="{ opacity: 0, y: 20 }" :animate="{ opacity: 1, y: 0 }">
      <h1 class="text-2xl sm:text-3xl font-bold mb-1" style="font-family: var(--font-space)">
        Salut, <span class="gold-gradient">{{ auth.user?.name || 'Viber' }}</span> 👋
      </h1>
      <p class="text-[var(--text-secondary)] mb-10">Tes tickets numériques et commandes physiques.</p>

      <div v-if="orders.length === 0" class="glass rounded-3xl p-12 text-center">
        <Ticket class="mx-auto mb-4 text-[var(--text-secondary)]" :size="48" />
        <p class="text-[var(--text-secondary)]">Aucune commande pour le moment.</p>
        <router-link to="/events" class="btn-gold inline-block mt-6 px-6 py-3 rounded-xl">
          Explorer les événements
        </router-link>
      </div>

      <div class="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        <motion.div
          v-for="order in orders"
          :key="order.id"
          class="glass rounded-2xl p-4 sm:p-6" data-reveal="up" data-reveal-stagger="80"
          :initial="{ opacity: 0, y: 15 }"
          :animate="{ opacity: 1, y: 0 }"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <p class="font-mono text-sm text-[var(--accent)]">{{ order.code }}</p>
              <p class="text-xs text-[var(--text-secondary)]">
                {{ new Date(order.createdAt).toLocaleString('fr-FR') }}
              </p>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span
                class="px-2.5 py-1 rounded-full text-xs font-medium"
                :class="order.format === 'digital' ? 'bg-purple-500/20 text-purple-300' : 'bg-orange-500/20 text-orange-300'"
              >
                {{ order.format === 'digital' ? 'Numérique' : 'Physique' }}
              </span>
              <span
                class="px-2.5 py-1 rounded-full text-xs font-medium"
                :class="{
                  'bg-yellow-500/20 text-yellow-400': order.status === 'pending',
                  'bg-green-500/20 text-green-400': order.status === 'confirmed' || order.status === 'paid',
                  'bg-blue-500/20 text-blue-400': order.status === 'delivered',
                  'bg-red-500/20 text-red-400': order.status === 'cancelled'
                }"
              >
                {{ order.status }}
              </span>
            </div>
          </div>

          <div class="space-y-1 mb-4 text-sm">
            <div v-for="item in order.items" :key="item.ticketId">
              {{ item.quantity }}x {{ item.ticketName }} — {{ item.eventTitle }}
            </div>
          </div>

          <p class="text-sm text-[var(--text-secondary)] mb-4">
            <template v-if="order.format === 'digital'">
              Ticket QR · {{ order.paymentMethod || '—' }}
            </template>
            <template v-else>
              {{ order.deliveryMethod?.name || 'Livraison' }}
              <span v-if="order.deliveryAddress"> · {{ order.deliveryAddress }}</span>
            </template>
            · Total: <strong class="text-[var(--accent)]">{{ formatPrice(order.total) }}</strong>
          </p>

          <div class="flex gap-3 items-end flex-wrap">
            <div
              v-if="order.format === 'digital' && qrMap[order.id]"
              class="rounded-xl overflow-hidden border border-[var(--border)]"
            >
              <img :src="qrMap[order.id]" alt="QR Ticket" class="w-28 h-28" />
            </div>
            <button
              class="btn-outline-gold px-4 py-2 rounded-xl text-sm flex items-center gap-2"
              @click="downloadInvoice(order)"
            >
              <Download :size="14" /> Facture PDF
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  </div>
</template>
