import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface NavItem {
  label: string;
  icon: string;
  to?: string;
  href?: string;
  onClick?: () => void;
}

interface NavDropdownProps {
  label: string;
  shortLabel?: string;
  items: NavItem[];
}

const itemClass = "flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium";

const NavDropdown = ({ label, shortLabel, items }: NavDropdownProps) => {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const show = () => {
    clearTimeout(timer.current);
    setOpen(true);
  };
  const hide = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div onMouseEnter={show} onMouseLeave={hide}>
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-foreground/80 outline-none transition-colors hover:text-foreground data-[state=open]:text-foreground"
          >
            {shortLabel ? (
              <>
                <span className="xl:hidden">{shortLabel}</span>
                <span className="hidden xl:inline">{label}</span>
              </>
            ) : (
              label
            )}
            <Icon name="ChevronDown" size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={6} className="min-w-[260px] p-1.5" onMouseEnter={show} onMouseLeave={hide}>
          {items.map((item) => {
            const body = (
              <>
                <Icon name={item.icon} size={16} className="shrink-0 text-primary" />
                <span>{item.label}</span>
              </>
            );
            if (item.to) {
              return (
                <DropdownMenuItem key={item.label} asChild className={itemClass}>
                  <Link to={item.to}>{body}</Link>
                </DropdownMenuItem>
              );
            }
            if (item.href) {
              return (
                <DropdownMenuItem key={item.label} asChild className={itemClass}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    {body}
                  </a>
                </DropdownMenuItem>
              );
            }
            return (
              <DropdownMenuItem key={item.label} onSelect={item.onClick} className={itemClass}>
                {body}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default NavDropdown;
