import { Expense } from "@/lib/types";
import { getCategoryInfo } from "@/lib/categories";
import { format, parseISO } from "date-fns";
import { Trash2, Edit } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface ExpenseCardProps {
  expense: Expense;
  onDelete?: (id: string) => void;
  onEdit?: (expense: Expense) => void;
}

export const ExpenseCard = ({ expense, onDelete, onEdit }: ExpenseCardProps) => {
  const categoryInfo = getCategoryInfo(expense.category);
  const Icon = categoryInfo.icon;

  return (
    <div className="bg-card rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow border border-border">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
            `bg-category-${expense.category}/20`
          )}>
            <Icon className={cn("w-6 h-6", `text-category-${expense.category}`)} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">
                {expense.description}
              </h3>
              <span className="font-bold text-lg text-foreground whitespace-nowrap">
                ₹{expense.amount.toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span className="capitalize">{categoryInfo.label}</span>
              <span>•</span>
              <span>{format(parseISO(expense.date), "MMM dd, yyyy")}</span>
              <span>•</span>
              <span className="capitalize">{expense.paymentMethod}</span>
            </div>
            
            {expense.tag && (
              <span className="inline-block px-2 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs">
                {expense.tag}
              </span>
            )}
          </div>
        </div>
        
        {(onDelete || onEdit) && (
          <div className="flex gap-1 ml-2">
            {onEdit && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit(expense)}
                className="w-8 h-8 text-muted-foreground hover:text-foreground"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDelete(expense.id)}
                className="w-8 h-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
