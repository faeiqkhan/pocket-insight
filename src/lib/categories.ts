import { Category } from "./types";
import { Utensils, Car, ShoppingBag, Home, Tv, Lightbulb, Heart, MoreHorizontal } from "lucide-react";

export const categories: { 
  value: Category; 
  label: string; 
  icon: any; 
  emoji: string;
}[] = [
  { value: "food", label: "Food", icon: Utensils, emoji: "🍔" },
  { value: "travel", label: "Travel", icon: Car, emoji: "🚗" },
  { value: "shopping", label: "Shopping", icon: ShoppingBag, emoji: "🛍️" },
  { value: "rent", label: "Rent", icon: Home, emoji: "🏠" },
  { value: "entertainment", label: "Entertainment", icon: Tv, emoji: "🎬" },
  { value: "utilities", label: "Utilities", icon: Lightbulb, emoji: "💡" },
  { value: "health", label: "Health", icon: Heart, emoji: "❤️" },
  { value: "other", label: "Other", icon: MoreHorizontal, emoji: "📌" },
];

export const getCategoryInfo = (category: Category) => {
  return categories.find(c => c.value === category) || categories[categories.length - 1];
};
