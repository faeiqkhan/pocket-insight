import { useState, useEffect } from "react";
import { supabaseStorage } from "@/lib/storage";
import { Expense, Category, PaymentMethod } from "@/lib/types";
import { ExpenseCard } from "@/components/ExpenseCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { categories } from "@/lib/categories";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | "all">("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", user?.id],
    queryFn: () => supabaseStorage.getExpenses(user!.id),
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supabaseStorage.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense deleted");
    },
  });

  useEffect(() => {
    applyFilters();
  }, [expenses, searchQuery, categoryFilter, paymentFilter, monthFilter, sortBy, sortOrder]);

  const applyFilters = () => {
    let filtered = [...expenses];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.description.toLowerCase().includes(query) ||
          e.tag?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((e) => e.category === categoryFilter);
    }

    // Payment filter
    if (paymentFilter !== "all") {
      filtered = filtered.filter((e) => e.paymentMethod === paymentFilter);
    }

    // Month filter
    if (monthFilter !== "all") {
      const [year, month] = monthFilter.split("-");
      const monthStart = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
      const monthEnd = endOfMonth(monthStart);
      
      filtered = filtered.filter((e) => {
        const expenseDate = parseISO(e.date);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else {
        return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
      }
    });

    setFilteredExpenses(filtered);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleEdit = (expense: Expense) => {
    navigate("/add", { state: { expense } });
  };

  const toggleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Get unique months from expenses
  const uniqueMonths = Array.from(
    new Set(expenses.map((e) => format(parseISO(e.date), "yyyy-MM")))
  ).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-background pb-24 pt-6 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Transaction History</h1>
          <p className="text-muted-foreground">View and manage all expenses</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 rounded-xl h-12"
          />
        </div>

        {/* Filters */}
        <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Filters</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as any)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Payment Filter */}
            <Select value={paymentFilter} onValueChange={(value) => setPaymentFilter(value as any)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
              </SelectContent>
            </Select>

            {/* Month Filter */}
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {uniqueMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {format(parseISO(`${month}-01`), "MMM yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Order */}
          <Button
            variant="outline"
            onClick={toggleSort}
            className="w-full rounded-xl"
          >
            <ArrowUpDown className="w-4 h-4 mr-2" />
            {sortOrder === "asc" ? "Oldest First" : "Newest First"}
          </Button>
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            {filteredExpenses.length} {filteredExpenses.length === 1 ? "expense" : "expenses"} found
          </span>
          {(searchQuery || categoryFilter !== "all" || paymentFilter !== "all" || monthFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
                setPaymentFilter("all");
                setMonthFilter("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Expenses List */}
        {filteredExpenses.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center shadow-md border border-border">
            <p className="text-muted-foreground">No expenses found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

