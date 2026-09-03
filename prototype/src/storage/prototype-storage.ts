import type { OnboardingConfig, SavedSnapshot } from '../types/onboarding'

const CONFIG_KEY = 'bobhanggi:onboarding-lab:config:v3'
const SNAPSHOT_KEY = 'bobhanggi:onboarding-lab:snapshots:v1'

export const loadConfig = (): OnboardingConfig | null => {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    return raw ? (JSON.parse(raw) as OnboardingConfig) : null
  } catch {
    return null
  }
}

export const saveConfig = (config: OnboardingConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

export const clearConfig = () => localStorage.removeItem(CONFIG_KEY)

export const loadSnapshots = (): SavedSnapshot[] => {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    return raw ? (JSON.parse(raw) as SavedSnapshot[]) : []
  } catch {
    return []
  }
}

export const saveSnapshots = (snapshots: SavedSnapshot[]) => {
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots.slice(0, 12)))
}

export const isOnboardingConfig = (value: unknown): value is OnboardingConfig => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<OnboardingConfig>
  return (
    candidate.schemaVersion === 1 &&
    Boolean(candidate.brand) &&
    Boolean(candidate.matchingMode) &&
    Boolean(candidate.commonSignup) &&
    Boolean(candidate.firstImpression) &&
    Boolean(candidate.values) &&
    Array.isArray(candidate.values?.questions) &&
    Boolean(candidate.design)
  )
}
