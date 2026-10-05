<script setup lang="ts">
import { useEventsStore } from '@/stores/events'
import type { OrderStatus } from '@/types'
import { generateInvoicePDF } from '@/composables/useInvoicePDF'
import { generateQRDataURL } from '@/composables/useQRCode'
import { ref, onMounted } from 'vue'
import { Download } from 'lucide-vue-next'

const store = useEventsStore()
const qrMap = ref<Record<string, string>>({})

onMounted(async () => {
  for (const o of store.orders) {
    if (o.format === 'digital') {
      qrMap.value[o.id] = await generateQRDataURL(o.qrData, 120)
    }
  }
})

function setStatus(id: string, status: OrderStatus) {
  store.updateOrderStatus(id, status)
}

function formatPrice(n: number) {
  return n.toLocaleString('fr-FR') + ' XOF'
}
</script>

<template>
  <div class="min-h-screen page-pad pb-24 md:pb-10">
    <h1 class="text-3xl font-bold mb-8" style="font-family: var(--font-space)">Commandes</h1>

    <div class="space-y-4">
      <div
        v-for="order in store.orders"
        :key="order.id"
        class="glass rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-center"
      >
        <div class="flex-1 min-w-0 sm:min-w-[200px] w-full">
          <div class="flex items-center gap-2 mb-1">
            <p class="font-mono text-[var(--accent)] font-medium">{{ order.code }}</p>
            <span
              class="text-[10px] px-2 py-0.5 rounded-full"
              :class="order.format === 'digital' ? 'bg-purple-500/20 text-purple-300' : 'bg-orange-500/20 text-orange-300'"
            >
              {{ order.format === 'digital' ? 'QR' : 'Physique' }}
            </span>
          </div>
          <p class="text-sm">{{ order.userName }} · {{ order.userPhone || order.userEmail || '—' }}</p>
          <p class="text-xs text-[var(--text-secondary)]">{{ new Date(order.createdAt).toLocaleString('fr-FR') }}</p>
          <div class="text-sm mt-1">
            <span v-for="item in order.items" :key="item.ticketId" class="block">
              {{ item.quantity }}x {{ item.ticketName }}
            </span>
          </div>
          <p class="text-sm mt-1">
            <template v-if="order.format === 'digital'">
              Paiement: {{ order.paymentMethod || '—' }}
            </template>
            <template v-else>
              {{ order.deliveryMethod?.name || 'Livraison' }}
              <span v-if="order.deliveryAddress"> · {{ order.deliveryAddress }}</span>
            </template>
            · <strong>{{ formatPrice(order.total) }}</strong>
          </p>
          <p v-if="order.organizerName" class="text-xs text-[var(--text-secondary)] mt-1">
            Orga: {{ order.organizerName }}
          </p>
        </div>

        <div v-if="qrMap[order.id]" class="rounded-lg overflow-hidden border border-[var(--border)]">
          <img :src="qrMap[order.id]" class="w-20 h-20" alt="QR" />
        </div>

        <select
          :value="order.status"
          class="px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm"
          @change="setStatus(order.id, ($event.target as HTMLSelectElement).value as OrderStatus)"
        >
          <option value="pending">pending</option>
          <option value="paid">paid</option>
          <option value="confirmed">confirmed</option>
          <option value="delivered">delivered</option>
          <option value="cancelled">cancelled</option>
        </select>

        <button
          class="btn-outline-gold px-3 py-2 rounded-xl text-sm flex items-center gap-1.5"
          @click="generateInvoicePDF(order)"
        >
          <Download :size="14" /> PDF
        </button>
      </div>

      <p v-if="store.orders.length === 0" class="text-center text-[var(--text-secondary)] py-12">Aucune commande</p>
    </div>
  </div>
</template>
