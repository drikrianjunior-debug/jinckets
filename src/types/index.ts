export type UserRole = 'admin' | 'client' | 'organizer'

/** Statut compte organisateur (après candidature / contrat) */
export type OrganizerAccountStatus = 'none' | 'pending' | 'approved' | 'rejected'

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: UserRole
  createdAt: string
  organizationName?: string
  /** Mot de passe mock (frontend only — backend plus tard) */
  password?: string
  /** Candidature organisateur */
  organizerStatus?: OrganizerAccountStatus
  /** Date d'acceptation du contrat numérique */
  contractSignedAt?: string
  /** Nom saisi comme signature du contrat */
  contractSignature?: string
  /** Signature manuscrite (data URL PNG) */
  contractSignatureImage?: string
  /** Mode UI actif si double rôle client + organisateur */
  activeMode?: 'client' | 'organizer'
  /** Type de pièce d'identité (CNI ou passeport uniquement) */
  idDocumentType?: 'cni' | 'passeport'
  /** Image / scan de la pièce (data URL) */
  idDocumentImage?: string
  idDocumentFileName?: string
}

/** Frais plateforme par commande physique (facture mensuelle organisateur) */
export const PHYSICAL_ORDER_PLATFORM_FEE = 500


export type TicketStatus = 'available' | 'sold_out' | 'draft'
export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled' | 'paid'
export type TicketFormat = 'digital' | 'physical'

export interface Event {
  id: string
  title: string
  subtitle?: string
  description: string
  date: string
  location: string
  image: string
  videoUrl?: string
  category: string
  featured: boolean
  organizerId?: string
  organizerName?: string
  organizerPhone?: string
  approvalStatus?: 'pending' | 'approved' | 'rejected'
}

export interface Ticket {
  id: string
  eventId: string
  name: string
  description?: string
  price: number
  stock: number
  maxPerOrder: number
  status: TicketStatus
  benefits?: string[]
}

export interface DeliveryMethod {
  id: string
  name: string
  price: number
  description: string
  estimatedDays: string
  ciOnly?: boolean
  digital?: boolean
}

export type PaymentMethodId = 'orange_money' | 'mtn_momo' | 'wave' | 'card_intl'

export interface PaymentMethod {
  id: PaymentMethodId
  name: string
  description: string
  icon: string
  ciPreferred?: boolean
  international?: boolean
}

export interface CartItem {
  ticketId: string
  eventId: string
  quantity: number
  ticketName: string
  eventTitle: string
  unitPrice: number
}

export interface Order {
  id: string
  userId: string
  userName: string
  userEmail: string
  userPhone?: string
  userCountry?: string
  userCity?: string
  userCommune?: string
  items: CartItem[]
  format: TicketFormat
  deliveryMethod?: DeliveryMethod
  deliveryAddress?: string
  paymentMethod?: PaymentMethodId
  total: number
  status: OrderStatus
  code: string
  qrData: string
  createdAt: string
  whatsappSent: boolean
  organizerId?: string
  organizerName?: string
}

export const WHATSAPP_BUSINESS = '2250759128035'
export const WHATSAPP_BUSINESS_DISPLAY = '+225 07 59 12 80 35'
export const DIGITAL_FEE = 500
