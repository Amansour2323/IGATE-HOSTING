import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../../App";
import AdminLayout from "./AdminLayout";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { Switch } from "../../components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package } from "lucide-react";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    description_ar: "",
    description_en: "",
    category: "hosting",
    price_monthly: 0,
    price_yearly: 0,
    features: "",
    is_popular: false
  });

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products?active_only=false`, { withCredentials: true });
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      features: formData.features.split("\n").filter(f => f.trim())
    };

    try {
      if (editingProduct) {
        await axios.put(`${API}/admin/products/${editingProduct.product_id}`, payload, { withCredentials: true });
        toast.success("تم تحديث المنتج بنجاح");
      } else {
        await axios.post(`${API}/admin/products`, payload, { withCredentials: true });
        toast.success("تم إضافة المنتج بنجاح");
      }
      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || "حدث خطأ");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name_ar: product.name_ar,
      name_en: product.name_en,
      description_ar: product.description_ar,
      description_en: product.description_en,
      category: product.category,
      price_monthly: product.price_monthly,
      price_yearly: product.price_yearly,
      features: product.features.join("\n"),
      is_popular: product.is_popular
    });
    setDialogOpen(true);
  };

  const handleDelete = async (productId) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    
    try {
      await axios.delete(`${API}/admin/products/${productId}`, { withCredentials: true });
      toast.success("تم حذف المنتج");
      fetchProducts();
    } catch (error) {
      toast.error("فشل في حذف المنتج");
    }
  };

  const toggleActive = async (product) => {
    try {
      await axios.put(`${API}/admin/products/${product.product_id}`, {
        is_active: !product.is_active
      }, { withCredentials: true });
      fetchProducts();
    } catch (error) {
      toast.error("فشل في تحديث حالة المنتج");
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name_ar: "",
      name_en: "",
      description_ar: "",
      description_en: "",
      category: "hosting",
      price_monthly: 0,
      price_yearly: 0,
      features: "",
      is_popular: false
    });
  };

  const getCategoryLabel = (category) => {
    const labels = {
      hosting: "استضافة",
      design: "تصميم",
      marketing: "تسويق"
    };
    return labels[category] || category;
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
      <div data-testid="admin-products">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">المنتجات والخدمات</h1>
            <p className="text-muted-foreground">إدارة باقات الاستضافة والخدمات</p>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2" data-testid="add-product-btn">
            <Plus className="w-5 h-5" />
            إضافة منتج
          </Button>
        </motion.div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المنتج</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>السعر الشهري</TableHead>
                  <TableHead>السعر السنوي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.product_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{product.name_ar}</div>
                          <div className="text-sm text-muted-foreground">{product.name_en}</div>
                        </div>
                        {product.is_popular && <Badge variant="secondary">شائع</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryLabel(product.category)}</Badge>
                    </TableCell>
                    <TableCell>{product.price_monthly} جنيه</TableCell>
                    <TableCell>{product.price_yearly} جنيه</TableCell>
                    <TableCell>
                      <Switch
                        checked={product.is_active}
                        onCheckedChange={() => toggleActive(product)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(product)}
                          data-testid={`edit-product-${product.product_id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(product.product_id)}
                          data-testid={`delete-product-${product.product_id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}</DialogTitle>
              <DialogDescription>
                {editingProduct ? "قم بتعديل بيانات المنتج" : "أدخل بيانات المنتج الجديد"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم بالعربية</Label>
                  <Input
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>الاسم بالإنجليزية</Label>
                  <Input
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    required
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>الوصف بالعربية</Label>
                <Textarea
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>الوصف بالإنجليزية</Label>
                <Textarea
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  required
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>الفئة</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hosting">استضافة</SelectItem>
                      <SelectItem value="design">تصميم</SelectItem>
                      <SelectItem value="marketing">تسويق</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>السعر الشهري (جنيه)</Label>
                  <Input
                    type="number"
                    value={formData.price_monthly}
                    onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) })}
                    required
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>السعر السنوي (جنيه)</Label>
                  <Input
                    type="number"
                    value={formData.price_yearly}
                    onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) })}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>المميزات (كل ميزة في سطر)</Label>
                <Textarea
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  rows={5}
                  placeholder="5 GB SSD Storage&#10;10 GB Bandwidth&#10;Free SSL"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_popular}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                />
                <Label>منتج شائع (يظهر بشارة مميزة)</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingProduct ? "حفظ التغييرات" : "إضافة المنتج"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
