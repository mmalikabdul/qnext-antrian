'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
    LogOut, BarChart2, Settings, UserCog, Building, FileText, Palette, 
    ChevronLeft, ChevronRight, Menu, CalendarClock, ChevronDown 
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// Import Components Baru
import { DashboardTab } from '@/features/admin/components/DashboardTab';
import { StaffTab } from '@/features/admin/components/StaffTab';
import { CounterTab } from '@/features/admin/components/CounterTab';
import { ServiceTab } from '@/features/admin/components/ServiceTab';
import { DisplayTab } from '@/features/admin/components/DisplayTab';
import { ReportTab } from '@/features/admin/components/ReportTab';
import { GuestTab } from '@/features/admin/components/GuestTab';
import { HolidayTab } from '@/features/admin/components/HolidayTab';
import { WorkingHoursTab } from '@/features/admin/components/WorkingHoursTab';

type NavItem = {
    id: string;
    label: string;
    icon: any;
    children?: { id: string; label: string }[];
};

const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dasbor', icon: BarChart2 },
    { id: 'guests', label: 'Daftar Tamu', icon: FileText },
    { id: 'staff', label: 'Pengguna', icon: UserCog },
    { 
        id: 'operational', 
        label: 'Service', 
        icon: CalendarClock,
        children: [
            { id: 'holidays', label: 'Hari Libur' },
            { id: 'working-hours', label: 'Jam Kerja' }
        ]
    },
    { id: 'services', label: 'Master Layanan', icon: Settings },
    { id: 'counters', label: 'Loket', icon: Building },
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
  
  // State untuk expand/collapse menu operational
  const [isOperationalOpen, setIsOperationalOpen] = React.useState(false);

  // Proteksi Halaman
  React.useEffect(() => {
    if (!isLoading && !user) {
        router.push('/login');
    } else if (!isLoading && user && user.role !== 'ADMIN') {
        toast({ variant: "destructive", title: "Akses Ditolak", description: "Hanya admin yang dapat mengakses halaman ini." });
        router.push('/staff'); 
    }
  }, [user, isLoading, router, toast]);

  const handleLogout = async () => {
    await logout();
  };

  const renderContent = () => {
    switch(activeTab) {
        case 'dashboard': return <DashboardTab />;
        case 'guests': return <GuestTab />;
        case 'staff': return <StaffTab />;
        case 'holidays': return <HolidayTab />;
        case 'working-hours': return <WorkingHoursTab />;
        case 'counters': return <CounterTab />;
        case 'services': return <ServiceTab />;
        case 'display': return <DisplayTab />;
        case 'reports': return <ReportTab />;
        default: return <DashboardTab />;
    }
  }

  // Render Nav Item Helper
  const renderNavItem = (item: NavItem) => {
      if (item.children) {
          return (
            <Collapsible 
                key={item.id} 
                open={isOperationalOpen} 
                onOpenChange={setIsOperationalOpen}
                className="w-full"
            >
                <CollapsibleTrigger asChild>
                    <Button
                        variant={(activeTab === 'holidays' || activeTab === 'working-hours') ? 'secondary' : 'ghost'}
                        className={cn(
                            "w-full justify-between group",
                            !isSidebarOpen && "justify-center"
                        )}
                    >
                        <div className="flex items-center">
                            <item.icon className="h-5 w-5"/>
                            <span className={cn(isSidebarOpen ? "ml-4" : "sr-only")}>{item.label}</span>
                        </div>
                        {isSidebarOpen && (
                            <ChevronDown className={cn(
                                "h-4 w-4 transition-transform duration-200", 
                                isOperationalOpen ? "rotate-180" : ""
                            )}/>
                        )}
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1">
                    {item.children.map(child => (
                        <Button
                            key={child.id}
                            variant={activeTab === child.id ? 'secondary' : 'ghost'}
                            className={cn(
                                "w-full justify-start text-sm",
                                isSidebarOpen ? "pl-12" : "justify-center"
                            )}
                            onClick={() => setActiveTab(child.id)}
                        >
                            {isSidebarOpen ? child.label : (child.label[0])} 
                        </Button>
                    ))}
                </CollapsibleContent>
            </Collapsible>
          );
      }

      return (
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
      );
  };

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
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {navItems.map(item => renderNavItem(item))}
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
                <div className="lg:hidden bg-card border-b absolute top-20 w-full z-20 shadow-lg h-[calc(100vh-5rem)] overflow-y-auto">
                    <nav className="flex flex-col p-4 space-y-1">
                         {navItems.map(item => {
                             if(item.children) {
                                 return (
                                     <div key={item.id} className="space-y-1">
                                         <div className="font-medium px-4 py-2 text-sm text-muted-foreground">{item.label}</div>
                                         {item.children.map(child => (
                                             <Button
                                                key={child.id}
                                                variant={activeTab === child.id ? 'secondary' : 'ghost'}
                                                className="w-full justify-start pl-8"
                                                onClick={() => {
                                                    setActiveTab(child.id);
                                                    setIsMobileMenuOpen(false);
                                                }}
                                            >
                                                <span>{child.label}</span>
                                            </Button>
                                         ))}
                                     </div>
                                 )
                             }
                             return (
                                <Button
                                    key={item.id}
                                    variant={activeTab === item.id ? 'secondary' : 'ghost'}
                                    className="w-full justify-start"
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        setIsMobileMenuOpen(false);
                                    }}
                                >
                                    <item.icon className="mr-2 h-5 w-5"/>
                                    <span>{item.label}</span>
                                </Button>
                             )
                         })}
                         <Button variant="outline" onClick={handleLogout} className="w-full justify-start mt-4">
                             <LogOut className="mr-2 h-5 w-5"/>
                            <span>Logout</span>
                        </Button>
                    </nav>
                </div>
            )}

            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-slate-50/50">
               {renderContent()}
            </main>
        </div>
    </div>
  );
}