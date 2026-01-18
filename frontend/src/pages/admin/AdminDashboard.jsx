import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../../App";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Calendar } from "../../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  ShoppingCart, Package, FileText, MessageSquare, 
  DollarSign, Users, TrendingUp, Clock, CalendarIcon,
  Download, Filter, BarChart3, ArrowUpRight, ArrowDownRight
} from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, reportRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { withCredentials: true }),
        axios.get(`${API}/admin/orders`, { withCredentials: true }),
        axios.get(`${API}/admin/sales-report?from_date=${dateRange.from.toISOString()}&to_date=${dateRange.to.toISOString()}`, { withCredentials: true })
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.slice(0, 5));
      setSalesReport(reportRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const quickDateRanges = [
    { label: "اليوم", from: new Date(), to: new Date() },
    { label: "آخر 7 أيام", from: subDays(new Date(), 7), to: new Date() },
    { label: "آخر 30 يوم", from: subDays(new Date(), 30), to: new Date() },
    { label: "هذا الشهر", from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
    { label: "هذه السنة", from: startOfYear(new Date()), to: new Date() },
  ];

  const exportReport = () => {
    if (!salesReport) return;
    
    const csvContent = [
      ["التقرير", "القيمة"],
      ["إجمالي المبيعات", salesReport.total_sales],
      ["عدد الطلبات", salesReport.orders_count],
      ["الطلبات المدفوعة", salesReport.paid_orders],
      ["الطلبات المعلقة", salesReport.pending_orders],
      ["متوسط قيمة الطلب", salesReport.average_order_value],
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales_report_${format(dateRange.from, "yyyy-MM-dd")}_${format(dateRange.to, "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: { label: "معلق", variant: "secondary" },
      paid: { label: "مدفوع", variant: "success" },
      completed: { label: "مكتمل", variant: "success" },
      cancelled: { label: "ملغي", variant: "destructive" },
      failed: { label: "فشل", variant: "destructive" }
    };
    const config = configs[status] || configs.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading && !stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = stats ? [
    { 
      title: "إجمالي الإيرادات", 
      value: `${stats.total_revenue.toLocaleString()} جنيه`, 
      icon: DollarSign, 
      color: "bg-green-500/10 text-green-500",
      change: salesReport?.revenue_change || 0
    },
    { 
      title: "إجمالي الطلبات", 
      value: stats.total_orders, 
      icon: ShoppingCart, 
      color: "bg-blue-500/10 text-blue-500",
      change: salesReport?.orders_change || 0
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
  ] : [];

  return (
    <AdminLayout>
      <div data-testid="admin-dashboard">
        {/* Header with Date Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">لوحة التحكم</h1>
            <p className="text-muted-foreground">نظرة عامة على أداء الموقع والمبيعات</p>
          </div>
          
          {/* Date Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2" data-testid="date-filter-btn">
                  <CalendarIcon className="w-4 h-4" />
                  {format(dateRange.from, "d MMM", { locale: ar })} - {format(dateRange.to, "d MMM yyyy", { locale: ar })}
                  <Filter className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="end">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {quickDateRanges.map((range) => (
                      <Button
                        key={range.label}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDateRange({ from: range.from, to: range.to });
                          setFilterOpen(false);
                        }}
                      >
                        {range.label}
                      </Button>
                    ))}
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">أو اختر تاريخ مخصص:</p>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-xs mb-1">من</p>
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                          locale={ar}
                        />
                      </div>
                      <div>
                        <p className="text-xs mb-1">إلى</p>
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                          locale={ar}
                        />
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => setFilterOpen(false)} className="w-full">
                    تطبيق الفلتر
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" onClick={exportReport} className="gap-2" data-testid="export-report-btn">
              <Download className="w-4 h-4" />
              تصدير التقرير
            </Button>
          </div>
        </motion.div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
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
                      {stat.change !== undefined && stat.change !== 0 && (
                        <div className={`flex items-center gap-1 text-sm mt-1 ${stat.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {stat.change > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          <span>{Math.abs(stat.change)}% من الفترة السابقة</span>
                        </div>
                      )}
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

        {/* Sales Report Section */}
        {salesReport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
          >
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  تقرير المبيعات
                </CardTitle>
                <CardDescription>
                  الفترة: {format(dateRange.from, "d MMMM yyyy", { locale: ar })} - {format(dateRange.to, "d MMMM yyyy", { locale: ar })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary">{salesReport.total_sales.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">إجمالي المبيعات (جنيه)</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{salesReport.orders_count}</p>
                    <p className="text-sm text-muted-foreground">عدد الطلبات</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-500">{salesReport.paid_orders}</p>
                    <p className="text-sm text-muted-foreground">طلبات مدفوعة</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{salesReport.average_order_value.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">متوسط قيمة الطلب</p>
                  </div>
                </div>

                {/* Daily Sales Breakdown */}
                {salesReport.daily_breakdown && salesReport.daily_breakdown.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">المبيعات اليومية</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {salesReport.daily_breakdown.map((day, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                          <span className="text-sm">{day.date}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">{day.orders} طلب</span>
                            <span className="font-medium">{day.amount.toLocaleString()} جنيه</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>إحصائيات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-purple-500" />
                    <span>المنتجات</span>
                  </div>
                  <span className="font-bold">{stats?.total_products || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-pink-500" />
                    <span>المستخدمين</span>
                  </div>
                  <span className="font-bold">{stats?.total_users || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-orange-500" />
                    <span>رسائل غير مقروءة</span>
                  </div>
                  <Badge variant={stats?.unread_messages > 0 ? "destructive" : "secondary"}>
                    {stats?.unread_messages || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-cyan-500" />
                    <span>الفواتير</span>
                  </div>
                  <span className="font-bold">{salesReport?.invoices_count || 0}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                آخر الطلبات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد طلبات حتى الآن
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الطلب</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>المنتج</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.order_id}>
                        <TableCell className="font-mono text-sm">{order.order_id}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell>{order.product_name}</TableCell>
                        <TableCell>{order.amount} جنيه</TableCell>
                        <TableCell>{getStatusBadge(order.payment_status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString("ar-EG")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
