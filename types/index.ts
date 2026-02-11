// ========================================
// Types miroir des entités backend
// ========================================

// --- Auth ---
export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: 'ROLE_PRESTA' | 'ROLE_USER' | 'ROLE_ADMIN'
  isPasswordTemporary: boolean
  createdAt: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  passwordConfirmation: string
  firstName: string
  lastName: string
}

// --- Company ---
export interface Company {
  id: number
  name: string
  siret: string
  siren: string
  tvaNumber: string | null
  type: string // SARL, SAS, etc.
  address: string
  phone: string | null
  email: string | null
  website: string | null
  stripeAccountId: string | null
  stripeOnboardingStatus: 'not_started' | 'pending' | 'verified' | 'rejected'
  stripeChargesEnabled: boolean
  stripePayoutsEnabled: boolean
}

export interface Contact {
  id: number
  firstName: string
  lastName: string
  email: string
  role: 'admin' | 'commercial' | 'comptabilite'
  phone: string | null
  companyId: number
}

// --- Client ---
export interface Client {
  id: number
  number: string // N° 2024002
  firstName: string
  lastName: string
  email: string
  phone: string | null
  address: string | null
  civility: 'M' | 'Mme' | null
  totalCA: number
  companyId: number
  createdAt: string
}

// --- Event ---
export type EventCategory = 'mariage' | 'seminaire' | 'reception' | 'anniversaire' | 'communion' | 'autre'
export type EventStatus = 'inquiry' | 'quoted' | 'confirmed' | 'cancelled'

export interface EventItem {
  id: number
  title: string
  category: EventCategory
  date: string
  budget: number
  guestCount: number | null
  status: EventStatus
  progress: number // 0-100
  clientId: number
  clientName: string
  companyId: number
}

// --- Document ---
export type DocumentType = 'devis' | 'facture' | 'contrat'
export type DocumentStatus = 'draft' | 'sent' | 'accepted' | 'refused' | 'paid'

export interface DocumentItem {
  id: number
  number: string // D202405006
  type: DocumentType
  designation: string
  amount: number
  sentAt: string | null
  acceptedAt: string | null
  filePath: string | null
  status: DocumentStatus
  eventId: number | null
  clientId: number
  clientName: string
  companyId: number
  companyName: string
  prestation: string
  createdAt: string
}

// --- Transaction ---
export interface Transaction {
  id: number
  number: string
  date: string
  amount: number
  designation: string
  clientName: string
  stripePaymentIntentId: string | null
  documentId: number
}

// --- Provider (du point de vue utilisateur) ---
export interface Provider {
  id: number
  name: string
  category: string
  email: string
  phone: string | null
  website: string | null
  devisStatus: 'pending' | 'accepted' | 'refused' | null
  factureStatus: 'pending' | 'paid' | null
  contratStatus: 'pending' | 'signed' | null
}

// --- Chat / Widget ---
export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  createdAt: string
}

export interface WidgetConfig {
  venueName: string
  venueSlug: string
  welcomeMessage: string
  avatarUrl: string | null
  accentColor: string | null
}

// --- Pagination ---
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface CursorPaginatedResponse<T> {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
}

// --- SIRENE API ---
export interface SireneResult {
  siret: string
  siren: string
  name: string
  address: string
  postalCode: string
  city: string
}