import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface PaywallLockProps {
  description: string;
  loggedIn: boolean;
  onAction: () => void;
}

const PaywallLock = ({ description, loggedIn, onAction }: PaywallLockProps) => (
  <div className="max-w-xl rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-10 text-center">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-3xl mb-4">
      🔒
    </div>
    <p className="font-display text-lg font-bold mb-1.5">Доступно по подписке</p>
    <p className="text-sm text-muted-foreground mb-5 leading-relaxed max-w-sm mx-auto">{description}</p>
    <Button className="h-11 px-6 gap-2 bg-primary hover:bg-primary/90" onClick={onAction}>
      <Icon name={loggedIn ? "Sparkles" : "LogIn"} size={17} />
      {loggedIn ? "Оформить подписку" : "Войти и оформить подписку"}
    </Button>
  </div>
);

export default PaywallLock;
