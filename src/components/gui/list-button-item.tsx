import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "../ui/button";

export default function ListButtonItem({
  selected,
  text,
  icon: Icon,
  onClick,
}: Readonly<{
  selected?: boolean;
  text: string;
  icon?: Icon;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        buttonVariants({
          variant: selected ? "default" : "ghost",
          size: "sm",
        }),
        "justify-start",
        "cursor-pointer",
      )}
    >
      {Icon ? (
        <Icon className="mr-2 w-4 h-4" />
      ) : (
        <div className="mr-2 w-4 h-4"></div>
      )}
      {text}
    </button>
  );
}
