import { Expense, Category } from "./types";
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";

export const getCurrentMonthExpenses = (expenses: Expense[]): Expense[] => {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  
  return expenses.filter(expense => {
    const expenseDate = parseISO(expense.date);
    return expenseDate >= start && expenseDate <= end;
  });
};

export const getLastMonthExpenses = (expenses: Expense[]): Expense[] => {
  const lastMonth = subMonths(new Date(), 1);
  const start = startOfMonth(lastMonth);
  const end = endOfMonth(lastMonth);
  
  return expenses.filter(expense => {
    const expenseDate = parseISO(expense.date);
    return expenseDate >= start && expenseDate <= end;
  });
};

export const getTotalAmount = (expenses: Expense[]): number => {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
};

export const getPercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const getCategoryTotals = (expenses: Expense[]): Record<Category, number> => {
  const totals: Record<Category, number> = {
    food: 0,
    travel: 0,
    shopping: 0,
    rent: 0,
    entertainment: 0,
    utilities: 0,
    health: 0,
    other: 0,
  };

  expenses.forEach(expense => {
    totals[expense.category] += expense.amount;
  });

  return totals;
};

export const getTopCategory = (expenses: Expense[]): { category: Category; amount: number } | null => {
  const totals = getCategoryTotals(expenses);
  let topCategory: Category | null = null;
  let maxAmount = 0;

  (Object.keys(totals) as Category[]).forEach(category => {
    if (totals[category] > maxAmount) {
      maxAmount = totals[category];
      topCategory = category;
    }
  });

  return topCategory ? { category: topCategory, amount: maxAmount } : null;
};

export const getMonthlyTotals = (expenses: Expense[], monthsBack: number = 12): { month: string; total: number }[] => {
  const result: { month: string; total: number }[] = [];
  
  for (let i = monthsBack - 1; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const monthStr = format(date, "MMM yyyy");
    const monthKey = format(date, "yyyy-MM");
    
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    
    const monthExpenses = expenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return expenseDate >= start && expenseDate <= end;
    });
    
    result.push({
      month: monthStr,
      total: getTotalAmount(monthExpenses),
    });
  }
  
  return result;
};

export const getAverageMonthlySpend = (expenses: Expense[]): number => {
  const monthlyTotals = getMonthlyTotals(expenses, 12);
  const nonZeroMonths = monthlyTotals.filter(m => m.total > 0);
  
  if (nonZeroMonths.length === 0) return 0;
  
  const total = nonZeroMonths.reduce((sum, m) => sum + m.total, 0);
  return total / nonZeroMonths.length;
};
