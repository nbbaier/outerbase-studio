import Link from "next/link";
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

interface SidebarMenuItemProps {
  text: string;
  badge?: ReactElement;
  onClick?: () => void;
  href?: string;
  selected?: boolean;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

interface SidebarMenuHeader {
  text: string;
}

export function SidebarMenuLoadingItem() {
  const className =
    "flex items-center p-2 pl-4 h-8 text-sm hover:cursor-pointer";

  return (
    <div className={className}>
      <span className="mr-2 w-4 h-4">
        <span className="inline-flex w-4 h-4 rounded-full animate-pulse bg-muted"></span>
      </span>
      <span className="flex flex-1 items-center text-left">
        <span className="inline-flex mr-5 w-full h-3 rounded-sm animate-pulse bg-muted"></span>
      </span>
    </div>
  );
}

export function SidebarMenuItem({
  text,
  onClick,
  icon: IconComponent,
  badge,
  href,
  selected,
}: SidebarMenuItemProps) {
  const className =
    "flex items-center p-2 pl-4 h-8 text-sm hover:cursor-pointer hover:bg-secondary";

  const body = (
    <>
      {IconComponent ? (
        <IconComponent className="mr-2 w-4 h-4" />
      ) : (
        <span className="mr-2 w-4 h-4"></span>
      )}

      <span className="flex-1 text-left">{text}</span>

      {badge && badge}
    </>
  );

  if (href) {
    if (href.startsWith("https://")) {
      return (
        <Link
          href={href}
          className={cn(className, selected ? "bg-selected" : "")}
          target="_blank"
        >
          {body}
        </Link>
      );
    }

    return (
      <Link
        href={href}
        className={cn(className, selected ? "bg-selected" : "")}
      >
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cn(className, selected ? "bg-selected" : "")}
      onClick={onClick}
    >
      {body}
    </button>
  );
}

export function SidebarMenuHeader({ text }: SidebarMenuHeader) {
  return <div className="flex p-2 pl-4 mt-2 text-sm font-bold">{text}</div>;
}
