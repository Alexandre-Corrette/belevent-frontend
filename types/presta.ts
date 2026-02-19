// ========================================
// Types espace prestataire (F4)
// ========================================

import type { EventCategory, EventStatus, DocumentType, DocumentStatus } from './index'

// --- Event (vue prestataire enrichie) ---
export interface PrestaEvent {
  id: number
  title: string
  category: EventCategory
  date: string
  startTime?: string
  endTime?: string
  guestCount: number | null
  status: EventStatus
  clientName: string
  clientEmail?: string
  /** Visible uniquement si ownership ou confirmed provider */
  budget?: number
  description?: string
  /** Visible uniquement si l'utilisateur est createdBy */
  inviteCode?: string
  createdBy: number
  createdAt: string
}

// --- EventProvider (prestataire rattaché à un événement) ---
export type EventProviderStatus = 'pending' | 'confirmed' | 'declined'

export interface PrestaEventProvider {
  id: number
  eventId: number
  company: { id: number; name: string }
  category: string
  status: EventProviderStatus
  phone?: string
  email?: string
  documents: { devis: boolean; facture: boolean; contrat: boolean }
  createdAt: string
}

// --- Client (vue prestataire enrichie) ---
export interface PrestaClient {
  id: number
  email: string
  firstName: string
  lastName: string
  phone?: string
  eventsCount: number
  documentsCount: number
  lastActivity?: string
}

// --- Document (devis / facture) ---
export interface PrestaDocument {
  id: number
  type: DocumentType
  documentNumber: string
  designation: string
  category?: string
  amount: number
  status: DocumentStatus
  clientId: number
  clientName: string
  eventId?: number
  eventTitle?: string
  sentAt?: string
  acceptedAt?: string
  paidAt?: string
  fileUrl?: string
  createdAt: string
}

// --- Dashboard ---
export interface DashboardStats {
  revenueMonth: number
  revenueGoal: number
  revenuePercent: number
  quotesSigned: number
  quotesSignedAmount: number
  invoicesPending: number
  invoicesPendingAmount: number
}

export type AgendaItemType =
  | 'send_quote'
  | 'send_invoice'
  | 'send_contract'
  | 'process_request'
  | 'payment'

export interface AgendaItem {
  id: number
  label: string
  type: AgendaItemType
  relatedDocumentId?: number
  relatedClientId?: number
  dueDate?: string
  completed: boolean
}

// --- Filters ---
export interface EventFilters {
  month?: string
  status?: EventStatus
  search?: string
}

export interface DocumentFilters {
  type?: DocumentType
  status?: DocumentStatus
  month?: string
  eventId?: number
}
