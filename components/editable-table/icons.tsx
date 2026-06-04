import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  InboxIcon,
} from "@hugeicons/core-free-icons";

type IconProps = Omit<React.ComponentProps<typeof HugeiconsIcon>, "icon"> & {
  icon?: React.ComponentProps<typeof HugeiconsIcon>["icon"];
};

export function AlertIcon(props: IconProps) {
  return <HugeiconsIcon icon={AlertCircleIcon} {...props} />;
}

export function DataIcon(props: IconProps) {
  return <HugeiconsIcon icon={InboxIcon} {...props} />;
}

export function DragHandleIcon(props: IconProps) {
  return <HugeiconsIcon icon={GripVerticalIcon} {...props} />;
}

export function PreviousPageIcon(props: IconProps) {
  return <HugeiconsIcon icon={ChevronLeftIcon} {...props} />;
}

export function NextPageIcon(props: IconProps) {
  return <HugeiconsIcon icon={ChevronRightIcon} {...props} />;
}

export type SortDir = "asc" | "desc" | null;

interface SortIconProps {
  dir: SortDir;
}

export function SortIcon({ dir }: SortIconProps) {
  return (
    <span
      className={cn("ml-1 select-none", dir ? "text-primary" : "opacity-25")}
    >
      {dir === "asc" ? "↑" : dir === "desc" ? "↓" : "↕"}
    </span>
  );
}
