import { LucideIcon } from "lucide-react";

interface ColoredIconProps {
  icon: LucideIcon;
  bgClass: string;
  iconClass: string;
  size?: "sm" | "md";
}

const ColoredIcon = ({ icon: Icon, bgClass, iconClass, size = "md" }: ColoredIconProps) => {
  const containerSize = size === "sm" ? "h-9 w-9" : "h-12 w-12";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className={`${containerSize} rounded-xl ${bgClass} flex items-center justify-center`}>
      <Icon className={`${iconSize} ${iconClass}`} />
    </div>
  );
};

export default ColoredIcon;
