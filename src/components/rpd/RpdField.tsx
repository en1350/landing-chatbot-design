import { ReactNode } from "react";

interface Props {
  label: string;
  children: ReactNode;
  className?: string;
}

const RpdField = ({ label, children, className }: Props) => (
  <div className={className}>
    <label className="text-sm font-medium mb-1.5 block">{label}</label>
    {children}
  </div>
);

export default RpdField;
