import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useUsage } from "@/context/UsageContext";
import { useAuth, AUTH_URL } from "@/context/AuthContext";
import { downloadTxt } from "@/lib/download";

interface ProfileSheetProps {
  open: boolean;
  onClose: () => void;
  onNeedAuth: () => void;
}

interface SavedMaterial {
  id: number;
  type: string;
  title: string;
  created_at: string;
}

const USAGE_LABELS: Record<string, string> = {
  lesson: "Генератор уроков",
  game: "Генератор игры",
  intensive: "Генератор интенсивов",
  task: "Генератор заданий",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Бесплатный тариф",
  "30days": "Тариф активен ✓ (30 дней)",
  "7days": "Тариф активен ✓ (7 дней)",
  year: "Тариф активен ✓ (год)",
};

const ProfileSheet = ({ open, onClose, onNeedAuth }: ProfileSheetProps) => {
  const { servicesCount } = useUsage();
  const { user, token, plan, isPaid, logout, usage, freeLimit } = useAuth();
  const [materials, setMaterials] = useState<SavedMaterial[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const loadMaterials = async () => {
    if (!token) return;
    setLoadingMaterials(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Authorization": token },
        body: JSON.stringify({ action: "list_materials" }),
      });
      const data = await res.json();
      if (res.ok) setMaterials(data.items || []);
    } finally {
      setLoadingMaterials(false);
    }
  };

  useEffect(() => {
    if (open && token) loadMaterials();
  }, [open, token]);

  const handleDownloadMaterial = async (item: SavedMaterial) => {
    if (!token) return;
    setDownloadingId(item.id);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Authorization": token },
        body: JSON.stringify({ action: "get_material", id: item.id }),
      });
      const data = await res.json();
      if (res.ok) {
        downloadTxt(item.title, [item.title, "", ...(data.content || "").split("\n")]);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Authorization": token },
      body: JSON.stringify({ action: "delete_material", id }),
    });
    setMaterials((m) => m.filter((x) => x.id !== id));
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display flex items-center gap-2">
            <Icon name="User" size={20} />
            Личный кабинет
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {!user ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center mb-6">
              <Icon name="UserCircle2" size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                Войдите, чтобы сохранять материалы и управлять подпиской
              </p>
              <Button onClick={onNeedAuth} className="gap-2">
                <Icon name="LogIn" size={16} />
                Войти или зарегистрироваться
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-border p-4 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground font-display font-bold uppercase">
                {user.name?.[0] || user.email[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{user.name || user.email}</p>
                <p className="text-xs text-muted-foreground">{PLAN_LABELS[plan] || plan}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 shrink-0">
                <Icon name="LogOut" size={15} />
                Выйти
              </Button>
            </div>
          )}

          <Tabs defaultValue="usage">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="usage">Статистика</TabsTrigger>
              <TabsTrigger value="materials">Материалы</TabsTrigger>
              <TabsTrigger value="privacy">Данные</TabsTrigger>
            </TabsList>

            <TabsContent value="usage" className="space-y-4 mt-4">
              <div className="rounded-xl bg-secondary/60 p-4">
                <p className="text-xs text-muted-foreground mb-1">Всего услуг оказано платформой</p>
                <p className="font-display text-2xl font-bold">{servicesCount.toLocaleString("ru-RU")}</p>
              </div>

              <div className="space-y-3">
                {(Object.keys(USAGE_LABELS) as Array<keyof typeof usage>).map((k) => (
                  <div key={k}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{USAGE_LABELS[k]}</span>
                      <span className="text-muted-foreground">
                        {isPaid ? "безлимит" : `${usage[k]} / ${freeLimit}`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: isPaid ? "100%" : `${Math.min(100, (usage[k] / freeLimit) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="materials" className="mt-4">
              {!user ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Войдите, чтобы увидеть сохранённые материалы
                </p>
              ) : loadingMaterials ? (
                <div className="flex justify-center py-6">
                  <Icon name="Loader2" size={20} className="animate-spin text-muted-foreground" />
                </div>
              ) : materials.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Пока нет сохранённых материалов.<br />Сгенерируйте урок, игру или задание и нажмите «В кабинет».
                </p>
              ) : (
                <div className="space-y-2">
                  {materials.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 rounded-lg border border-border p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(m.created_at).toLocaleDateString("ru-RU")}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownloadMaterial(m)}
                        disabled={downloadingId === m.id}
                        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors shrink-0"
                        title="Скачать .txt"
                      >
                        {downloadingId === m.id ? (
                          <Icon name="Loader2" size={15} className="animate-spin" />
                        ) : (
                          <Icon name="Download" size={15} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-destructive/10 text-destructive transition-colors shrink-0"
                        title="Удалить"
                      >
                        <Icon name="Trash2" size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="privacy" className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p className="text-foreground font-semibold">Политика обработки данных УрокАИ</p>
              <p>
                Мы обрабатываем только данные, необходимые для работы сервиса: тему запроса, класс/возраст
                и загруженные изображения тетрадей — для генерации результата и проверки работ.
              </p>
              <p>
                Загруженные фото используются исключительно для анализа и не передаются третьим лицам.
                Вы можете запросить удаление данных в любой момент.
              </p>
              <p>
                Платёжные данные обрабатываются партнёром-эквайером ЮКасса и не хранятся на наших серверах.
              </p>
              <p>Продолжая пользоваться сервисом, вы соглашаетесь с условиями обработки данных.</p>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProfileSheet;