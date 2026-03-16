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
    <div className="flex h-screen overflow-hidden bg-background">
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
        />
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Optional topbar content (page title, etc.) */}
        {topbarContent && (
          <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
            {topbarContent}
          </header>
        )}

        <main
          className={cn(
            'flex-1 overflow-y-auto',
            isMobile && 'pb-16'
          )}
        >
          {children}
        </main>
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
