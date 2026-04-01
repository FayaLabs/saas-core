import React from 'react'
import { SettingsGroup, ToggleRow } from '../../../components/plugins/SettingsGroup'
import { useTranslation } from '../../../hooks/useTranslation'

export function AgendaGeneralSettings() {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <SettingsGroup title={t('agenda.settings.scheduling')} description={t('agenda.settings.schedulingDesc')}>
        <ToggleRow label={t('agenda.settings.conflictDetection')} description={t('agenda.settings.conflictDetectionDesc')} checked={true} onChange={() => {}} />
        <ToggleRow label={t('agenda.settings.dragDrop')} description={t('agenda.settings.dragDropDesc')} checked={true} onChange={() => {}} />
        <ToggleRow label={t('agenda.settings.autoCreateOrder')} description={t('agenda.settings.autoCreateOrderDesc')} checked={true} onChange={() => {}} />
      </SettingsGroup>

      <SettingsGroup title={t('agenda.settings.locations')} description={t('agenda.settings.locationsDesc')}>
        <ToggleRow label={t('agenda.settings.enableLocation')} description={t('agenda.settings.enableLocationDesc')} checked={false} onChange={() => {}} />
      </SettingsGroup>

      <SettingsGroup title={t('agenda.settings.workingHours')} description={t('agenda.settings.workingHoursDesc')}>
        <ToggleRow label={t('agenda.settings.enableWorkingHours')} description={t('agenda.settings.enableWorkingHoursDesc')} checked={true} onChange={() => {}} />
        <ToggleRow label={t('agenda.settings.blockOutside')} description={t('agenda.settings.blockOutsideDesc')} checked={false} onChange={() => {}} />
      </SettingsGroup>

      <SettingsGroup title={t('agenda.settings.confirmations')} description={t('agenda.settings.confirmationsDesc')}>
        <ToggleRow label={t('agenda.settings.enableConfirmations')} description={t('agenda.settings.enableConfirmationsDesc')} checked={true} onChange={() => {}} />
        <ToggleRow label={t('agenda.settings.autoConfirm')} description={t('agenda.settings.autoConfirmDesc')} checked={false} onChange={() => {}} />
        <ToggleRow label={t('agenda.settings.reminder')} description={t('agenda.settings.reminderDesc')} checked={true} onChange={() => {}} />
      </SettingsGroup>

      <SettingsGroup title={t('agenda.settings.calendarDisplay')} description={t('agenda.settings.calendarDisplayDesc')}>
        <ToggleRow label={t('agenda.settings.showCancelled')} description={t('agenda.settings.showCancelledDesc')} checked={false} onChange={() => {}} />
        <ToggleRow label={t('agenda.settings.showNoShow')} description={t('agenda.settings.showNoShowDesc')} checked={true} onChange={() => {}} />
        <ToggleRow label={t('agenda.settings.compact')} description={t('agenda.settings.compactDesc')} checked={false} onChange={() => {}} />
      </SettingsGroup>

      <SettingsGroup title={t('agenda.settings.notifications')} description={t('agenda.settings.notificationsDesc')}>
        <ToggleRow label={t('agenda.settings.newBookingNotif')} description={t('agenda.settings.newBookingNotifDesc')} checked={true} onChange={() => {}} />
        <ToggleRow label={t('agenda.settings.cancelAlerts')} description={t('agenda.settings.cancelAlertsDesc')} checked={true} onChange={() => {}} />
        <ToggleRow label={t('agenda.settings.noShowTracking')} description={t('agenda.settings.noShowTrackingDesc')} checked={false} onChange={() => {}} />
      </SettingsGroup>
    </div>
  )
}
