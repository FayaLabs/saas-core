import * as React from 'react'
import { Topbar } from './Topbar'
import { MobileDrawer } from './MobileDrawer'
import { useLayout } from '../../hooks/useLayout'
import { useRouter } from '../../lib/router'

interface NavigationItem {
  id: string
  label: string
  icon: string
  route: string
  section: 'main' | 'secondary' | 'settings'
  badge?: string | number
}

interface TopbarLayoutProps {
  navigation: NavigationItem[]
  logo?: React.ReactNode
  children: React.ReactNode
  user?: { fullName: string; avatarUrl?: string; email: string }
  onNavigate?: (route: string) => void
  rightContent?: React.ReactNode
}

export function TopbarLayout({
  navigation,
  logo,
  children,
  user,
  onNavigate,
  rightContent,
}: TopbarLayoutProps) {
  const { mobileDrawerOpen, toggleMobileDrawer } = useLayout()
  const router = useRouter()
  const currentPath = router.usePathname()

  const handleNavigate = (route: string) => {
    if (onNavigate) {
      onNavigate(route)
    } else {
      router.navigate(route)
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Topbar
        navigation={navigation}
        logo={logo}
        user={user}
        onMenuClick={toggleMobileDrawer}
        rightContent={rightContent}
      />

      <main className="flex-1 overflow-y-auto">{children}</main>

      <MobileDrawer
        open={mobileDrawerOpen}
        onOpenChange={(open) => {
          if (open !== mobileDrawerOpen) toggleMobileDrawer()
        }}
        navigation={navigation}
        logo={logo}
        activeRoute={currentPath}
        onNavigate={handleNavigate}
      />
    </div>
  )
}
