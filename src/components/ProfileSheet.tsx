import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";
import { useUsage } from "@/context/UsageContext";

interface ProfileSheetProps {
  open: boolean;
  onClose: () => void;
}

const USAGE_LABELS: Record<string, string> = {
  lesson: "Генератор уроков",
  game: "Генератор игры",
  intensive: "Генератор интенсивов",
  task: "Генератор заданий",
};

const ProfileSheet = ({ open, onClose }: ProfileSheetProps) => {
  const { usage, freeLimit, isPaid, servicesCount } = useUsage();

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
          <div className="flex items-center gap-3 rounded-xl border border-border p-4 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground font-display font-bold">
              П
            </div>
            <div>
              <p className="font-semibold text-sm">Педагог</p>
              <p className="text-xs text-muted-foreground">
                {isPaid ? "Тариф: активен ✓" : "Бесплатный тариф"}
              </p>
            </div>
          </div>

          <Tabs defaultValue="usage">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="usage">Статистика</TabsTrigger>
              <TabsTrigger value="privacy">Политика данных</TabsTrigger>
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
                Платёжные данные обрабатываются партнёром-эквайером и не хранятся на наших серверах.
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
