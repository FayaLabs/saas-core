export interface IntegrationConfig {
  id: string
  name: string
  provider: string
  enabled: boolean
  credentials: Record<string, string>
  settings: Record<string, unknown>
}

export interface WebhookConfig {
  id: string
  url: string
  events: string[]
  secret: string
  active: boolean
}
