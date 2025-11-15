import { useState, useEffect } from "react";
import { supabaseStorage } from "@/lib/storage";
import { Expense } from "@/lib/types";
import {
  getCurrentMonthExpenses,
  getCategoryTotals,
  getTopCategory,
  getMonthlyTotals,
  getAverageMonthlySpend,
  getTotalAmount,
  getLastMonthExpenses,
  getPercentageChange,
} from "@/lib/calculations";
import { getCategoryInfo } from "@/lib/categories";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const CATEGORY_COLORS = {
  food: "hsl(var(--category-food))",
  travel: "hsl(var(--category-travel))",
  shopping: "hsl(var(--category-shopping))",
  rent: "hsl(var(--category-rent))",
  entertainment: "hsl(var(--category-entertainment))",
  utilities: "hsl(var(--category-utilities))",
  health: "hsl(var(--category-health))",
  other: "hsl(var(--category-other))",
};

export default function Analytics() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [budgetAmount, setBudgetAmount] = useState("");
  const [showBudgetInput, setShowBudgetInput] = useState(false);

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", user?.id],
    queryFn: () => supabaseStorage.getExpenses(user!.id),
    enabled: !!user?.id,
  });

  const currentMonth = format(new Date(), "yyyy-MM");

  const { data: budget } = useQuery({
    queryKey: ["budget", user?.id, currentMonth],
    queryFn: () => supabaseStorage.getBudgetForMonth(user!.id, currentMonth),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (budget) {
      setBudgetAmount(budget.amount.toString());
      setShowBudgetInput(false);
    } else {
      setShowBudgetInput(true);
    }
  }, [budget]);

  const saveBudgetMutation = useMutation({
    mutationFn: (amount: number) =>
      supabaseStorage.saveBudget(user!.id, { month: currentMonth, amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      toast.success("Monthly budget saved!");
      setShowBudgetInput(false);
    },
  });

  const currentMonthExpenses = getCurrentMonthExpenses(expenses);
  const lastMonthExpenses = getLastMonthExpenses(expenses);
  const categoryTotals = getCategoryTotals(currentMonthExpenses);
  const topCategory = getTopCategory(currentMonthExpenses);
  const monthlyTotals = getMonthlyTotals(expenses, 12);
  const averageSpend = getAverageMonthlySpend(expenses);
  
  const currentTotal = getTotalAmount(currentMonthExpenses);
  const lastTotal = getTotalAmount(lastMonthExpenses);
  const percentageChange = getPercentageChange(currentTotal, lastTotal);

  const pieData = Object.entries(categoryTotals)
    .filter(([_, value]) => value > 0)
    .map(([category, value]) => ({
      name: getCategoryInfo(category as any).label,
      value,
      color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS],
    }));

  const handleSaveBudget = () => {
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid budget amount");
      return;
    }

    saveBudgetMutation.mutate(amount);
  };

  return (
    <div className="min-h-screen bg-background pb-24 pt-6 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
          <p className="text-muted-foreground">Insights into your spending</p>
        </div>

        {/* Budget Section */}
        <div className="bg-card rounded-2xl p-6 shadow-md border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Monthly Budget</h2>
          </div>
          
          {showBudgetInput ? (
            <div className="space-y-3">
              <Label htmlFor="budget">Set your monthly budget (₹)</Label>
              <div className="flex gap-2">
                <Input
                  id="budget"
                  type="number"
                  placeholder="5000"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="rounded-xl"
                />
                <Button onClick={handleSaveBudget} className="rounded-xl">
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-foreground">
                  ₹{budget?.amount.toLocaleString()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBudgetInput(true)}
                  className="rounded-xl"
                >
                  Edit
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Spending Overview */}
        <div className="bg-card rounded-2xl p-6 shadow-md border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Spending Overview</h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">This Month</p>
              <p className="text-2xl font-bold text-foreground">
                ₹{currentTotal.toLocaleString()}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Last Month</p>
              <p className="text-2xl font-bold text-foreground">
                ₹{lastTotal.toLocaleString()}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Change</p>
              <div className="flex items-center justify-center gap-1">
                {percentageChange >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-destructive" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-success" />
                )}
                <p className={cn(
                  "text-xl font-bold",
                  percentageChange >= 0 ? "text-destructive" : "text-success"
                )}>
                  {Math.abs(percentageChange).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {pieData.length > 0 && (
          <div className="bg-card rounded-2xl p-6 shadow-md border border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">Category Breakdown</h2>
            
            <div className="flex items-center justify-center mb-6">
              <div className="w-64 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {topCategory && (
              <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Top Category</p>
                <p className="font-bold text-xl text-foreground capitalize">
                  {getCategoryInfo(topCategory.category).label}
                </p>
                <p className="text-primary font-semibold text-lg">
                  ₹{topCategory.amount.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Monthly Trend */}
        {monthlyTotals.length > 0 && (
          <div className="bg-card rounded-2xl p-6 shadow-md border border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">Monthly Trend</h2>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTotals}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.75rem",
                    }}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="hsl(var(--primary))" 
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="bg-card rounded-2xl p-6 shadow-md border border-border space-y-4">
          <h2 className="text-xl font-bold text-foreground mb-4">Insights</h2>
          
          <div className="space-y-3">
            {topCategory && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <p className="text-foreground">
                  Your top spending category this month is{" "}
                  <span className="font-semibold capitalize">
                    {getCategoryInfo(topCategory.category).label}
                  </span>{" "}
                  (₹{topCategory.amount.toLocaleString()})
                </p>
              </div>
            )}
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <p className="text-foreground">
                You're spending{" "}
                <span className="font-semibold">
                  {Math.abs(percentageChange).toFixed(1)}% {percentageChange >= 0 ? "more" : "less"}
                </span>{" "}
                than last month
              </p>
            </div>
            
            {averageSpend > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <p className="text-foreground">
                  Your average monthly spend is{" "}
                  <span className="font-semibold">₹{averageSpend.toLocaleString()}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

