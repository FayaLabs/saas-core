import type { FinancialDataProvider } from './types'
import type {
  Invoice, InvoiceItem, FinancialMovement, BankAccount,
  CashSession, PaymentMethod, PaymentMethodType, ChartOfAccountsNode,
  CardTransaction,
  CreateInvoiceInput, PayMovementInput,
  OpenCashSessionInput, CloseCashSessionInput, CreateBankAccountInput,
  InvoiceQuery, MovementQuery, StatementQuery,
  PaginatedResult, FinancialSummary, StatementEntry, CashSessionSummary,
  DateRange,
} from '../types'
import { getSupabaseClientOptional } from '../../../lib/supabase'
import { useOrganizationStore } from '../../../stores/organization.store'

function getTenantId(): string | undefined {
  return useOrganizationStore.getState().currentOrg?.id
}

function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = value
  }
  return result
}

function camelToSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('_')) continue
    result[key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)] = value
  }
  return result
}

function getClients() {
  const supabase = getSupabaseClientOptional()
  if (!supabase) throw new Error('Supabase not initialized')
  return { core: supabase.schema('saas_core'), pub: supabase }
}

export function createSupabaseFinancialProvider(): FinancialDataProvider {
  const provider: FinancialDataProvider = {
    // --- Invoices (saas_core.orders kind='invoice_*') ---
    async getInvoices(query: InvoiceQuery): Promise<PaginatedResult<Invoice>> {
      const { core, pub } = getClients()
      const kind = query.direction === 'debit' ? 'invoice_payable' : query.direction === 'credit' ? 'invoice_receivable' : undefined
      let qb = core.from('orders').select('*', { count: 'exact' })
      if (kind) qb = qb.eq('kind', kind)
      else qb = qb.in('kind', ['invoice_payable', 'invoice_receivable'])
      if (query.status) {
        const statuses = Array.isArray(query.status) ? query.status : [query.status]
        qb = qb.in('status', statuses)
      }
      if (query.contactId) qb = qb.eq('party_id', query.contactId)
      if (query.search) qb = qb.ilike('notes', `%${query.search}%`)
      if (query.dateRange) qb = qb.gte('created_at', query.dateRange.from).lte('created_at', query.dateRange.to)
      const page = query.page ?? 1
      const pageSize = query.pageSize ?? 50
      qb = qb.range((page - 1) * pageSize, page * pageSize - 1).order('created_at', { ascending: false })
      const { data, count } = await qb

      const invoices: Invoice[] = (data ?? []).map((r: any) => {
        const meta = r.metadata ?? {}
        return {
          id: r.id,
          direction: r.kind === 'invoice_payable' ? 'debit' : 'credit',
          invoiceDate: r.created_at?.slice(0, 10) ?? '',
          fiscalNumber: r.reference_number,
          totalAmount: r.total ?? 0,
          paidAmount: meta.paidAmount ?? 0,
          status: r.status ?? 'open',
          totalInstallments: meta.installmentCount ?? 1,
          contactId: r.party_id,
          contactName: meta.contactName,
          observations: r.notes,
          itemsSummary: meta.itemsSummary,
          tenantId: r.tenant_id,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        } as Invoice
      })
      return { data: invoices, total: count ?? 0 }
    },

    async getInvoiceById(id: string): Promise<Invoice | null> {
      const { core, pub } = getClients()
      const { data } = await core.from('orders').select('*').eq('id', id).single()
      if (!data) return null
      const o = snakeToCamel(data) as any
      const meta = data.metadata ?? {}
      // Get actual paid amount and installment count from movements
      const { data: movs } = await pub.from('financial_movements')
        .select('paid_amount')
        .eq('invoice_id', id)
        .eq('movement_kind', 'bill')
      const totalPaid = (movs ?? []).reduce((sum: number, m: any) => sum + (m.paid_amount ?? 0), 0)
      return {
        id: o.id,
        direction: o.kind === 'invoice_payable' ? 'debit' : 'credit',
        invoiceDate: o.createdAt?.slice(0, 10) ?? '',
        totalAmount: o.total ?? 0, paidAmount: totalPaid, status: o.status ?? 'open',
        totalInstallments: (movs ?? []).length || 1, contactId: o.partyId,
        contactName: meta.contactName, itemsSummary: meta.itemsSummary,
        observations: o.notes,
        tenantId: o.tenantId, createdAt: o.createdAt, updatedAt: o.updatedAt,
      } as Invoice
    },

    async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
      const { core, pub } = getClients()
      const { data } = await core.from('order_items').select('*').eq('order_id', invoiceId).order('sort_order')
      return (data ?? []).map((r) => {
        const i = snakeToCamel(r) as any
        return {
          id: i.id, invoiceId, itemKind: i.metadata?.itemKind ?? 'other',
          description: i.name ?? '', quantity: i.quantity ?? 1,
          unitPrice: i.unitPrice ?? 0, totalAmount: i.total ?? 0,
          discount: i.discount ?? 0, surcharge: 0,
          referenceId: i.productId ?? i.serviceId,
          createdAt: i.createdAt,
        } as InvoiceItem
      })
    },

    async createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
      const { core, pub } = getClients()
      const tenantId = getTenantId()
      const kind = input.direction === 'debit' ? 'invoice_payable' : 'invoice_receivable'
      const totalAmount = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice - (item.discount ?? 0) + (item.surcharge ?? 0), 0)
      const itemsSummary = input.items.map((i) => i.description).filter(Boolean).join(', ')

      const { data: order } = await core.from('orders').insert({
        tenant_id: tenantId, kind, status: 'open',
        reference_number: input.fiscalNumber,
        total: totalAmount, party_id: input.contactId,
        notes: input.observations,
        currency: 'BRL',
        metadata: { itemsSummary, contactName: input.contactName, installmentCount: input.installments.length || 1 },
      }).select().single()

      if (order && input.items.length > 0) {
        await core.from('order_items').insert(
          input.items.map((item, i) => ({
            order_id: order.id, name: item.description,
            quantity: item.quantity, unit_price: item.unitPrice,
            discount: item.discount ?? 0,
            total: item.quantity * item.unitPrice - (item.discount ?? 0) + (item.surcharge ?? 0),
            sort_order: i,
            metadata: { itemKind: item.itemKind, referenceId: item.referenceId },
          }))
        )
      }

      // Create installment movements
      if (order && input.installments.length > 0) {
        await pub.from('financial_movements').insert(
          input.installments.map((inst, i) => ({
            tenant_id: tenantId, invoice_id: order.id,
            direction: input.direction, movement_kind: inst.movementKind,
            amount: inst.amount, paid_amount: 0, status: 'pending',
            due_date: inst.dueDate, installment_number: inst.installmentNumber ?? i + 1,
          }))
        )
      }

      return {
        id: order!.id, direction: input.direction, invoiceDate: new Date().toISOString().slice(0, 10),
        totalAmount, paidAmount: 0, status: 'open', totalInstallments: input.installments.length || 1,
        contactName: input.contactName, itemsSummary,
        tenantId: tenantId!, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      } as Invoice
    },

    async updateInvoice(id: string, partial: Partial<Invoice>): Promise<Invoice> {
      const { core, pub } = getClients()
      const row: any = {}
      if (partial.observations) row.notes = partial.observations
      if (partial.totalAmount) row.total = partial.totalAmount
      if (partial.status) row.status = partial.status
      if (Object.keys(row).length > 0) await core.from('orders').update(row).eq('id', id)
      return (await provider.getInvoiceById(id))!
    },

    async cancelInvoice(id: string): Promise<void> {
      const { core, pub } = getClients()
      await core.from('orders').update({ status: 'cancelled' }).eq('id', id)
      await pub.from('financial_movements').update({ status: 'cancelled' }).eq('invoice_id', id).eq('status', 'pending')
    },

    // --- Movements (public.financial_movements) ---
    async getMovements(query: MovementQuery): Promise<PaginatedResult<FinancialMovement>> {
      const { core, pub } = getClients()
      let qb = pub.from('financial_movements').select('*', { count: 'exact' })
      if (query.direction) qb = qb.eq('direction', query.direction)
      if (query.status) {
        const statuses = Array.isArray(query.status) ? query.status : [query.status]
        qb = qb.in('status', statuses)
      }
      if (query.bankAccountId) qb = qb.eq('bank_account_id', query.bankAccountId)
      if (query.cashSessionId) qb = qb.eq('cash_session_id', query.cashSessionId)
      if (query.dateRange) qb = qb.gte('due_date', query.dateRange.from).lte('due_date', query.dateRange.to)
      const page = query.page ?? 1
      const pageSize = query.pageSize ?? 50
      qb = qb.range((page - 1) * pageSize, page * pageSize - 1).order('due_date')
      const { data, count } = await qb
      return { data: (data ?? []).map((r) => snakeToCamel(r) as unknown as FinancialMovement), total: count ?? 0 }
    },

    async payMovement(input: PayMovementInput): Promise<FinancialMovement> {
      const { core, pub } = getClients()
      const { data: mov } = await pub.from('financial_movements').select('*').eq('id', input.movementId).single()
      if (!mov) throw new Error('Movement not found')
      const newPaid = (mov.paid_amount ?? 0) + input.amount
      const newStatus = newPaid >= mov.amount ? 'paid' : 'partial'
      const updates: any = { paid_amount: newPaid, status: newStatus, payment_date: input.paymentDate }
      if (input.paymentMethodId) updates.payment_method_id = input.paymentMethodId
      if (input.bankAccountId) updates.bank_account_id = input.bankAccountId
      if (input.cashSessionId) updates.cash_session_id = input.cashSessionId
      if (input.cardBrand) updates.card_brand = input.cardBrand
      if (input.cardInstallments) updates.card_installments = input.cardInstallments
      const { data } = await pub.from('financial_movements').update(updates).eq('id', input.movementId).select().single()

      // Update invoice (order) status based on all its movements
      if (mov.invoice_id) {
        const { data: allMovs } = await pub.from('financial_movements')
          .select('status, amount, paid_amount')
          .eq('invoice_id', mov.invoice_id)
          .eq('movement_kind', 'bill')
        const movs = allMovs ?? []
        const allPaid = movs.length > 0 && movs.every((m: any) => m.status === 'paid')
        const anyPaid = movs.some((m: any) => m.status === 'paid' || m.status === 'partial')
        const invoiceStatus = allPaid ? 'paid' : anyPaid ? 'partial' : 'open'
        const totalPaid = movs.reduce((sum: number, m: any) => sum + (m.paid_amount ?? 0), 0)
        // Store paid amount in metadata (orders table has no dedicated paid column)
        const { data: order } = await core.from('orders').select('metadata').eq('id', mov.invoice_id).single()
        const meta = (order?.metadata as any) ?? {}
        await core.from('orders').update({
          status: invoiceStatus,
          metadata: { ...meta, paidAmount: totalPaid },
        }).eq('id', mov.invoice_id)
      }

      return snakeToCamel(data!) as unknown as FinancialMovement
    },

    async cancelMovement(id: string): Promise<void> {
      const { core, pub } = getClients()
      await pub.from('financial_movements').update({ status: 'cancelled' }).eq('id', id)
    },

    // --- Bank Accounts ---
    async getBankAccounts(): Promise<BankAccount[]> {
      const { core, pub } = getClients()
      const { data } = await pub.from('bank_accounts').select('*').eq('is_active', true).order('name')
      return (data ?? []).map((r) => snakeToCamel(r) as unknown as BankAccount)
    },

    async createBankAccount(input: CreateBankAccountInput): Promise<BankAccount> {
      const { core, pub } = getClients()
      const tenantId = getTenantId()
      const { data } = await pub.from('bank_accounts').insert({
        ...camelToSnake(input as any), tenant_id: tenantId, current_balance: input.initialBalance ?? 0,
      }).select().single()
      return snakeToCamel(data!) as unknown as BankAccount
    },

    async updateBankAccount(id: string, partial: Partial<BankAccount>): Promise<BankAccount> {
      const { core, pub } = getClients()
      const row = camelToSnake(partial as any)
      delete row.id; delete row.tenant_id
      const { data } = await pub.from('bank_accounts').update(row).eq('id', id).select().single()
      return snakeToCamel(data!) as unknown as BankAccount
    },

    // --- Cash Sessions ---
    async getCashSessions(bankAccountId?: string): Promise<CashSession[]> {
      const { core, pub } = getClients()
      let qb = pub.from('cash_register_sessions').select('*')
      if (bankAccountId) qb = qb.eq('bank_account_id', bankAccountId)
      const { data } = await qb.order('opened_at', { ascending: false })
      return (data ?? []).map((r) => snakeToCamel(r) as unknown as CashSession)
    },

    async getOpenSession(bankAccountId: string): Promise<CashSession | null> {
      const { core, pub } = getClients()
      const { data } = await pub.from('cash_register_sessions').select('*').eq('bank_account_id', bankAccountId).eq('status', 'open').single()
      return data ? snakeToCamel(data) as unknown as CashSession : null
    },

    async openCashSession(input: OpenCashSessionInput): Promise<CashSession> {
      const { core, pub } = getClients()
      const tenantId = getTenantId()
      const { data } = await pub.from('cash_register_sessions').insert({
        tenant_id: tenantId, bank_account_id: input.bankAccountId,
        status: 'open', opening_balance: input.openingBalance,
        opened_by_user_id: input.openedByUserId, opened_by_name: input.openedByName,
        unit_id: input.unitId,
      }).select().single()
      return snakeToCamel(data!) as unknown as CashSession
    },

    async closeCashSession(input: CloseCashSessionInput): Promise<CashSession> {
      const { core, pub } = getClients()
      const { data } = await pub.from('cash_register_sessions').update({
        status: 'closed', closing_balance: input.closingBalance,
        closed_at: new Date().toISOString(),
        closed_by_user_id: input.closedByUserId, closed_by_name: input.closedByName,
        notes: input.notes,
      }).eq('id', input.sessionId).select().single()
      return snakeToCamel(data!) as unknown as CashSession
    },

    async getCashSessionSummary(sessionId: string): Promise<CashSessionSummary> {
      const { core, pub } = getClients()
      const session = (await pub.from('cash_register_sessions').select('*').eq('id', sessionId).single()).data
      const { data: movs } = await pub.from('financial_movements').select('direction, paid_amount').eq('cash_session_id', sessionId).eq('status', 'paid')
      const movements = movs ?? []
      return {
        session: snakeToCamel(session!) as unknown as CashSession,
        movementCount: movements.length,
        totalInflow: movements.filter((m: any) => m.direction === 'credit').reduce((s: number, m: any) => s + m.paid_amount, 0),
        totalOutflow: movements.filter((m: any) => m.direction === 'debit').reduce((s: number, m: any) => s + m.paid_amount, 0),
      }
    },

    // --- Payment Methods ---
    async getPaymentMethods(): Promise<PaymentMethod[]> {
      const { core, pub } = getClients()
      const { data } = await pub.from('payment_methods').select('*').eq('is_active', true).order('name')
      return (data ?? []).map((r) => snakeToCamel(r) as unknown as PaymentMethod)
    },

    async getPaymentMethodTypes(): Promise<PaymentMethodType[]> {
      const { core, pub } = getClients()
      const { data } = await pub.from('payment_method_types').select('*').eq('is_active', true).order('name')
      return (data ?? []).map((r) => snakeToCamel(r) as unknown as PaymentMethodType)
    },

    // --- Chart of Accounts ---
    async getChartOfAccounts(): Promise<ChartOfAccountsNode[]> {
      const { core, pub } = getClients()
      const { data } = await pub.from('chart_of_accounts').select('*').eq('is_active', true).order('code')
      return (data ?? []).map((r) => snakeToCamel(r) as unknown as ChartOfAccountsNode)
    },

    // --- Card Transactions ---
    async getCardTransactions(dateRange?: DateRange): Promise<CardTransaction[]> {
      const { core, pub } = getClients()
      return [] // TODO: implement when card_transactions table exists
    },

    // --- Statements ---
    async getStatement(query: StatementQuery): Promise<StatementEntry[]> {
      const { core, pub } = getClients()
      const { data: movs } = await pub.from('financial_movements').select('*')
        .eq('bank_account_id', query.bankAccountId).eq('status', 'paid')
        .gte('payment_date', query.dateRange.from).lte('payment_date', query.dateRange.to)
        .order('payment_date')

      const { data: account } = await pub.from('bank_accounts').select('initial_balance').eq('id', query.bankAccountId).single()
      let balance = account?.initial_balance ?? 0

      return (movs ?? []).map((r) => {
        const mov = snakeToCamel(r) as unknown as FinancialMovement
        if (mov.direction === 'credit') balance += mov.paidAmount
        else balance -= mov.paidAmount
        return { movement: mov, runningBalance: balance }
      })
    },

    // --- Summary ---
    async getSummary(dateRange?: DateRange): Promise<FinancialSummary> {
      const { core, pub } = getClients()
      const { data: accounts } = await pub.from('bank_accounts').select('current_balance').eq('is_active', true)
      const totalBalance = (accounts ?? []).reduce((s: number, a: any) => s + (a.current_balance ?? 0), 0)

      const { data: movs } = await pub.from('financial_movements').select('direction, movement_kind, amount, paid_amount, status, due_date, payment_date')
      const allMovs = movs ?? []
      const pending = allMovs.filter((m: any) => ['pending', 'partial'].includes(m.status))
      const today = new Date().toISOString().slice(0, 10)

      const pendingCredit = pending.filter((m: any) => m.direction === 'credit')
      const pendingDebit = pending.filter((m: any) => m.direction === 'debit')
      const overdueCredit = pendingCredit.filter((m: any) => m.due_date < today)
      const overdueDebit = pendingDebit.filter((m: any) => m.due_date < today)

      const monthStart = today.slice(0, 7) + '-01'
      const monthPaid = allMovs.filter((m: any) => m.status === 'paid' && m.payment_date >= monthStart)

      return {
        totalBalance,
        totalReceivable: pendingCredit.reduce((s: number, m: any) => s + m.amount - m.paid_amount, 0),
        totalPayable: pendingDebit.reduce((s: number, m: any) => s + m.amount - m.paid_amount, 0),
        monthlyInflow: monthPaid.filter((m: any) => m.direction === 'credit').reduce((s: number, m: any) => s + m.paid_amount, 0),
        monthlyOutflow: monthPaid.filter((m: any) => m.direction === 'debit').reduce((s: number, m: any) => s + m.paid_amount, 0),
        overdueReceivableCount: overdueCredit.length,
        overdueReceivableAmount: overdueCredit.reduce((s: number, m: any) => s + m.amount - m.paid_amount, 0),
        overduePayableCount: overdueDebit.length,
        overduePayableAmount: overdueDebit.reduce((s: number, m: any) => s + m.amount - m.paid_amount, 0),
      }
    },
  }

  return provider
}
