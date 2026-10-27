import { Link } from "@/lib/router-compat";
import Icon from "@/components/ui/icon";

const SiteLogoLink = ({ className = "" }: { className?: string }) => (
  <Link
    to="/"
    title="На главную"
    aria-label="УрокАИ — на главную"
    className={`inline-flex items-center gap-2.5 shrink-0 transition-opacity hover:opacity-80 ${className}`}
  >
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
      <Icon name="GraduationCap" size={19} />
    </span>
    <span className="font-display text-lg font-bold tracking-tight">
      Урок<span className="text-coral">АИ</span>
    </span>
  </Link>
);

export default SiteLogoLink;
