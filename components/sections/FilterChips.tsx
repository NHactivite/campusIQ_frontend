"use client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setFilter, DashboardFilter } from "@/store/slices/dashboardSlice";

const filters: DashboardFilter[] = ["All", "RDC", "IIC", "Learning", "Incubation"];

export default function FilterChips() {
  const filter = useAppSelector((s) => s.dashboard.filter);
  const dispatch = useAppDispatch();

  return (
    <div className="mb-8 flex flex-wrap gap-2">
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => dispatch(setFilter(f))}
          aria-pressed={f === filter}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
            f === filter ? "border-primary bg-primary text-white" : "bg-white hover:bg-muted"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}