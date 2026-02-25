import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ShoppingBag, Tag, MapPin, X, Camera, Search, Filter } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const CATEGORIES = ["Electronics", "Furniture", "Clothing", "Books", "Kitchen", "Garden", "Sports", "Other"];
const CONDITIONS = ["Like New", "Good", "Fair", "Used"];

interface Product {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  condition: string;
  image_url: string | null;
  location: string | null;
  is_sold: boolean;
  created_at: string;
}

export default function Marketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Other");
  const [condition, setCondition] = useState("Used");
  const [location, setLocation] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("marketplace_products")
      .select("*")
      .eq("is_sold", false)
      .order("created_at", { ascending: false });
    if (!error && data) setProducts(data as Product[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) { toast.error("Please log in first."); return; }
    setSubmitting(true);

    let imageUrl: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("marketplace-images").upload(path, imageFile);
      if (uploadError) { toast.error("Image upload failed."); setSubmitting(false); return; }
      const { data: publicData } = supabase.storage.from("marketplace-images").getPublicUrl(path);
      imageUrl = publicData.publicUrl;
    }

    const { error } = await supabase.from("marketplace_products").insert({
      user_id: userId,
      title: title.trim(),
      description: description.trim() || null,
      price: parseFloat(price),
      category,
      condition,
      location: location.trim() || null,
      image_url: imageUrl,
    });

    if (error) { toast.error("Failed to list product."); }
    else {
      toast.success("Product listed!");
      setDialogOpen(false);
      setTitle(""); setDescription(""); setPrice(""); setCategory("Other"); setCondition("Used"); setLocation(""); setImageFile(null);
      fetchProducts();
    }
    setSubmitting(false);
  };

  const handleMarkSold = async (productId: string) => {
    await supabase.from("marketplace_products").update({ is_sold: true }).eq("id", productId);
    toast.success("Marked as sold!");
    fetchProducts();
  };

  const handleDelete = async (productId: string) => {
    await supabase.from("marketplace_products").delete().eq("id", productId);
    toast.success("Product removed.");
    fetchProducts();
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCategory === "all" || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">EcoMarket</h1>
            <p className="text-muted-foreground mt-1">Buy & sell second-hand items. Reduce, reuse, recycle!</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="eco-gradient text-primary-foreground font-semibold gap-2">
                <Plus className="h-4 w-4" /> Sell Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">List a Product</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <Input placeholder="Product title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100} />
                <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} />
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="Price (₹)" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" step="0.01" />
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer rounded-xl border-2 border-dashed border-border p-4 hover:border-primary transition-colors">
                    <Camera className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{imageFile ? imageFile.name : "Add photo"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <Button type="submit" disabled={submitting} className="w-full eco-gradient text-primary-foreground font-semibold">
                  {submitting ? "Listing..." : "List Product"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-12 bg-card" />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40 h-12"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No products found. Be the first to list one!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((product) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card border border-border overflow-hidden hover:eco-shadow transition-shadow">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title} className="h-48 w-full object-cover" />
                ) : (
                  <div className="h-48 w-full bg-muted flex items-center justify-center">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-display font-semibold text-foreground text-lg line-clamp-1">{product.title}</h3>
                    <span className="font-display font-bold text-primary text-lg">₹{product.price}</span>
                  </div>
                  {product.description && <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground"><Tag className="h-3 w-3 inline mr-1" />{product.category}</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">{product.condition}</span>
                    {product.location && <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground"><MapPin className="h-3 w-3 inline mr-1" />{product.location}</span>}
                  </div>
                  {userId === product.user_id && (
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => handleMarkSold(product.id)}>Mark Sold</Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(product.id)}>Delete</Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
