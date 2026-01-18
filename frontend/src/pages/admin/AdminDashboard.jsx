import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../../App";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { 
  ShoppingCart, Package, FileText, MessageSquare, 
  DollarSign, Users, TrendingUp, Clock 
} from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API}/admin/stats`, { withCredentials: true });
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = stats ? [
    { 
      title: "إجمالي الإيرادات", 
      value: `${stats.total_revenue.toLocaleString()} جنيه`, 
      icon: DollarSign, 
      color: "bg-green-500/10 text-green-500" 
    },
    { 
      title: "إجمالي الطلبات", 
      value: stats.total_orders, 
      icon: ShoppingCart, 
      color: "bg-blue-500/10 text-blue-500" 
    },
    { 
      title: "الطلبات المدفوعة", 
      value: stats.paid_orders, 
      icon: TrendingUp, 
      color: "bg-emerald-500/10 text-emerald-500" 
    },
    { 
      title: "الطلبات المعلقة", 
      value: stats.pending_orders, 
      icon: Clock, 
      color: "bg-yellow-500/10 text-yellow-500" 
    },
    { 
      title: "المنتجات", 
      value: stats.total_products, 
      icon: Package, 
      color: "bg-purple-500/10 text-purple-500" 
    },
    { 
      title: "المستخدمين", 
      value: stats.total_users, 
      icon: Users, 
      color: "bg-pink-500/10 text-pink-500" 
    },
    { 
      title: "الرسائل غير المقروءة", 
      value: stats.unread_messages, 
      icon: MessageSquare, 
      color: "bg-orange-500/10 text-orange-500" 
    },
  ] : [];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div data-testid="admin-dashboard">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">لوحة التحكم</h1>
          <p className="text-muted-foreground">نظرة عامة على أداء الموقع</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.slice(0, 4).map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.slice(4).map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index + 4) * 0.1 }}
            >
              <Card className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
