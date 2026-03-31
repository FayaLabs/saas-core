import React from 'react'
import { SettingsGroup, ToggleRow } from '../../../components/plugins/SettingsGroup'

export function CrmGeneralSettings() {
  return (
    <div className="space-y-4">
      <SettingsGroup title="Lead Management" description="How leads are captured and handled">
        <ToggleRow label="Auto-assign leads" description="Automatically assign new leads to available team members" checked={false} onChange={() => {}} />
        <ToggleRow label="Require lead source" description="Make source selection mandatory when capturing leads" checked={true} onChange={() => {}} />
        <ToggleRow label="Lead scoring" description="Automatically score leads based on engagement signals" checked={false} onChange={() => {}} />
        <ToggleRow label="Duplicate detection" description="Warn when a lead with the same email or phone already exists" checked={true} onChange={() => {}} />
      </SettingsGroup>

      <SettingsGroup title="Deals" description="Deal pipeline behavior">
        <ToggleRow label="Auto-create deal on conversion" description="Create a deal automatically when a lead is qualified" checked={true} onChange={() => {}} />
        <ToggleRow label="Require expected close date" description="Make expected close date mandatory on deals" checked={false} onChange={() => {}} />
        <ToggleRow label="Rotting deals warning" description="Highlight deals that haven't been updated in X days" checked={true} onChange={() => {}} />
        <ToggleRow label="Weighted pipeline value" description="Calculate pipeline value using stage probability" checked={true} onChange={() => {}} />
      </SettingsGroup>

      <SettingsGroup title="Quotes" description="Quote and proposal behavior">
        <ToggleRow label="Auto-number quotes" description="Automatically generate sequential quote numbers" checked={true} onChange={() => {}} />
        <ToggleRow label="Default validity (30 days)" description="New quotes expire after 30 days by default" checked={true} onChange={() => {}} />
        <ToggleRow label="Require approval" description="Quotes need manager approval before sending" checked={false} onChange={() => {}} />
      </SettingsGroup>

      <SettingsGroup title="Notifications" description="Alerts and reminders">
        <ToggleRow label="Overdue activity alerts" description="Notify when activities pass their due date" checked={true} onChange={() => {}} />
        <ToggleRow label="Deal stage change alerts" description="Notify when deals move to a new stage" checked={false} onChange={() => {}} />
        <ToggleRow label="New lead notification" description="Alert team when a new lead is captured" checked={true} onChange={() => {}} />
      </SettingsGroup>
    </div>
  )
}
