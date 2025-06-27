// app/admin/AdminSidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GitGraph, Users, Map, Settings, Home, Menu, X, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Dashboard', href: '/admin', icon: Home },
  { title: 'Plots', href: '/admin/plots', icon: GitGraph },
  { title: 'Users', href: '/admin/users', icon: Users },
  { title: 'Maps', href: '/admin/maps', icon: Map },
  { title: 'Map Editor', href: '/admin/map-editor', icon: Settings },
  { title: 'Export Map', href: '/admin/export-map', icon: Globe }, // Changed to Globe for export
  { title: 'Community', href: '/admin/community', icon: Users }, // Changed to Users for community
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false); // Default to closed on mobile

  // Effect to close sidebar on mobile when navigating
  React.useEffect(() => {
    if (sidebarOpen && window.innerWidth < 768) { // 768px is md breakpoint for Tailwind by default
      setSidebarOpen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // Only run when pathname changes

  return (
    <>
      {/* Mobile sidebar toggle button: Positioned by parent, or fixed within its own context */}
      <div className="fixed top-4 left-4 z-40 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-lg transition-transform duration-200 ease-in-out md:relative md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="px-4 py-6 border-b">
            <h1 className="text-2xl font-semibold">Admin Panel</h1>
            <p className="text-sm text-gray-500">Vibe Coder's Community</p>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = (pathname === item.href) || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center px-2 py-2 text-sm font-medium rounded-md group',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5',
                      isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                    )}
                  />
                  {item.title}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t">
            <Link href="/">
              <Button variant="outline" className="w-full">
                Back to Site
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}