import { NavLink } from "./NavLink";
import { Home, PlusCircle, BarChart3, List } from "lucide-react";

export const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="max-w-2xl mx-auto px-4 py-2">
        <div className="flex items-center justify-around">
          <NavLink
            to="/"
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all"
            activeClassName="text-primary bg-primary/10"
          >
            {({ isActive }) => (
              <>
                <Home className={`w-6 h-6 ${isActive ? "fill-current" : ""}`} />
                <span className="text-xs font-medium">Home</span>
              </>
            )}
          </NavLink>
          
          <NavLink
            to="/add"
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all"
            activeClassName="text-primary bg-primary/10"
          >
            {({ isActive }) => (
              <>
                <PlusCircle className={`w-6 h-6 ${isActive ? "fill-current" : ""}`} />
                <span className="text-xs font-medium">Add</span>
              </>
            )}
          </NavLink>
          
          <NavLink
            to="/analytics"
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all"
            activeClassName="text-primary bg-primary/10"
          >
            {({ isActive }) => (
              <>
                <BarChart3 className={`w-6 h-6 ${isActive ? "fill-current" : ""}`} />
                <span className="text-xs font-medium">Analytics</span>
              </>
            )}
          </NavLink>
          
          <NavLink
            to="/history"
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all"
            activeClassName="text-primary bg-primary/10"
          >
            {({ isActive }) => (
              <>
                <List className={`w-6 h-6 ${isActive ? "fill-current" : ""}`} />
                <span className="text-xs font-medium">History</span>
              </>
            )}
          </NavLink>
        </div>
      </div>
    </nav>
  );
};
