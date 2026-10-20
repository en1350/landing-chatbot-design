import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { AUTH_URL, useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const ChangePasswordForm = () => {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const [closing, setClosing] = useState(false);

  const logoutOthers = async () => {
    if (!window.confirm("Выйти из аккаунта на всех других устройствах? На этом устройстве вы останетесь в системе.")) return;
    setClosing(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Authorization": token || "" },
        body: JSON.stringify({ action: "logout_others" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось выйти из других устройств");
      toast.success(
        data.closed > 0
          ? "Вы вышли из аккаунта на других устройствах"
          : "Других активных устройств не найдено"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось выйти из других устройств");
    } finally {
      setClosing(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDone(false);
    if (newPassword.length < 6) return setError("Новый пароль должен быть не короче 6 символов");
    if (newPassword !== repeat) return setError("Пароли не совпадают");
    setLoading(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Authorization": token || "" },
        body: JSON.stringify({ action: "change_password", old_password: oldPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось сменить пароль");
      setDone(true);
      setOldPassword("");
      setNewPassword("");
      setRepeat("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border p-4 mb-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-sm font-semibold"
      >
        <span className="flex items-center gap-2">
          <Icon name="KeyRound" size={16} />
          Сменить пароль
        </span>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={16} />
      </button>
      {done && <p className="mt-3 text-xs text-green-600">Пароль успешно изменён</p>}
      {open && (
        <form onSubmit={submit} className="mt-3 space-y-2.5">
          <Input type="password" placeholder="Текущий пароль" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
          <Input type="password" placeholder="Новый пароль (от 6 символов)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          <Input type="password" placeholder="Повторите новый пароль" value={repeat} onChange={(e) => setRepeat(e.target.value)} required />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" size="sm" disabled={loading} className="w-full">
            {loading ? "Сохраняю..." : "Сохранить пароль"}
          </Button>
        </form>
      )}
      <button
        type="button"
        onClick={logoutOthers}
        disabled={closing}
        className="mt-3 flex w-full items-center justify-between border-t border-border pt-3 text-sm font-semibold disabled:opacity-60"
      >
        <span className="flex items-center gap-2">
          <Icon name="MonitorSmartphone" size={16} />
          Выйти из других устройств
        </span>
        <Icon name={closing ? "Loader2" : "LogOut"} size={16} className={closing ? "animate-spin" : ""} />
      </button>
    </div>
  );
};

export default ChangePasswordForm;
