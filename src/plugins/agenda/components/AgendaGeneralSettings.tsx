import React from 'react'
import { SettingsGroup, ToggleRow } from '../../../components/plugins/SettingsGroup'

export function AgendaGeneralSettings() {
  return (
    <div className="space-y-4">
      <SettingsGroup title="Scheduling" description="Calendar behavior and booking preferences">
        <ToggleRow label="Conflict detection" description="Warn when appointments overlap for the same professional" checked={true} onChange={() => {}} />
        <ToggleRow label="Drag and drop rescheduling" description="Allow dragging appointments to reschedule on the calendar" checked={true} onChange={() => {}} />
        <ToggleRow label="Auto-create service order" description="Create a financial record when booking is completed" checked={true} onChange={() => {}} />
      </SettingsGroup>

      <SettingsGroup title="Locations" description="Room and location assignment for schedules and bookings">
        <ToggleRow label="Enable location selection" description="Assign locations to schedules and bookings" checked={false} onChange={() => {}} />
      </SettingsGroup>

      <SettingsGroup title="Working Hours" description="Staff schedule and availability">
        <ToggleRow label="Enable working hours" description="Manage staff availability and show non-working hours on calendar" checked={true} onChange={() => {}} />
        <ToggleRow label="Block outside hours" description="Prevent booking outside of defined working hours" checked={false} onChange={() => {}} />
      </SettingsGroup>

      <SettingsGroup title="Confirmations" description="Appointment reminders and confirmations">
        <ToggleRow label="Enable confirmations" description="Send reminders and track confirmation status" checked={true} onChange={() => {}} />
        <ToggleRow label="Auto-confirm new bookings" description="Automatically mark new appointments as confirmed" checked={false} onChange={() => {}} />
        <ToggleRow label="Reminder before appointment" description="Send a reminder notification before the appointment" checked={true} onChange={() => {}} />
      </SettingsGroup>

      <SettingsGroup title="Calendar Display" description="Visual preferences for the agenda view">
        <ToggleRow label="Show cancelled appointments" description="Display cancelled bookings on the calendar (dimmed)" checked={false} onChange={() => {}} />
        <ToggleRow label="Show no-show appointments" description="Display no-show bookings on the calendar" checked={true} onChange={() => {}} />
        <ToggleRow label="Compact time slots" description="Use smaller time slots for a denser calendar view" checked={false} onChange={() => {}} />
      </SettingsGroup>

      <SettingsGroup title="Notifications" description="Alerts for staff and management">
        <ToggleRow label="New booking notification" description="Notify when a new appointment is created" checked={true} onChange={() => {}} />
        <ToggleRow label="Cancellation alerts" description="Alert when a client cancels an appointment" checked={true} onChange={() => {}} />
        <ToggleRow label="No-show tracking" description="Flag clients who frequently miss appointments" checked={false} onChange={() => {}} />
      </SettingsGroup>
    </div>
  )
}
