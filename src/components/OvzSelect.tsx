import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Icon from "@/components/ui/icon";

export const OVZ_OPTIONS = [
  "Нарушение слуха",
  "Нарушение зрения",
  "Нарушение речи",
  "НОДА",
  "Задержка психического развития",
  "РАС",
] as const;

interface Props {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

const OvzSelect = ({ value, onChange, disabled }: Props) => {
  const [enabled, setEnabled] = useState(value.length > 0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value.length > 0) setEnabled(true);
  }, [value]);

  const toggleEnabled = (on: boolean) => {
    setEnabled(on);
    if (on) {
      setOpen(true);
    } else {
      setOpen(false);
      onChange([]);
    }
  };

  const toggleItem = (item: string, checked: boolean) =>
    onChange(checked ? [...value, item] : value.filter((x) => x !== item));

  const summary =
    value.length === 0 ? "Выберите категории ОВЗ" : value.length <= 2 ? value.join(", ") : `Выбрано: ${value.length}`;

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="text-sm font-medium leading-snug">
          ОВЗ
          <span className="block text-xs font-normal text-muted-foreground">
            Учесть обучающихся с ограниченными возможностями здоровья
          </span>
        </span>
        <Switch checked={enabled} onCheckedChange={toggleEnabled} disabled={disabled} aria-label="Учесть ОВЗ" />
      </label>

      {enabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="mt-3 w-full justify-between font-normal" disabled={disabled}>
              <span className="truncate text-left">{summary}</span>
              <Icon name="ChevronDown" size={16} className="shrink-0 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-64 p-2">
            <div className="space-y-0.5">
              {OVZ_OPTIONS.map((item) => {
                const checked = value.includes(item);
                return (
                  <label
                    key={item}
                    className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent"
                  >
                    <Checkbox checked={checked} onCheckedChange={(c) => toggleItem(item, c === true)} />
                    {item}
                  </label>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {enabled && value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
              {v}
              <button type="button" onClick={() => toggleItem(v, false)} aria-label={`Убрать: ${v}`}>
                <Icon name="X" size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default OvzSelect;
