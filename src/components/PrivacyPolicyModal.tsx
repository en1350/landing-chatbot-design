import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";

interface PrivacyPolicyModalProps {
  open: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal = ({ open, onClose }: PrivacyPolicyModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Icon name="ShieldCheck" size={20} />
            Политика обработки персональных данных
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground mt-2">
          <p>
            Регистрируясь в сервисе УрокАИ, вы даёте согласие на обработку персональных данных
            (email, имя) в соответствии с 152-ФЗ «О персональных данных».
          </p>
          <p>
            Мы обрабатываем только данные, необходимые для работы сервиса: email и имя для входа
            в личный кабинет, тему запроса и класс/возраст — для генерации учебных материалов,
            загруженные изображения тетрадей — для их автоматической проверки.
          </p>
          <p>
            Загруженные фото используются исключительно для анализа ИИ и не передаются третьим лицам,
            не хранятся после завершения проверки дольше, чем это необходимо для показа результата.
          </p>
          <p>
            Платёжные данные обрабатываются партнёром-эквайером ЮКасса и не хранятся на серверах УрокАИ.
          </p>
          <p>
            Вы можете в любой момент запросить удаление своих данных, обратившись в поддержку сервиса.
            Согласие можно отозвать, удалив аккаунт.
          </p>
          <p>Продолжая пользоваться сервисом после регистрации, вы подтверждаете согласие с условиями обработки данных.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacyPolicyModal;
