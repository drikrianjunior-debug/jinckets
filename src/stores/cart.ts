import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CartItem, DeliveryMethod, PaymentMethodId, TicketFormat } from '@/types'
import { DIGITAL_FEE, WHATSAPP_BUSINESS } from '@/types'
import { useEventsStore } from './events'
import { generateInvoicePDF } from '@/composables/useInvoicePDF'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const format = ref<TicketFormat | null>(null)
  const selectedDelivery = ref<DeliveryMethod | null>(null)
  const selectedPayment = ref<PaymentMethodId | null>(null)
  const deliveryAddress = ref('')

  const totalItems = computed(() => items.value.reduce((s, i) => s + i.quantity, 0))
  const subtotal = computed(() => items.value.reduce((s, i) => s + i.unitPrice * i.quantity, 0))
  const digitalFee = computed(() => (format.value === 'digital' ? DIGITAL_FEE : 0))
  const total = computed(() => subtotal.value + digitalFee.value)

  function addItem(item: CartItem) {
    const existing = items.value.find(i => i.ticketId === item.ticketId)
    if (existing) {
      existing.quantity = Math.min(existing.quantity + item.quantity, 10)
    } else {
      items.value.push({ ...item })
    }
  }

  function removeItem(ticketId: string) {
    items.value = items.value.filter(i => i.ticketId !== ticketId)
  }

  function updateQuantity(ticketId: string, quantity: number) {
    const item = items.value.find(i => i.ticketId === ticketId)
    if (item) {
      if (quantity <= 0) removeItem(ticketId)
      else item.quantity = quantity
    }
  }

  function setFormat(f: TicketFormat) {
    format.value = f
    if (f === 'digital') {
      selectedDelivery.value = null
      deliveryAddress.value = ''
    } else {
      selectedPayment.value = null
    }
  }

  function setDelivery(method: DeliveryMethod) {
    selectedDelivery.value = method
  }

  function setPayment(method: PaymentMethodId) {
    selectedPayment.value = method
  }

  function clear() {
    items.value = []
    format.value = null
    selectedDelivery.value = null
    selectedPayment.value = null
    deliveryAddress.value = ''
  }

  /**
   * Format numérique uniquement :
   * - génère la commande + QR
   * - télécharge la facture PDF
   * - ouvre WhatsApp CLIENT avec ticket QR + résumé facture (pas de discussion organisateur)
   */
  async function checkoutDigital(
    userName: string,
    userPhone: string,
    userId = 'guest',
    location?: { country?: string; city?: string; commune?: string }
  ) {
    if (format.value !== 'digital' || items.value.length === 0 || !selectedPayment.value) return null
    const eventsStore = useEventsStore()
    const firstEvent = eventsStore.getEvent(items.value[0].eventId)
    const paymentLabel = eventsStore.paymentMethods.find(p => p.id === selectedPayment.value)?.name || selectedPayment.value
    const place = [location?.commune, location?.city, location?.country].filter(Boolean).join(', ')

    const order = eventsStore.createOrder({
      userId,
      userName,
      userEmail: '',
      userPhone,
      userCountry: location?.country,
      userCity: location?.city,
      userCommune: location?.commune,
      items: [...items.value],
      format: 'digital',
      paymentMethod: selectedPayment.value,
      total: total.value,
      status: 'paid',
      whatsappSent: true,
      organizerId: firstEvent?.organizerId,
      organizerName: firstEvent?.organizerName
    })

    // Facture PDF automatique (téléchargement navigateur)
    try {
      await generateInvoicePDF(order)
    } catch (e) {
      console.warn('Facture PDF non générée', e)
    }

    const dateStr = new Date(order.createdAt).toLocaleString('fr-FR')
    const lines = [
      "🎫 *Jin'ckets — TON TICKET NUMÉRIQUE*",
      '',
      'Ce message contient ton *billet QR* et le *récapitulatif de facture*.',
      '',
      '——— TICKET QR ———',
      `Code billet: *${order.code}*`,
      `Titulaire: ${userName}`,
      place ? `Lieu: ${place}` : '',
      '',
      'Données QR (à présenter à l\'entrée) :',
      `\`${order.qrData}\``,
      '',
      '——— FACTURE ———',
      `N° ${order.code}  ·  ${dateStr}`,
      ...items.value.map(
        i => `• ${i.quantity}x ${i.ticketName} (${i.eventTitle}) — ${(i.unitPrice * i.quantity).toLocaleString('fr-FR')} XOF`
      ),
      `Frais format numérique: +${DIGITAL_FEE.toLocaleString('fr-FR')} XOF`,
      `Paiement: ${paymentLabel}`,
      `*Total payé: ${total.value.toLocaleString('fr-FR')} XOF*`,
      '',
      '📎 La facture PDF a aussi été téléchargée sur ton appareil.',
      "Présente le code billet / QR à l'entrée. Bonne soirée ✨"
    ].filter(line => line !== '')

    // Uniquement le WhatsApp du CLIENT (pas l'organisateur / business)
    eventsStore.openWhatsApp(userPhone, lines.join('\n'))

    clear()
    return order
  }

  function checkoutPhysical(
    userName: string,
    userPhone: string,
    userId = 'guest',
    location?: { country?: string; city?: string; commune?: string }
  ) {
    if (format.value !== 'physical' || items.value.length === 0) return null
    const eventsStore = useEventsStore()
    const firstEvent = eventsStore.getEvent(items.value[0].eventId)
    const orgPhone = firstEvent?.organizerPhone || WHATSAPP_BUSINESS

    const order = eventsStore.createOrder({
      userId,
      userName,
      userEmail: '',
      userPhone,
      userCountry: location?.country,
      userCity: location?.city,
      userCommune: location?.commune,
      items: [...items.value],
      format: 'physical',
      deliveryMethod: selectedDelivery.value || undefined,
      deliveryAddress: deliveryAddress.value || undefined,
      total: total.value,
      status: 'pending',
      whatsappSent: true,
      organizerId: firstEvent?.organizerId,
      organizerName: firstEvent?.organizerName
    })

    const lines = [
      '🎫 *Jin\'ckets — Ticket PHYSIQUE*',
      '',
      `Code commande: *${order.code}*`,
      '',
      `👤 Client: ${userName}`,
      `📱 WhatsApp: ${userPhone}`,
      '',
      ...items.value.map(i => `• ${i.quantity}x ${i.ticketName} (${i.eventTitle}) — ${(i.unitPrice * i.quantity).toLocaleString('fr-FR')} XOF`),
      '',
      `📦 Mode: ${selectedDelivery.value?.name || 'À définir'}`,
      deliveryAddress.value ? `📍 Adresse: ${deliveryAddress.value}` : '',
      `💰 Sous-total tickets: ${subtotal.value.toLocaleString('fr-FR')} XOF`,
      '',
      'Bonjour, je souhaite commander ces tickets en format physique. Merci de me confirmer la livraison et le paiement.'
    ].filter(Boolean)

    eventsStore.openWhatsApp(orgPhone, lines.join('\n'))
    clear()
    return order
  }

  return {
    items, format, selectedDelivery, selectedPayment, deliveryAddress,
    totalItems, subtotal, digitalFee, total,
    addItem, removeItem, updateQuantity,
    setFormat, setDelivery, setPayment, clear,
    checkoutDigital, checkoutPhysical
  }
})
