'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
    LogOut, BarChart2, Settings, UserCog, Building, FileText, Palette, 
    ChevronLeft, ChevronRight, Menu 
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

// Import Components Baru
import { DashboardTab } from '@/features/admin/components/DashboardTab';
import { StaffTab } from '@/features/admin/components/StaffTab';
import { CounterTab } from '@/features/admin/components/CounterTab';
import { ServiceTab } from '@/features/admin/components/ServiceTab';
import { DisplayTab } from '@/features/admin/components/DisplayTab';
import { ReportTab } from '@/features/admin/components/ReportTab';

const navItems = [
    { id: 'dashboard', label: 'Dasbor', icon: BarChart2 },
    { id: 'staff', label: 'Pengguna', icon: UserCog },
    { id: 'counters', label: 'Loket', icon: Building },
    { id: 'services', label: 'Layanan', icon: Settings },
    { id: 'display', label: 'Tampilan', icon: Palette },
    { id: 'reports', label: 'Laporan', icon: FileText },
];

export default function AdminPage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Proteksi Halaman
  React.useEffect(() => {
    if (!isLoading && !user) {
        router.push('/login');
    } else if (!isLoading && user && user.role !== 'ADMIN') {
        toast({ variant: "destructive", title: "Akses Ditolak", description: "Hanya admin yang dapat mengakses halaman ini." });
        router.push('/staff'); // Redirect staff ke halaman staff
    }
  }, [user, isLoading, router, toast]);

  const handleLogout = async () => {
    await logout();
  };

  const renderContent = () => {
    switch(activeTab) {
        case 'dashboard': return <DashboardTab />;
        case 'staff': return <StaffTab />;
        case 'counters': return <CounterTab />;
        case 'services': return <ServiceTab />;
        case 'display': return <DisplayTab />;
        case 'reports': return <ReportTab />;
        default: return <DashboardTab />;
    }
  }

  if (isLoading || !user) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Memuat data...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Desktop */}
      <aside className={cn(
        "bg-card text-card-foreground border-r transition-all duration-300 ease-in-out",
        "flex-col hidden lg:flex",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="flex items-center justify-between h-20 border-b px-4">
             <Link href="/" className={cn("transition-opacity duration-300", !isSidebarOpen && "opacity-0 pointer-events-none")}>
                <Image
                  src="/qnext-logo.svg"
                  alt="Qnext Logo"
                  width={140}
                  height={44}
                />
            </Link>
             <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="ml-auto">
                 {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
            </Button>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
            {navItems.map(item => (
                <Button
                    key={item.id}
                    variant={activeTab === item.id ? 'secondary' : 'ghost'}
                    className={cn(
                        "w-full justify-start",
                        !isSidebarOpen && "justify-center"
                    )}
                    onClick={() => setActiveTab(item.id)}
                >
                    <item.icon className="h-5 w-5"/>
                    <span className={cn(isSidebarOpen ? "ml-4" : "sr-only")}>{item.label}</span>
                </Button>
            ))}
        </nav>
        <div className="px-4 py-4 border-t">
            <Button variant="outline" onClick={handleLogout} className="w-full justify-center">
                <LogOut className="h-5 w-5"/>
                <span className={cn(isSidebarOpen ? "ml-4" : "sr-only")}>Logout</span>
            </Button>
             <div className={cn("mt-4 text-center text-xs text-muted-foreground", !isSidebarOpen && "sr-only")}>
                <p>Login sebagai</p>
                <p className="font-semibold truncate">{user.email}</p>
            </div>
        </div>
      </aside>

      {/* Main Content */}
       <div className="flex-1 flex flex-col h-screen overflow-hidden">
            {/* Header Mobile */}
            <header className="bg-card shadow-sm z-10 lg:hidden h-20 flex items-center px-4 justify-between shrink-0">
                 <div className="flex items-center gap-4">
                    <Image
                      src="/qnext-logo.svg"
                      alt="Qnext Logo"
                      width={128}
                      height={40}
                    />
                </div>
                 <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    <Menu/>
                </Button>
            </header>
            
            {/* Mobile Menu Overlay */}
             {isMobileMenuOpen && (
                <div className="lg:hidden bg-card border-b absolute top-20 w-full z-20 shadow-lg">
                    <nav className="flex flex-col p-4 space-y-1">
                         {navItems.map(item => (
                            <Button
                                key={item.id}
                                variant={activeTab === item.id ? 'secondary' : 'ghost'}
                                className="w-full justify-start"
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setIsMobileMenuOpen(false);
                                }}
                            >
                                <item.icon className="mr-2"/>
                                <span>{item.label}</span>
                            </Button>
                        ))}
                         <Button variant="outline" onClick={handleLogout} className="w-full justify-start">
                             <LogOut className="mr-2"/>
                            <span>Logout</span>
                        </Button>
                    </nav>
                </div>
            )}

            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
               {renderContent()}
            </main>
        </div>
    </div>
  );
}