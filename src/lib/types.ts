export type Category = 
  | "food" 
  | "travel" 
  | "shopping" 
  | "rent" 
  | "entertainment" 
  | "utilities" 
  | "health" 
  | "other";

export type PaymentMethod = "cash" | "card" | "upi" | "bank";

export interface Expense {
  id: string;
  date: string;
  category: Category;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  tag?: string;
  createdAt: string;
}

export interface MonthlyBudget {
  month: string; // Format: YYYY-MM
  amount: number;
}
