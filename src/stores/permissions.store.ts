import { create } from 'zustand'
import type { FeatureDeclaration, PermissionProfile } from '../types/permissions'

interface PermissionsStore {
  features: FeatureDeclaration[]
  profiles: PermissionProfile[]
  currentProfile: PermissionProfile | null

  setFeatures: (f: FeatureDeclaration[]) => void
  setProfiles: (p: PermissionProfile[]) => void
  setCurrentProfile: (p: PermissionProfile | null) => void
  reset: () => void
}

export const usePermissionsStore = create<PermissionsStore>((set) => ({
  features: [],
  profiles: [],
  currentProfile: null,

  setFeatures: (features) => set({ features }),
  setProfiles: (profiles) => set({ profiles }),
  setCurrentProfile: (currentProfile) => set({ currentProfile }),
  reset: () => set({ features: [], profiles: [], currentProfile: null }),
}))
