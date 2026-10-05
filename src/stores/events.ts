import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Event, Ticket, Order, OrderStatus, DeliveryMethod, PaymentMethod, TicketFormat
} from '@/types'
import { DIGITAL_FEE, WHATSAPP_BUSINESS } from '@/types'

/** Livraisons physiques uniquement (discutées via WhatsApp organisateur) */
const PHYSICAL_DELIVERIES: DeliveryMethod[] = [
  {
    id: 'home',
    name: 'Livraison à domicile',
    price: 0,
    description: 'Adresse à préciser dans le formulaire — tarifs fixés avec l\'organisateur sur WhatsApp',
    estimatedDays: 'Selon zone'
  },
  {
    id: 'pickup',
    name: 'Retrait sur place',
    price: 0,
    description: 'À récupérer à l\'entrée de l\'événement',
    estimatedDays: 'Jour J'
  }
]

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'orange_money',
    name: 'Orange Money',
    description: 'Mobile Money Orange Côte d\'Ivoire',
    icon: '🟠',
    ciPreferred: true
  },
  {
    id: 'mtn_momo',
    name: 'MTN MoMo',
    description: 'Mobile Money MTN',
    icon: '🟡',
    ciPreferred: true
  },
  {
    id: 'wave',
    name: 'Wave',
    description: 'Paiement Wave (rapide)',
    icon: '💙',
    ciPreferred: true
  },
  {
    id: 'card_intl',
    name: 'Carte bancaire / International',
    description: 'Visa, Mastercard — hors CI ou en ligne',
    icon: '💳',
    international: true
  }
]

export const useEventsStore = defineStore('events', () => {
  const events = ref<Event[]>([
    {
      id: 'evt-1',
      title: 'Neon Nights Festival',
      subtitle: 'Électro • House • Techno',
      description: 'La nuit la plus électrique de l\'année. 3 scènes, 20+ artistes, lasers et confettis jusqu\'à l\'aube.',
      date: '2026-11-15T22:00:00',
      location: 'Abidjan, Zone 4',
      image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&q=70&auto=format',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      category: 'Festival',
      featured: true,
      organizerId: 'org-1',
      organizerName: 'Kouassi Events CI',
      organizerPhone: '+2250759128035',
      approvalStatus: 'approved'
    },
    {
      id: 'evt-2',
      title: 'Sunset Groove',
      subtitle: 'Afrobeat • Amapiano',
      description: 'Coucher de soleil, vibes tropicales et beats qui font bouger. Open-air exclusif.',
      date: '2026-10-25T18:00:00',
      location: 'Assinie, Plage',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=70&auto=format',
      category: 'Open-air',
      featured: true,
      organizerId: 'org-1',
      organizerName: 'Kouassi Events CI',
      organizerPhone: '+2250759128035',
      approvalStatus: 'approved'
    },
    {
      id: 'evt-3',
      title: 'Underground Session',
      subtitle: 'Drum & Bass • Jungle',
      description: 'Secret location, pure underground energy. Pas de photos, que de la musique.',
      date: '2026-12-05T23:30:00',
      location: 'Abidjan, lieu secret',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&q=70&auto=format',
      category: 'Club',
      featured: false,
      organizerId: 'org-1',
      organizerName: 'Kouassi Events CI',
      organizerPhone: '+2250759128035',
      approvalStatus: 'approved'
    },
    {
      id: 'evt-4',
      title: 'Golden Hour Live',
      subtitle: 'Indie • Alternative',
      description: 'Concert intimiste au soleil couchant avec les meilleurs talents émergents.',
      date: '2026-11-02T17:00:00',
      location: 'Cocody, Rooftop',
      image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=900&q=70&auto=format',
      category: 'Concert',
      featured: true,
      organizerId: 'org-1',
      organizerName: 'Kouassi Events CI',
      organizerPhone: '+2250759128035',
      approvalStatus: 'approved'
    }
  ])

  const tickets = ref<Ticket[]>([
    { id: 'tkt-1', eventId: 'evt-1', name: 'Early Bird', description: 'Accès général + 1 drink', price: 5000, stock: 120, maxPerOrder: 4, status: 'available', benefits: ['Accès général', '1 drink offert'] },
    { id: 'tkt-2', eventId: 'evt-1', name: 'VIP Glow', description: 'Zone VIP + open bar 2h', price: 15000, stock: 40, maxPerOrder: 2, status: 'available', benefits: ['Zone VIP', 'Open bar 2h', 'Fast track'] },
    { id: 'tkt-3', eventId: 'evt-1', name: 'Backstage Pass', description: 'Meet & greet + after', price: 25000, stock: 10, maxPerOrder: 1, status: 'available', benefits: ['Meet & greet', 'After party', 'Goodies'] },
    { id: 'tkt-4', eventId: 'evt-2', name: 'Standard', price: 3000, stock: 200, maxPerOrder: 6, status: 'available' },
    { id: 'tkt-5', eventId: 'evt-2', name: 'Front Row', price: 7000, stock: 50, maxPerOrder: 2, status: 'available', benefits: ['Première rangée'] },
    { id: 'tkt-6', eventId: 'evt-3', name: 'Entry', price: 2500, stock: 80, maxPerOrder: 4, status: 'available' },
    { id: 'tkt-7', eventId: 'evt-4', name: 'General', price: 4000, stock: 100, maxPerOrder: 4, status: 'available' },
    { id: 'tkt-8', eventId: 'evt-4', name: 'Premium Seat', price: 8000, stock: 30, maxPerOrder: 2, status: 'available', benefits: ['Siège réservé'] }
  ])

  const orders = ref<Order[]>([
    {
      id: 'ord-1',
      userId: 'client-1',
      userName: 'Alex Vibes',
      userEmail: 'client@test.com',
      userPhone: '+2250700000001',
      items: [{ ticketId: 'tkt-1', eventId: 'evt-1', quantity: 2, ticketName: 'Early Bird', eventTitle: 'Neon Nights Festival', unitPrice: 5000 }],
      format: 'digital',
      paymentMethod: 'wave',
      total: 5000 * 2 + DIGITAL_FEE,
      status: 'paid',
      code: 'JCK-A1B2C3',
      qrData: 'JCK-A1B2C3|Alex Vibes|+2250700000001|Neon Nights',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      whatsappSent: true,
      organizerId: 'org-1',
      organizerName: 'Kouassi Events CI'
    }
  ])

  const physicalDeliveries = ref(PHYSICAL_DELIVERIES)
  const paymentMethods = ref(PAYMENT_METHODS)

  const approvedEvents = computed(() =>
    events.value.filter(e => !e.approvalStatus || e.approvalStatus === 'approved')
  )
  const featuredEvents = computed(() => approvedEvents.value.filter(e => e.featured))
  const orderStats = computed(() => {
    const stats = { pending: 0, confirmed: 0, delivered: 0, cancelled: 0, paid: 0 }
    orders.value.forEach(o => { stats[o.status] = (stats[o.status] || 0) + 1 })
    return stats
  })
  const pendingEvents = computed(() => events.value.filter(e => e.approvalStatus === 'pending'))

  function getEvent(id: string) {
    return events.value.find(e => e.id === id)
  }

  function getTicketsForEvent(eventId: string) {
    return tickets.value.filter(t => t.eventId === eventId)
  }

  function getTicket(id: string) {
    return tickets.value.find(t => t.id === id)
  }

  function updateTicket(ticket: Ticket) {
    const idx = tickets.value.findIndex(t => t.id === ticket.id)
    if (idx !== -1) tickets.value[idx] = { ...ticket }
  }

  function addTicket(ticket: Omit<Ticket, 'id'>) {
    const newTicket: Ticket = { ...ticket, id: `tkt-${Date.now()}` }
    tickets.value.push(newTicket)
    return newTicket
  }

  function deleteTicket(id: string) {
    tickets.value = tickets.value.filter(t => t.id !== id)
  }

  function updateEvent(event: Event) {
    const idx = events.value.findIndex(e => e.id === event.id)
    if (idx !== -1) events.value[idx] = { ...event }
  }

  function addEvent(event: Omit<Event, 'id'>) {
    const newEvent: Event = { ...event, id: `evt-${Date.now()}` }
    events.value.push(newEvent)
    return newEvent
  }

  function setEventApproval(eventId: string, status: 'approved' | 'rejected' | 'pending') {
    const e = events.value.find(ev => ev.id === eventId)
    if (e) e.approvalStatus = status
  }

  function updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = orders.value.find(o => o.id === orderId)
    if (order) order.status = status
  }

  function createOrder(order: Omit<Order, 'id' | 'code' | 'qrData' | 'createdAt'>) {
    const code = `JCK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    const qrData = [
      code,
      order.userName,
      order.userPhone || '',
      order.items.map(i => `${i.ticketName}x${i.quantity}`).join(','),
      new Date().toLocaleDateString('fr-FR')
    ].join('|')
    const newOrder: Order = {
      ...order,
      id: `ord-${Date.now()}`,
      code,
      qrData,
      createdAt: new Date().toISOString()
    }
    order.items.forEach(item => {
      const t = tickets.value.find(tk => tk.id === item.ticketId)
      if (t) t.stock = Math.max(0, t.stock - item.quantity)
    })
    orders.value.unshift(newOrder)
    return newOrder
  }

  function getOrdersByUser(userId: string) {
    return orders.value.filter(o => o.userId === userId)
  }

  function getOrdersByOrganizer(organizerId: string) {
    return orders.value.filter(o => o.organizerId === organizerId)
  }

  function getEventsByOrganizer(organizerId: string) {
    return events.value.filter(e => e.organizerId === organizerId)
  }

  /** Ouvre WhatsApp avec un message prérempli */
  function openWhatsApp(phone: string, text: string) {
    const digits = phone.replace(/\D/g, '')
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, '_blank')
  }

  return {
    events, tickets, orders, physicalDeliveries, paymentMethods,
    approvedEvents, featuredEvents, orderStats, pendingEvents,
    getEvent, getTicketsForEvent, getTicket,
    updateTicket, addTicket, deleteTicket,
    updateEvent, addEvent, setEventApproval,
    updateOrderStatus, createOrder, getOrdersByUser,
    getOrdersByOrganizer, getEventsByOrganizer, openWhatsApp,
    DIGITAL_FEE, WHATSAPP_BUSINESS
  }
})
