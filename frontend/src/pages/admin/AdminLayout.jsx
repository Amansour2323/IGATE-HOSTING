import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../App";
import { Button } from "../../components/ui/button";
import { 
  Server, LayoutDashboard, Package, ShoppingCart, FileText, 
  MessageSquare, LogOut, ChevronLeft, Menu, X, Home, Settings 
} from "lucide-react";
import { useState } from "react";

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: "/admin", label: "لوحة التحكم", icon: LayoutDashboard, exact: true },
    { path: "/admin/products", label: "المنتجات", icon: Package },
    { path: "/admin/orders", label: "الطلبات", icon: ShoppingCart },
    { path: "/admin/invoices", label: "الفواتير", icon: FileText },
    { path: "/admin/messages", label: "الرسائل", icon: MessageSquare },
    { path: "/admin/settings", label: "الإعدادات", icon: Settings },
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-muted/30" data-testid="admin-layout">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 h-full w-64 bg-card border-l z-50 transform transition-transform lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b">
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Server className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Igate-host</span>
            </Link>
            <p className="text-sm text-muted-foreground mt-2">لوحة الإدارة</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path, item.exact)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                data-testid={`admin-nav-${item.path.split('/').pop() || 'dashboard'}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-4 px-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="font-semibold text-primary">
                  {user?.name?.charAt(0) || "A"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.name}</p>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Link to="/" className="block">
                <Button variant="outline" className="w-full gap-2 justify-start">
                  <Home className="w-4 h-4" />
                  الموقع الرئيسي
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                className="w-full gap-2 justify-start text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:mr-64">
        {/* Top Bar */}
        <header className="sticky top-0 bg-card/80 backdrop-blur-sm border-b z-30">
          <div className="flex items-center justify-between px-6 h-16">
            <button 
              className="lg:hidden p-2"
              onClick={() => setSidebarOpen(true)}
              data-testid="admin-menu-btn"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/admin" className="hover:text-foreground">لوحة التحكم</Link>
              {location.pathname !== "/admin" && (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>
                    {navItems.find(item => isActive(item.path))?.label || ""}
                  </span>
                </>
              )}
            </div>
            <div className="w-10 lg:hidden" />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
