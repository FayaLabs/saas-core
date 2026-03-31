import React from 'react'
import { SettingsGroup, ToggleRow } from '../../../components/plugins/SettingsGroup'

export function InventoryGeneralSettings() {
  return (
    <div className="space-y-4">
      <SettingsGroup title="Stock Management" description="How stock levels are tracked">
        <ToggleRow label="Low stock alerts" description="Show warnings when products fall below minimum quantity" checked={true} onChange={() => {}} />
        <ToggleRow label="Require reason for adjustments" description="Make reason mandatory for stock adjustments and losses" checked={true} onChange={() => {}} />
        <ToggleRow label="Auto-deduct on service" description="Automatically deduct products when a service is executed" checked={false} onChange={() => {}} />
      </SettingsGroup>

      <SettingsGroup title="Products" description="Product catalog behavior">
        <ToggleRow label="Require SKU" description="Make SKU mandatory when creating products" checked={false} onChange={() => {}} />
        <ToggleRow label="Allow negative stock" description="Allow stock quantities to go below zero" checked={false} onChange={() => {}} />
      </SettingsGroup>

      <SettingsGroup title="Notifications" description="Alerts and reminders">
        <ToggleRow label="Low stock email alerts" description="Send email when products reach minimum quantity" checked={false} onChange={() => {}} />
        <ToggleRow label="Expiry date warnings" description="Alert before products expire (batch tracking)" checked={true} onChange={() => {}} />
      </SettingsGroup>
    </div>
  )
}
