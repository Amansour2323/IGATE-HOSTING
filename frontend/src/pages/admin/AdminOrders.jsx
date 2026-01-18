import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../../App";
import AdminLayout from "./AdminLayout";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";
import { ShoppingCart, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/admin/orders`, { withCredentials: true });
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/admin/orders/${orderId}/status?status=${status}`, {}, { withCredentials: true });
      toast.success("تم تحديث حالة الطلب");
      fetchOrders();
    } catch (error) {
      toast.error("فشل في تحديث الحالة");
    }
  };

  const getStatusBadge = (status, type = "order") => {
    const configs = {
      order: {
        pending: { label: "قيد الانتظار", variant: "secondary", icon: Clock },
        processing: { label: "جاري المعالجة", variant: "default", icon: AlertCircle },
        completed: { label: "مكتمل", variant: "success", icon: CheckCircle },
        cancelled: { label: "ملغي", variant: "destructive", icon: XCircle }
      },
      payment: {
        pending: { label: "غير مدفوع", variant: "secondary", icon: Clock },
        paid: { label: "مدفوع", variant: "success", icon: CheckCircle },
        failed: { label: "فشل", variant: "destructive", icon: XCircle },
        refunded: { label: "مسترد", variant: "outline", icon: AlertCircle }
      }
    };
    
    const config = configs[type][status] || configs[type].pending;
    return (
      <Badge variant={config.variant} className="gap-1">
        <config.icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

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
      <div data-testid="admin-orders">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">إدارة الطلبات</h1>
          <p className="text-muted-foreground">عرض وإدارة جميع طلبات العملاء</p>
        </motion.div>

        <Card>
          <CardContent className="p-0">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد طلبات حتى الآن</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>المنتج</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>حالة الدفع</TableHead>
                    <TableHead>حالة الطلب</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.order_id}>
                      <TableCell className="font-mono text-sm">{order.order_id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer_name}</div>
                          <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{order.product_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.plan_duration === "monthly" ? "شهري" : "سنوي"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{order.amount} {order.currency}</TableCell>
                      <TableCell>{getStatusBadge(order.payment_status, "payment")}</TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.order_id, value)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">قيد الانتظار</SelectItem>
                            <SelectItem value="processing">جاري المعالجة</SelectItem>
                            <SelectItem value="completed">مكتمل</SelectItem>
                            <SelectItem value="cancelled">ملغي</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
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
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
