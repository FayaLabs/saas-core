import { create } from 'zustand'
import type { BillingState, Plan, Subscription, Invoice } from '../types'

interface BillingStore extends BillingState {
  setSubscription: (subscription: Subscription | null) => void
  setInvoices: (invoices: Invoice[]) => void
  setPlans: (plans: Plan[]) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

const initialState: BillingState = {
  subscription: null,
  invoices: [],
  plans: [],
  loading: false,
}

export const useBillingStore = create<BillingStore>((set) => ({
  ...initialState,
  setSubscription: (subscription) => set({ subscription }),
  setInvoices: (invoices) => set({ invoices }),
  setPlans: (plans) => set({ plans }),
  setLoading: (loading) => set({ loading }),
  reset: () => set(initialState),
}))
