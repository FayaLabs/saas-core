import { createStore, type StoreApi } from 'zustand/vanilla'
import { dedup } from '../../lib/dedup'
import { toast } from 'sonner'
import type { CrmDataProvider } from './data/types'
import type {
  Pipeline, PipelineStage, Lead, Deal, Activity, Quote,
  CrmSummary, FunnelStage,
  LeadQuery, DealQuery, ActivityQuery, QuoteQuery,
  CreateLeadInput, CreateDealInput, CreateActivityInput, CreateQuoteInput,
} from './types'

export interface CrmUIState {
  pipelines: Pipeline[]
  stages: PipelineStage[]
  leads: Lead[]
  leadsTotal: number
  leadsLoading: boolean
  deals: Deal[]
  dealsTotal: number
  dealsLoading: boolean
  dealsByStage: Map<string, Deal[]>
  activities: Activity[]
  activitiesTotal: number
  activitiesLoading: boolean
  quotes: Quote[]
  quotesTotal: number
  quotesLoading: boolean
  summary: CrmSummary | null
  summaryLoading: boolean
  funnel: FunnelStage[]

  fetchPipelines(): Promise<void>
  fetchSummary(): Promise<void>
  fetchFunnel(pipelineId: string): Promise<void>
  fetchLeads(query: LeadQuery): Promise<void>
  fetchDeals(query: DealQuery): Promise<void>
  fetchDealsByStage(pipelineId: string): Promise<void>
  fetchActivities(query: ActivityQuery): Promise<void>
  fetchQuotes(query: QuoteQuery): Promise<void>
  createLead(input: CreateLeadInput): Promise<Lead>
  createDeal(input: CreateDealInput): Promise<Deal>
  createActivity(input: CreateActivityInput): Promise<Activity>
  createQuote(input: CreateQuoteInput): Promise<Quote>
  moveDealToStage(dealId: string, stageId: string): Promise<void>
}

export function createCrmStore(provider: CrmDataProvider): StoreApi<CrmUIState> {
  return createStore<CrmUIState>((set, get) => ({
    pipelines: [], stages: [],
    leads: [], leadsTotal: 0, leadsLoading: false,
    deals: [], dealsTotal: 0, dealsLoading: false,
    dealsByStage: new Map(),
    activities: [], activitiesTotal: 0, activitiesLoading: false,
    quotes: [], quotesTotal: 0, quotesLoading: false,
    summary: null, summaryLoading: false,
    funnel: [],

    async fetchPipelines() {
      return dedup('crm:pipelines', async () => {
        const pipelines = await provider.getPipelines()
        const stages = pipelines.length > 0 ? await provider.getPipelineStages(pipelines[0].id) : []
        set({ pipelines, stages })
      })
    },

    async fetchSummary() {
      return dedup('crm:summary', async () => {
        set({ summaryLoading: true })
        const summary = await provider.getSummary()
        set({ summary, summaryLoading: false })
      })
    },

    async fetchFunnel(pipelineId) {
      return dedup('crm:funnel:' + pipelineId, async () => {
        const funnel = await provider.getFunnel(pipelineId)
        set({ funnel })
      })
    },

    async fetchLeads(query) {
      return dedup('crm:leads:' + JSON.stringify(query), async () => {
        set({ leadsLoading: true })
        const result = await provider.getLeads(query)
        set({ leads: result.data, leadsTotal: result.total, leadsLoading: false })
      })
    },

    async fetchDeals(query) {
      return dedup('crm:deals:' + JSON.stringify(query), async () => {
        set({ dealsLoading: true })
        const result = await provider.getDeals(query)
        set({ deals: result.data, dealsTotal: result.total, dealsLoading: false })
      })
    },

    async fetchDealsByStage(pipelineId) {
      return dedup('crm:dealsByStage:' + pipelineId, async () => {
        set({ dealsLoading: true })
        const dealsByStage = await provider.getDealsByStage(pipelineId)
        set({ dealsByStage, dealsLoading: false })
      })
    },

    async fetchActivities(query) {
      return dedup('crm:activities:' + JSON.stringify(query), async () => {
        set({ activitiesLoading: true })
        const result = await provider.getActivities(query)
        set({ activities: result.data, activitiesTotal: result.total, activitiesLoading: false })
      })
    },

    async fetchQuotes(query) {
      return dedup('crm:quotes:' + JSON.stringify(query), async () => {
        set({ quotesLoading: true })
        const result = await provider.getQuotes(query)
        set({ quotes: result.data, quotesTotal: result.total, quotesLoading: false })
      })
    },

    async createLead(input) {
      try {
        const lead = await provider.createLead(input)

        // Auto-create a deal in the first pipeline stage so it appears in the kanban
        // Fetch pipelines if not loaded yet
        let { pipelines, stages } = get()
        if (pipelines.length === 0) {
          pipelines = await provider.getPipelines()
          stages = pipelines.length > 0 ? await provider.getPipelineStages(pipelines[0].id) : []
          set({ pipelines, stages })
        }

        const defaultPipeline = pipelines.find((p) => p.isDefault) ?? pipelines[0]
        const firstStage = stages.filter((s) => !s.isWon && !s.isLost).sort((a, b) => a.order - b.order)[0]
        if (defaultPipeline && firstStage) {
          try {
            await provider.createDeal({
              leadId: lead.id,
              title: lead.name,
              value: input.value ?? 0,
              pipelineId: defaultPipeline.id,
              stageId: firstStage.id,
              contactName: lead.name,
            })
          } catch {
            // Deal creation failed — lead is still created, just won't appear in pipeline
          }
        }

        const summary = await provider.getSummary()
        set({ summary })
        toast.success('Lead captured')
        return lead
      } catch (err: any) {
        toast.error('Failed to create lead', { description: err?.message })
        throw err
      }
    },

    async createDeal(input) {
      try {
        const deal = await provider.createDeal(input)
        const [summary] = await Promise.all([provider.getSummary()])
        set({ summary })
        toast.success('Deal created')
        return deal
      } catch (err: any) {
        toast.error('Failed to create deal', { description: err?.message })
        throw err
      }
    },

    async createActivity(input) {
      try {
        const activity = await provider.createActivity(input)
        toast.success('Activity logged')
        return activity
      } catch (err: any) {
        toast.error('Failed to log activity', { description: err?.message })
        throw err
      }
    },

    async createQuote(input) {
      try {
        const quote = await provider.createQuote(input)

        // Auto-create a deal in the "Proposal" stage so it appears in the pipeline
        if (!input.dealId) {
          let { pipelines, stages } = get()
          if (pipelines.length === 0) {
            pipelines = await provider.getPipelines()
            stages = pipelines.length > 0 ? await provider.getPipelineStages(pipelines[0].id) : []
            set({ pipelines, stages })
          }

          const defaultPipeline = pipelines.find((p) => p.isDefault) ?? pipelines[0]
          const proposalStage = stages.find((s) => s.name === 'Proposal')
            ?? stages.filter((s) => !s.isWon && !s.isLost).sort((a, b) => b.order - a.order)[0]
          if (defaultPipeline && proposalStage) {
            try {
              await provider.createDeal({
                title: input.contactName ? `Quote ${quote.quoteNumber} - ${input.contactName}` : `Quote ${quote.quoteNumber}`,
                value: quote.totalAmount,
                pipelineId: defaultPipeline.id,
                stageId: proposalStage.id,
                contactId: input.contactId,
                contactName: input.contactName,
              })
            } catch {
              // Deal creation failed — quote is still saved
            }
          }
        }

        toast.success('Quote created')
        return quote
      } catch (err: any) {
        toast.error('Failed to create quote', { description: err?.message })
        throw err
      }
    },

    async moveDealToStage(dealId, stageId) {
      await provider.moveDealToStage(dealId, stageId)
      const { pipelines } = get()
      if (pipelines.length > 0) {
        const dealsByStage = await provider.getDealsByStage(pipelines[0].id)
        const summary = await provider.getSummary()
        set({ dealsByStage, summary })
      }
    },
  }))
}
