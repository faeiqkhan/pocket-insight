import { supabase } from "@/integrations/supabase/client";
import { storage } from "./storage";
import { Expense, MonthlyBudget } from "./types";

export async function migrateLocalStorageToSupabase(userId: string) {
  try {
    // Get localStorage data
    const localExpenses = storage.getExpenses();
    const localBudgets = storage.getBudgets();

    // Migrate expenses
    if (localExpenses.length > 0) {
      const expensesToInsert = localExpenses.map((expense) => ({
        id: expense.id,
        user_id: userId,
        date: expense.date,
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        payment_method: expense.paymentMethod,
        tag: expense.tag,
        created_at: expense.createdAt,
      }));

      const { error: expensesError } = await supabase
        .from("expenses")
        .insert(expensesToInsert);

      if (expensesError) throw expensesError;
    }

    // Migrate budgets
    if (localBudgets.length > 0) {
      const budgetsToInsert = localBudgets.map((budget) => ({
        user_id: userId,
        month: budget.month,
        amount: budget.amount,
      }));

      const { error: budgetsError } = await supabase
        .from("monthly_budgets")
        .insert(budgetsToInsert);

      if (budgetsError) throw budgetsError;
    }

    // Clear localStorage after successful migration
    localStorage.removeItem("expense-tracker-expenses");
    localStorage.removeItem("expense-tracker-budgets");
    localStorage.setItem("migrated", "true");

    return {
      success: true,
      expensesCount: localExpenses.length,
      budgetsCount: localBudgets.length,
    };
  } catch (error) {
    console.error("Migration error:", error);
    return { success: false, error };
  }
}

export function hasLocalStorageData(): boolean {
  const expenses = storage.getExpenses();
  const budgets = storage.getBudgets();
  const migrated = localStorage.getItem("migrated");
  
  return !migrated && (expenses.length > 0 || budgets.length > 0);
}
