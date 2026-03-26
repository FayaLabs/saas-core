import * as React from 'react'
import { Topbar } from './Topbar'
import { MobileDrawer } from './MobileDrawer'
import { useLayout } from '../../hooks/useLayout'
import { useRouter } from '../../lib/router'
import { cn } from '../../lib/cn'

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
  leftContent?: React.ReactNode
  rightContent?: React.ReactNode
  frame?: boolean
}

export function TopbarLayout({
  navigation,
  logo,
  children,
  user,
  onNavigate,
  leftContent,
  rightContent,
  frame,
}: TopbarLayoutProps) {
  const { mobileDrawerOpen, toggleMobileDrawer, isMobile } = useLayout()
  const router = useRouter()
  const currentPath = router.usePathname()

  const handleNavigate = (route: string) => {
    if (onNavigate) {
      onNavigate(route)
    } else {
      router.navigate(route)
    }
  }

  const showFrame = frame && !isMobile

  return (
    <div className={cn('flex h-screen flex-col overflow-hidden', showFrame ? 'bg-sidebar' : 'bg-content')}>
      <Topbar
        navigation={navigation}
        logo={logo}
        user={user}
        onMenuClick={toggleMobileDrawer}
        leftContent={leftContent}
        rightContent={rightContent}
      />

      {showFrame ? (
        <div className="flex flex-1 flex-col overflow-hidden p-3">
          <main className="flex-1 overflow-y-auto rounded-[1.25rem] bg-content p-6">
            {children}
          </main>
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
      )}

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
