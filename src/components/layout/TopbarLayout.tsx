import * as React from 'react'
import { Topbar } from './Topbar'
import { MobileDrawer } from './MobileDrawer'
import { BottomNav } from './BottomNav'
import { PrintHeader, PrintFooter } from './PrintChrome'
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
  children?: NavigationItem[]
}

interface TopbarLayoutProps {
  navigation: NavigationItem[]
  logo?: React.ReactNode
  children: React.ReactNode
  user?: { fullName: string; avatarUrl?: string; email: string }
  onNavigate?: (route: string) => void
  onSignOut?: () => void
  onProfile?: () => void
  onSettings?: () => void
  onBilling?: () => void
  userMenuExtras?: { label: string; icon?: React.ReactNode; onClick: () => void }[]
  leftContent?: React.ReactNode
  rightContent?: React.ReactNode
  frame?: boolean
  bottomNavItems?: Array<{ label: string; icon: string; route: string }>
}

export function TopbarLayout({
  navigation,
  logo,
  children,
  user,
  onNavigate,
  onSignOut,
  onProfile,
  onSettings,
  onBilling,
  userMenuExtras,
  leftContent,
  rightContent,
  frame,
  bottomNavItems,
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
    <div className={cn('flex h-screen flex-col overflow-hidden print-root', showFrame ? 'bg-sidebar' : 'bg-content')}>
      <Topbar
        navigation={navigation}
        logo={logo}
        user={user}
        onMenuClick={toggleMobileDrawer}
        leftContent={leftContent}
        rightContent={rightContent}
      />

      <PrintHeader />
      {showFrame ? (
        <div className="flex flex-1 flex-col overflow-hidden p-3 print-content">
          <main className="flex-1 overflow-y-auto rounded-[1.25rem] bg-content p-6">
            {children}
          </main>
        </div>
      ) : (
        <main className={cn('flex-1 overflow-y-auto px-6 py-6 print-content', isMobile && 'pb-20')}>{children}</main>
      )}
      <PrintFooter />

      {isMobile && (
        <BottomNav
          navigation={navigation}
          activeRoute={currentPath}
          onNavigate={handleNavigate}
          customItems={bottomNavItems}
        />
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
        user={user}
        onSignOut={onSignOut}
        onProfile={onProfile}
        onSettings={onSettings}
        onBilling={onBilling}
        userMenuExtras={userMenuExtras}
      />
    </div>
  )
}
