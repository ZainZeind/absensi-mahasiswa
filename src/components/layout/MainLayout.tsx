import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  Users,
  BookOpen,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  User,
  Bell,
  Search
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
  badge?: string;
}

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: Home,
      roles: ['admin'],
    },
    {
      name: 'Dashboard',
      href: '/dosen/dashboard',
      icon: Home,
      roles: ['dosen'],
    },
    {
      name: 'Dashboard',
      href: '/mahasiswa/dashboard',
      icon: Home,
      roles: ['mahasiswa'],
    },
    {
      name: 'Data Master',
      href: '/admin/data-master',
      icon: Users,
      roles: ['admin'],
      badge: '5',
    },
    {
      name: 'Kelas Saya',
      href: '/dosen/kelas',
      icon: BookOpen,
      roles: ['dosen'],
    },
    {
      name: 'Kelas',
      href: '/mahasiswa/kelas',
      icon: BookOpen,
      roles: ['mahasiswa'],
    },
    {
      name: 'Sesi Absensi',
      href: '/dosen/sesi-absensi',
      icon: Calendar,
      roles: ['dosen'],
    },
    {
      name: 'Riwayat Absensi',
      href: '/mahasiswa/riwayat',
      icon: Calendar,
      roles: ['mahasiswa'],
    },
    {
      name: 'Laporan',
      href: '/admin/laporan',
      icon: BarChart3,
      roles: ['admin', 'dosen'],
    },
    {
      name: 'Perangkat',
      href: '/admin/perangkat',
      icon: Settings,
      roles: ['admin'],
    },
    {
      name: 'Profil',
      href: '/profile',
      icon: User,
    },
  ];

  const filteredNavigation = navigation.filter(item =>
    !item.roles || hasRole(item.roles)
  );

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (href: string) => {
    if (href === '/admin/dashboard' || href === '/dosen/dashboard' || href === '/mahasiswa/dashboard') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center space-x-3 p-6 border-b border-gray-200">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">FaceAbsensi</h1>
          <p className="text-xs text-gray-500">
            {user?.role === 'admin' && 'Administrator'}
            {user?.role === 'dosen' && `Dosen: ${user.profile?.nama}`}
            {user?.role === 'mahasiswa' && `Mahasiswa: ${user.profile?.nama}`}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <button
              key={item.name}
              onClick={() => {
                navigate(item.href);
                if (mobile) setSidebarOpen(false);
              }}
              className={`
                w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                ${active
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={() => {
            navigate('/profile');
            if (mobile) setSidebarOpen(false);
          }}
          className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
        >
          <Settings className="w-5 h-5" />
          <span>Pengaturan</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-80 p-0">
              <SidebarContent mobile />
            </SheetContent>
          </Sheet>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-80 lg:overflow-y-auto lg:bg-white lg:border-r lg:border-gray-200">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="lg:pl-80">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            {/* Left side - Mobile menu toggle */}
            <div className="flex items-center space-x-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <SidebarContent mobile />
                </SheetContent>
              </Sheet>

              {/* Search */}
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari data..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                  />
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">{user?.profile?.nama || user?.username}</div>
                  <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
                </div>
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-2">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;