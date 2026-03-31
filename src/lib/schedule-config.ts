// ---------------------------------------------------------------------------
// Schedule Block Config Registry
// Lightweight global config — set by the agenda plugin, read by ScheduleEditor.
// No React context needed. Graceful degradation when not configured.
// ---------------------------------------------------------------------------

export interface ScheduleBlockConfig {
  defaults: {
    bufferMinutes: number
    maxConcurrent: number
    minAdvanceHours: number
    maxAdvanceDays: number
  }
  /** Available services for the multi-select filter. */
  services?: { id: string; name: string }[]
  showServices?: boolean
  showConcurrent?: boolean
  showBookingWindow?: boolean
}

let globalConfig: ScheduleBlockConfig | null = null

export function setScheduleBlockConfig(config: ScheduleBlockConfig): void {
  globalConfig = config
}

export function getScheduleBlockConfig(): ScheduleBlockConfig | null {
  return globalConfig
}
