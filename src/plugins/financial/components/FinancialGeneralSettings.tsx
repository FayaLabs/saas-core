import React from 'react'
import { SettingsGroup, ToggleRow } from '../../../components/plugins/SettingsGroup'

export function FinancialGeneralSettings() {
  return (
    <div className="space-y-4">
      <SettingsGroup title="Invoices" description="How invoices and payments are handled">
        <ToggleRow label="Auto-generate installments" description="Automatically split invoice total into equal installments" checked={true} onChange={() => {}} />
        <ToggleRow label="Require document number" description="Make document/invoice number mandatory on payments" checked={false} onChange={() => {}} />
        <ToggleRow label="Allow partial payments" description="Accept payments less than the full installment amount" checked={true} onChange={() => {}} />
      </SettingsGroup>

      <SettingsGroup title="Cash Register" description="Cash session behavior">
        <ToggleRow label="Require opening balance" description="Opening balance must be confirmed before starting a session" checked={true} onChange={() => {}} />
        <ToggleRow label="Auto-close at end of day" description="Remind to close open sessions at the end of business hours" checked={false} onChange={() => {}} />
      </SettingsGroup>

      <SettingsGroup title="Notifications" description="Alerts and reminders">
        <ToggleRow label="Overdue payment alerts" description="Notify when invoices pass their due date" checked={true} onChange={() => {}} />
        <ToggleRow label="Daily financial summary" description="Send a daily email summary of receivables and payables" checked={false} onChange={() => {}} />
      </SettingsGroup>
    </div>
  )
}
