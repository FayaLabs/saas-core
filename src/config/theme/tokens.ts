export interface ThemeTokens {
  name: string
  colors: SemanticColors
  perception: UIPerceptionTokens
}

export interface SemanticColors {
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  accent: string
  accentForeground: string
  background: string
  foreground: string
  card: string
  cardForeground: string
  muted: string
  mutedForeground: string
  border: string
  input: string
  ring: string
  destructive: string
  destructiveForeground: string
  success: string
  successForeground: string
  warning: string
  warningForeground: string
}

export interface UIPerceptionTokens {
  buttonRadius: string
  cardRadius: string
  inputRadius: string
  modalRadius: string
  fontFamily: string
  fontFamilyMono: string
  shadowSm: string
  shadowMd: string
  shadowLg: string
}
