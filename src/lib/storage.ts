import { Expense, MonthlyBudget } from "./types";
import { supabase } from "@/integrations/supabase/client";

const EXPENSES_KEY = "expense-tracker-expenses";
const BUDGETS_KEY = "expense-tracker-budgets";

// localStorage fallback for migration purposes
export const storage = {
  getExpenses(): Expense[] {
    const data = localStorage.getItem(EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
  },

  getBudgets(): MonthlyBudget[] {
    const data = localStorage.getItem(BUDGETS_KEY);
    return data ? JSON.parse(data) : [];
  },
};

// Supabase storage functions
export const supabaseStorage = {
  async getExpenses(userId: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) throw error;
    
    return (data || []).map((item) => ({
      id: item.id,
      date: item.date,
      category: item.category as any,
      description: item.description,
      amount: Number(item.amount),
      paymentMethod: item.payment_method as any,
      tag: item.tag,
      createdAt: item.created_at,
    }));
  },

  async addExpense(userId: string, expense: Omit<Expense, "id" | "createdAt">): Promise<void> {
    const { error } = await supabase.from("expenses").insert({
      user_id: userId,
      date: expense.date,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      payment_method: expense.paymentMethod,
      tag: expense.tag,
    });

    if (error) throw error;
  },

  async updateExpense(id: string, updatedExpense: Partial<Expense>): Promise<void> {
    const updates: any = {};
    if (updatedExpense.date) updates.date = updatedExpense.date;
    if (updatedExpense.category) updates.category = updatedExpense.category;
    if (updatedExpense.description) updates.description = updatedExpense.description;
    if (updatedExpense.amount !== undefined) updates.amount = updatedExpense.amount;
    if (updatedExpense.paymentMethod) updates.payment_method = updatedExpense.paymentMethod;
    if (updatedExpense.tag !== undefined) updates.tag = updatedExpense.tag;

    const { error } = await supabase
      .from("expenses")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
  },

  async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) throw error;
  },

  async getBudgets(userId: string): Promise<MonthlyBudget[]> {
    const { data, error } = await supabase
      .from("monthly_budgets")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    
    return (data || []).map((item) => ({
      month: item.month,
      amount: Number(item.amount),
    }));
  },

  async saveBudget(userId: string, budget: MonthlyBudget): Promise<void> {
    const { error } = await supabase.from("monthly_budgets").upsert(
      {
        user_id: userId,
        month: budget.month,
        amount: budget.amount,
      },
      {
        onConflict: "user_id,month",
      }
    );

    if (error) throw error;
  },

  async getBudgetForMonth(userId: string, month: string): Promise<MonthlyBudget | null> {
    const { data, error } = await supabase
      .from("monthly_budgets")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      month: data.month,
      amount: Number(data.amount),
    };
  },
};
