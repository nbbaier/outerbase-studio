import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function ButtonGroup({
  children,
}: PropsWithChildren<{ suppressHydrationWarning?: boolean }>) {
  return (
    <div
      className={`flex gap-1 items-center px-1 h-9 rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900`}
    >
      {children}
    </div>
  );
}

interface ButtonGroupItemProps {
  onClick?: () => void;
  selected?: boolean;
  suppressHydrationWarning?: boolean;
}

export function ButtonGroupItem({
  children,
  selected,
  onClick,
}: PropsWithChildren<ButtonGroupItemProps>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        `flex items-center px-2 h-7 text-sm rounded-sm transition-all cursor-pointer text-neutral-600 hover:bg-neutral-200 dark:text-neutral-400 hover:dark:bg-neutral-800`,
        {
          "bg-neutral-200 dark:bg-neutral-800": selected,
        },
      )}
    >
      {children}
    </button>
  );
}
