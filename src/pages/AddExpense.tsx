import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabaseStorage } from "@/lib/storage";
import { Category, PaymentMethod, Expense } from "@/lib/types";
import { categories } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
  { value: "bank", label: "Bank Transfer" },
];

export default function AddExpense() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const editingExpense = location.state?.expense as Expense | undefined;

  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [category, setCategory] = useState<Category>("food");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [tag, setTag] = useState("");

  useEffect(() => {
    if (editingExpense) {
      setDate(editingExpense.date);
      setCategory(editingExpense.category);
      setDescription(editingExpense.description);
      setAmount(editingExpense.amount.toString());
      setPaymentMethod(editingExpense.paymentMethod);
      setTag(editingExpense.tag || "");
    }
  }, [editingExpense]);

  const addMutation = useMutation({
    mutationFn: (expense: Omit<Expense, "id" | "createdAt">) =>
      supabaseStorage.addExpense(user!.id, expense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense added successfully!");
      navigate("/");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Expense> }) =>
      supabaseStorage.updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense updated successfully!");
      navigate("/");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    if (editingExpense) {
      updateMutation.mutate({
        id: editingExpense.id,
        data: {
          date,
          category,
          description: description.trim(),
          amount: numAmount,
          paymentMethod,
          tag: tag.trim() || undefined,
        },
      });
    } else {
      addMutation.mutate({
        date,
        category,
        description: description.trim(),
        amount: numAmount,
        paymentMethod,
        tag: tag.trim() || undefined,
      });
    }
  };

  const isLoading = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-background pb-24 pt-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            {editingExpense ? "Edit Expense" : "Add Expense"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-base font-semibold">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl h-12 text-base"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Category</Label>
            <div className="grid grid-cols-4 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                    category === cat.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <cat.icon
                    className={cn(
                      "w-8 h-8",
                      category === cat.value ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span className="text-xs font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-semibold">Description</Label>
            <Input
              id="description"
              type="text"
              placeholder="e.g., Grocery shopping"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl h-12 text-base"
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-base font-semibold">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-xl h-12 text-base"
              required
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  className={cn(
                    "p-4 rounded-xl border-2 font-medium transition-all text-center",
                    paymentMethod === method.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/50"
                  )}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tag (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="tag" className="text-base font-semibold">Tag (Optional)</Label>
            <Input
              id="tag"
              type="text"
              placeholder="e.g., Work, Personal"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="rounded-xl h-12 text-base"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-14 rounded-xl text-lg font-semibold"
            disabled={isLoading}
          >
            {isLoading
              ? "Saving..."
              : editingExpense
              ? "Update Expense"
              : "Add Expense"}
          </Button>
        </form>
      </div>
    </div>
  );
}

