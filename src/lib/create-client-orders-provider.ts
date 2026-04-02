// ---------------------------------------------------------------------------
// Factory: creates a ClientOrdersProvider that queries saas_core.orders
// for a given client (party_id). Unified stage-based model.
// ---------------------------------------------------------------------------

import type { ClientOrdersProvider, ClientOrdersQuery, ClientDocument, ClientDocumentStage } from '../types/client-orders'
import { getSupabaseClientOptional } from './supabase'

const STAGE_FILTER_MAP: Record<string, ClientDocumentStage[]> = {
  quoted: ['quoted'],
  booked: ['booked'],
  invoiced: ['invoiced', 'partial', 'overdue'],
  paid: ['paid'],
}

export function createClientOrdersProvider(): ClientOrdersProvider {
  return {
    async getDocuments(query: ClientOrdersQuery): Promise<{ data: ClientDocument[]; total: number }> {
      const supabase = getSupabaseClientOptional()
      if (!supabase) return { data: [], total: 0 }

      try {
        let qb = supabase
          .schema('saas_core')
          .from('orders')
          .select('id, kind, stage, status, total, reference_number, starts_at, notes, metadata, created_at')
          .eq('party_id', query.clientId)

        // Filter by stage groups
        if (query.stages && query.stages.length > 0) {
          const allStages = query.stages.flatMap((s) => STAGE_FILTER_MAP[s] ?? [s])
          qb = qb.in('stage', allStages)
        }

        qb = qb.order('created_at', { ascending: false })

        const page = query.page ?? 1
        const pageSize = query.pageSize ?? 50
        qb = qb.range((page - 1) * pageSize, page * pageSize - 1)

        const { data, count } = await qb

        const results: ClientDocument[] = (data ?? []).map((row) => {
          const meta = (row.metadata ?? {}) as Record<string, unknown>
          return {
            id: row.id,
            kind: row.kind as string,
            stage: (row.stage ?? 'draft') as ClientDocumentStage,
            referenceNumber: row.reference_number ?? undefined,
            date: (row.starts_at as string)?.slice(0, 10) ?? (row.created_at as string)?.slice(0, 10) ?? '',
            startsAt: row.starts_at as string | undefined,
            total: Number(row.total) || 0,
            paidAmount: Number(meta.paidAmount) || 0,
            description: (meta.itemsSummary as string) ?? (meta.serviceNames as string) ?? row.notes ?? undefined,
            createdAt: row.created_at as string,
          }
        })

        return { data: results, total: count ?? results.length }
      } catch {
        return { data: [], total: 0 }
      }
    },
  }
}
