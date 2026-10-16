import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useAuth, AUTH_URL } from "@/context/AuthContext";
import { toast } from "sonner";

interface SaveMaterialButtonProps {
  type: string;
  title: string;
  content: string;
  onNeedAuth?: () => void;
  size?: "default" | "sm";
  className?: string;
}

const SaveMaterialButton = ({ type, title, content, onNeedAuth, size = "default", className }: SaveMaterialButtonProps) => {
  const { user, token } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(false);
  }, [content, title]);

  const save = async () => {
    if (!user || !token) {
      if (onNeedAuth) onNeedAuth();
      else toast.error("Войдите в личный кабинет, чтобы сохранить справку");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Authorization": token },
        body: JSON.stringify({ action: "save_material", type, title, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось сохранить");
      setSaved(true);
      toast.success("Справка сохранена в личном кабинете, вкладка «Материалы»");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить справку");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button variant="outline" size={size} className={`gap-1.5 ${className || ""}`} onClick={save} disabled={saving || saved || !content}>
      {saving ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name={saved ? "Check" : "Save"} size={15} />}
      {saved ? "Сохранено" : "Сохранить в кабинет"}
    </Button>
  );
};

export default SaveMaterialButton;
