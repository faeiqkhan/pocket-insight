import React, { useEffect, useState } from "react";
import { supabaseStorage } from "@/lib/storage";
import { Expense } from "@/lib/types";
import {
  getCurrentMonthExpenses,
  getLastMonthExpenses,
  getTotalAmount,
  getPercentageChange,
  getCategoryTotals,
  getTopCategory,
} from "@/lib/calculations";
import { ExpenseCard } from "@/components/ExpenseCard";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { getCategoryInfo } from "@/lib/categories";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/UserMenu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  hasLocalStorageData,
  migrateLocalStorageToSupabase,
} from "@/lib/storageUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Dashboard component — fixed version of the snippet you posted.
 * Assumptions:
 * - `supabaseStorage` exposes async methods: listExpenses(), deleteExpense(id), getBudgetForMonth(yyy-mm)
 * - calculations and categories helpers exist as in your snippet
 * - storageUtils exports hasLocalStorageData() and migrateLocalStorageToSupabase()
 */

export default function Dashboard(): JSX.Element {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // local UI state
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);

  // Fetch expenses with react-query
  const {
    data: expenses = [],
    isLoading,
    isError,
  } = useQuery<Expense[]>({
    queryKey: ["expenses", user?.id ?? "anon"],
    queryFn: async () => {
      if (!user?.id) return [];
      return await supabaseStorage.getExpenses(user.id);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 1,
  });

  // mutation: delete expense
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabaseStorage.deleteExpense(id);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["expenses", user?.id ?? "anon"] });
      const previous = queryClient.getQueryData<Expense[]>([
        "expenses",
        user?.id ?? "anon",
      ]);
      if (previous) {
        queryClient.setQueryData(
          ["expenses", user?.id ?? "anon"],
          previous.filter((e) => e.id !== id)
        );
      }
      return { previous };
    },
    onError: (err, _id, context: any) => {
      toast.error("Could not delete expense");
      if (context?.previous) {
        queryClient.setQueryData(
          ["expenses", user?.id ?? "anon"],
          context.previous
        );
      }
    },
    onSuccess: () => {
      toast.success("Expense deleted");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", user?.id ?? "anon"] });
    },
  });

  // migration mutation
  const migrateMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("No user");
      return migrateLocalStorageToSupabase(user.id);
    },
    onMutate: () => {
      toast.promise(
        Promise.resolve(), // placeholder for immediate feedback
        {
          loading: "Importing data...",
          success: "Imported successfully",
          error: "Import failed",
        }
      );
    },
    onSuccess: () => {
      setShowMigrationDialog(false);
      queryClient.invalidateQueries({ queryKey: ["expenses", user?.id ?? "anon"] });
      toast.success("Local data imported");
    },
    onError: () => {
      toast.error("Failed to import local data");
    },
  });

  // show migration dialog if there is local data and user is logged in
  useEffect(() => {
    if (user && hasLocalStorageData()) {
      setShowMigrationDialog(true);
    }
  }, [user]);

  // Helper functions (wrap calculations you imported)
  const currentMonthExpenses = getCurrentMonthExpenses(expenses);
  const lastMonthExpenses = getLastMonthExpenses(expenses);

  const currentTotal = getTotalAmount(currentMonthExpenses);
  const lastTotal = getTotalAmount(lastMonthExpenses);
  const percentageChange = getPercentageChange(currentTotal, lastTotal);

  const categoryTotals = getCategoryTotals(currentMonthExpenses);
  const topCategory = getTopCategory(currentMonthExpenses);

  // build pie data — use getCategoryInfo to get color if available
  const pieData = Object.entries(categoryTotals)
    .filter(([_, value]) => value > 0)
    .map(([category, value]) => {
      const catInfo = getCategoryInfo(category as any);
      return {
        name: category,
        value,
        color: catInfo?.emoji ?? "#8884d8",
      };
    });

  const recentExpenses = [...currentMonthExpenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleEdit = (expense: Expense) => {
    navigate("/add", { state: { expense } });
  };

  const currentMonth = format(new Date(), "MMMM yyyy");
  
  const { data: budget } = useQuery({
    queryKey: ["budget", user?.id, format(new Date(), "yyyy-MM")],
    queryFn: async () => {
      if (!user?.id) return null;
      return await supabaseStorage.getBudgetForMonth(user.id, format(new Date(), "yyyy-MM"));
    },
    enabled: !!user,
  });

  const budgetAmount = budget?.amount ?? 0;
  const budgetPercentage = budgetAmount ? (currentTotal / budgetAmount) * 100 : 0;

  // small loading/error UI (optional)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Error loading expenses.</div>
      </div>
    );
  }

  return (
    <>
      <AlertDialog open={showMigrationDialog} onOpenChange={setShowMigrationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import Existing Data?</AlertDialogTitle>
            <AlertDialogDescription>
              We found existing expenses on this device. Would you like to import
              them to your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowMigrationDialog(false)}>
              Start Fresh
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => migrateMutation.mutate()}>
              Import Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen bg-background pb-24 pt-6 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{currentMonth}</h1>
              <p className="text-muted-foreground">Track your spending</p>
            </div>
            <UserMenu />
          </div>

          {/* Total Spent Card */}
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 text-primary-foreground shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Total Spent This Month</span>
            </div>
            <div className="text-5xl font-bold mb-4">₹{currentTotal.toLocaleString()}</div>

            <div className="flex items-center gap-2">
              {percentageChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span className="font-medium">
                {Math.abs(percentageChange).toFixed(1)}% {percentageChange >= 0 ? "more" : "less"} than last month
              </span>
            </div>
          </div>

          {/* Budget Progress */}
          {budgetAmount ? (
            <div className="bg-card rounded-2xl p-6 shadow-md border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-foreground">Monthly Budget</span>
                <span className="text-sm text-muted-foreground">
                  ₹{currentTotal.toLocaleString()} / ₹{budgetAmount.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    budgetPercentage > 100 ? "bg-destructive" : budgetPercentage > 80 ? "bg-warning" : "bg-success"
                  )}
                  style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {budgetPercentage > 100
                  ? `You've exceeded your budget by ${(budgetPercentage - 100).toFixed(1)}%`
                  : budgetPercentage > 80
                  ? `Warning: You've used ${budgetPercentage.toFixed(1)}% of your budget`
                  : `${(100 - budgetPercentage).toFixed(1)}% remaining`}
              </p>
            </div>
          ) : (
            <Button variant="outline" className="w-full rounded-2xl" onClick={() => navigate("/analytics")}>
              Set Monthly Budget
            </Button>
          )}

          {/* Category Breakdown */}
          {pieData.length > 0 && (
            <div className="bg-card rounded-2xl p-6 shadow-md border border-border">
              <h2 className="text-xl font-bold text-foreground mb-4">Category Breakdown</h2>

              <div className="flex items-center gap-6">
                <div className="w-32 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2} dataKey="value">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 space-y-2">
                  {topCategory && (
                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                      <p className="text-sm text-muted-foreground">Top Category</p>
                      <p className="font-bold text-lg capitalize text-foreground">
                        {getCategoryInfo(topCategory.category).label}
                      </p>
                      <p className="text-primary font-semibold">₹{topCategory.amount.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Recent Transactions</h2>
              {recentExpenses.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/history")} className="text-primary">
                  View All
                </Button>
              )}
            </div>

            {recentExpenses.length === 0 ? (
              <div className="bg-card rounded-2xl p-8 text-center shadow-md border border-border">
                <p className="text-muted-foreground mb-4">No expenses yet this month</p>
                <Button onClick={() => navigate("/add")}>Add Your First Expense</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentExpenses.map((expense) => (
                  <ExpenseCard key={expense.id} expense={expense} onDelete={handleDelete} onEdit={() => handleEdit(expense)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}