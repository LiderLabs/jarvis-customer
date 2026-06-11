'use client';

import { ReactNode, useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { useQuery, useConvexAuth } from 'convex/react';
import { api } from '@jordan6699/washlab-backend/api';
import { useCurrentCustomer } from '@/hooks/use-current-customer';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  Package,
  Bell,
  User,
  LogOut,
  Menu,
  Sun,
  Moon,
  ChevronRight,
  AlertCircle,
  CreditCard,
  Award,
} from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

const MobileMenuContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

export const useMobileMenu = () => useContext(MobileMenuContext);

interface CustomerLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/orders', label: 'My Orders', icon: Package },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/loyalty', label: 'Loyalty Points', icon: Award },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
];

interface SidebarContentProps {
  pathname: string;
  unreadCount: number;
  setMobileMenuOpen: (open: boolean) => void;
  clerkUser: { imageUrl?: string } | null | undefined;
  displayName: string;
  displayEmail: string | undefined;
  userInitials: string;
  signOut: (callback?: () => void) => void;
}

function SidebarContent({
  pathname,
  unreadCount,
  setMobileMenuOpen,
  clerkUser,
  displayName,
  displayEmail,
  userInitials,
  signOut,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center">
          <Image 
            src="/assets/washlab logo-light.png" 
            alt="Rapid Wash" 
            width={160}
            height={48}
            className="h-12 w-auto block dark:hidden"
            priority
          />
          <Image 
            src="/assets/washlab logo-dark.png" 
            alt="Rapid Wash" 
            width={160}
            height={48}
            className="h-12 w-auto hidden dark:block"
            priority
          />
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const showBadge = item.href === '/dashboard/notifications' && unreadCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                {showBadge ? (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1.5 flex items-center justify-center text-xs font-semibold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                ) : isActive ? (
                  <ChevronRight className="h-4 w-4" />
                ) : null}
              </Link>
            );
          })}
        </div>

        <Separator className="my-4" />

        {/* Quick Action */}
        <Link href="/order">
          <Button className="w-full" size="sm" onClick={() => setMobileMenuOpen(false)}>
            <Package className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </Link>
      </ScrollArea>

      {/* User Profile in Sidebar (Desktop) */}
      <div className="hidden border-t p-4 md:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={clerkUser?.imageUrl} alt={displayName} />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left text-sm">
                <p className="font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {displayEmail}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            {/* <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem> */}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                signOut(() => {
                  window.location.href = '/';
                });
              }}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { clerkUser, convexUser, isLoading, isBlocked, isSuspended, needsProfileCompletion } = useCurrentCustomer();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated: isConvexAuthenticated } = useConvexAuth();

  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    isConvexAuthenticated && convexUser ? {} : "skip"
  ) ?? 0;

  const userInitials =
    clerkUser?.firstName?.[0] && clerkUser?.lastName?.[0]
      ? `${clerkUser.firstName[0]}${clerkUser.lastName[0]}`
      : clerkUser?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || 'U';
  
  // If user needs to complete profile, render children directly (for complete-profile page)
  if (needsProfileCompletion || pathname === '/dashboard/complete-profile') {
    return <>{children}</>;
  }
  
  const displayName = convexUser?.name || clerkUser?.fullName || 'User';
  const displayEmail = convexUser?.email || clerkUser?.primaryEmailAddress?.emailAddress;

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className='text-muted-foreground text-center mt-1'>Loading... please wait</p>
      </div>
    );
  }

  // Show blocked/suspended message
  if (isBlocked || isSuspended) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Account {isBlocked ? 'Blocked' : 'Suspended'}</h1>
          <p className="text-muted-foreground mb-4">
            {isBlocked
              ? 'Your account has been blocked. Please contact support for assistance.'
              : 'Your account has been temporarily suspended. Please contact support for more information.'}
          </p>
          <Button variant="outline" onClick={() => signOut(() => { window.location.href = '/'; })}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  const sidebarProps = {
    pathname,
    unreadCount,
    setMobileMenuOpen,
    clerkUser,
    displayName,
    displayEmail,
    userInitials,
    signOut,
  };

  return (
    <MobileMenuContext.Provider value={{ open: mobileMenuOpen, setOpen: setMobileMenuOpen }}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 border-r md:block">
          <SidebarContent {...sidebarProps} />
        </aside>

        {/* Mobile Sidebar - Using Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-64 p-0 sm:max-w-sm [&>button]:hidden">
            <SidebarContent {...sidebarProps} />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1" />

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>

              {/* Notification Bell */}
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => router.push('/dashboard/notifications')}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center p-0 text-[10px] font-semibold"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>

              {/* Mobile User Menu */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={clerkUser?.imageUrl} alt={displayName} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {displayEmail}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    {/* <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem> */}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        signOut(() => {
                          window.location.href = '/';
                        });
                      }}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-4 md:p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </div>
    </MobileMenuContext.Provider>
  );
}
