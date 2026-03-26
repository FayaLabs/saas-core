import * as React from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
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

interface SidebarLayoutProps {
  navigation: NavigationItem[]
  logo?: React.ReactNode
  children: React.ReactNode
  user?: { fullName: string; avatarUrl?: string; email: string }
  topbarContent?: React.ReactNode
  onNavigate?: (route: string) => void
  currentPath?: string
  onSignOut?: () => void
  onProfile?: () => void
  onSettings?: () => void
  onBilling?: () => void
  userMenuExtras?: { label: string; icon?: React.ReactNode; onClick: () => void }[]
  orgSwitcher?: React.ReactNode
  sidebarTopContent?: React.ReactNode
  sidebarFooterContent?: React.ReactNode
  /** When true, content floats in a rounded frame over the sidebar background */
  frame?: boolean
}

export function SidebarLayout({
  navigation,
  logo,
  children,
  user,
  topbarContent,
  onNavigate,
  currentPath: currentPathProp,
  onSignOut,
  onProfile,
  onSettings,
  onBilling,
  userMenuExtras,
  orgSwitcher,
  sidebarTopContent,
  sidebarFooterContent,
  frame,
}: SidebarLayoutProps) {
  const { sidebarCollapsed, setSidebarCollapsed, isMobile } = useLayout()
  const router = useRouter()
  const routerPath = router.usePathname()
  const currentPath = currentPathProp ?? routerPath

  const handleNavigate = (route: string) => {
    if (onNavigate) {
      onNavigate(route)
    } else {
      router.navigate(route)
    }
  }

  return (
    <div className={cn('flex h-screen overflow-hidden', isMobile || !frame ? 'bg-content' : 'bg-sidebar')}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar
          navigation={navigation}
          logo={logo}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onNavigate={handleNavigate}
          currentPath={currentPath}
          user={user}
          onSignOut={onSignOut}
          onProfile={onProfile}
          onSettings={onSettings}
          onBilling={onBilling}
          userMenuExtras={userMenuExtras}
          orgSwitcher={orgSwitcher}
          topContent={sidebarTopContent}
          footerContent={sidebarFooterContent}
        />
      )}

      {/* Main Content */}
      <div className={cn('flex flex-1 flex-col overflow-hidden', frame && !isMobile && 'p-3')}>
        <div className={cn('flex flex-1 flex-col overflow-hidden bg-content', frame && !isMobile && 'rounded-[1.25rem]')}>
          {/* Optional topbar content (page title, etc.) */}
          {topbarContent && (
            <header className="flex h-12 items-center justify-between border-b border-border/50 px-6">
              {topbarContent}
            </header>
          )}

          <main
            className={cn(
              'flex-1 overflow-y-auto p-6',
              isMobile && 'pb-16'
            )}
          >
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <BottomNav
          navigation={navigation}
          activeRoute={currentPath}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  )
}
