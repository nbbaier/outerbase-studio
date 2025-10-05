import { createContext, type PropsWithChildren, useContext } from "react";
import type { DatabaseTableColumnChange } from "@/drivers/base-driver";

const ColumnContext = createContext<{ columns: DatabaseTableColumnChange[] }>({
  columns: [],
});

export function useColumnList() {
  return useContext(ColumnContext);
}

export function ColumnsProvider({
  children,
  value,
}: PropsWithChildren<{ value: DatabaseTableColumnChange[] }>) {
  return (
    <ColumnContext.Provider value={{ columns: value }}>
      {children}
    </ColumnContext.Provider>
  );
}
