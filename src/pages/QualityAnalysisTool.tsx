import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import DecomposerModal from "@/components/DecomposerModal";
import RandomizerModal from "@/components/RandomizerModal";
import AntiplagiatModal from "@/components/AntiplagiatModal";
import ProfileSheet from "@/components/ProfileSheet";
import AuthModal from "@/components/AuthModal";
import UpgradeModal from "@/components/UpgradeModal";
import { useAuth } from "@/context/AuthContext";

/* ---------- Страница с paywall ---------- */

const QualityAnalysisTool = () => {
  const { user, isPaid } = useAuth();
  const [decomposerOpen, setDecomposerOpen] = useState(false);
  const [randomizerOpen, setRandomizerOpen] = useState(false);
  const [antiplagiatOpen, setAntiplagiatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const openAuth = () => {
    setProfileOpen(false);
    setAuthOpen(true);
  };

  const openUpgrade = () => {
    setDecomposerOpen(false);
    setAntiplagiatOpen(false);
    setUpgradeOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        onOpenNotebook={() => (window.location.href = "/#notebook")}
        onOpenDecomposer={() => setDecomposerOpen(true)}
        onOpenRandomizer={() => setRandomizerOpen(true)}
        onOpenAntiplagiat={() => setAntiplagiatOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenAuth={openAuth}
        onOpenPricing={() => (window.location.href = "/#pricing")}
      />

      <main className="flex-1">
        <div className="container py-10 md:py-14">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <Icon name="ArrowLeft" size={15} />
            На главную
          </Link>

          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-coral">Для педагога</span>
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-2 flex items-center gap-3">
              <span className="text-3xl">📊</span> Качественный анализ по предметам и дисциплинам
            </h1>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              Автоматизированный расчёт качества знаний, успеваемости и среднего балла по группам и
              дисциплинам: сводные таблицы, динамика и экспорт отчётов.
            </p>
          </div>

          <div className="max-w-2xl mb-8 rounded-2xl border border-border bg-muted/30 p-5 sm:p-6">
            <p className="text-sm font-semibold mb-3">Как пользоваться инструментом</p>
            <ol className="space-y-2.5 text-sm text-muted-foreground leading-relaxed">
              <li className="flex gap-2.5">
                <span className="shrink-0 font-semibold text-foreground">1.</span>
                <span>
                  Во вкладке «Ввод данных» укажите дисциплину, группу и период контроля (начало или
                  окончание курса), внесите количество оценок «2», «3», «4» и «5» и нажмите «Добавить
                  запись».
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="shrink-0 font-semibold text-foreground">2.</span>
                <span>
                  Внесите записи по обоим периодам (начало и окончание) для каждой пары «дисциплина —
                  группа» — тогда система сможет рассчитать динамику и прирост качества знаний.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="shrink-0 font-semibold text-foreground">3.</span>
                <span>
                  Во вкладке «Сводная таблица» отфильтруйте данные по дисциплине или группе и скачайте
                  отчёт в CSV, Excel, TXT или HTML, либо распечатайте его.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="shrink-0 font-semibold text-foreground">4.</span>
                <span>
                  Во вкладке «Аналитика» посмотрите сводные показатели и автоматические комментарии по
                  динамике каждой группы. Данные сохраняются локально в браузере — их можно выгрузить
                  или импортировать через вкладку «Управление».
                </span>
              </li>
            </ol>
          </div>

          {!isPaid ? (
            <div className="max-w-xl rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-3xl mb-4">
                🔒
              </div>
              <p className="font-display text-lg font-bold mb-1.5">Доступно по подписке</p>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed max-w-sm mx-auto">
                Качественный анализ по предметам и дисциплинам — премиум-инструмент. Оформите подписку,
                чтобы вести учёт успеваемости, строить сводные таблицы и получать аналитику без
                ограничений.
              </p>
              <Button
                className="h-11 px-6 gap-2 bg-primary hover:bg-primary/90"
                onClick={user ? openUpgrade : openAuth}
              >
                <Icon name={user ? "Sparkles" : "LogIn"} size={17} />
                {user ? "Оформить подписку" : "Войти и оформить подписку"}
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-3 md:p-5 shadow-sm overflow-x-auto">
              <iframe
                src="/kachestvo-znaniy.html"
                title="Качественный анализ по предметам и дисциплинам"
                className="w-full min-w-[900px] h-[1100px] rounded-xl border-0"
              />
            </div>
          )}
        </div>
      </main>

      <Footer
        onOpenProfile={() => setProfileOpen(true)}
        onOpenRandomizer={() => setRandomizerOpen(true)}
        onOpenAntiplagiat={() => setAntiplagiatOpen(true)}
      />

      <DecomposerModal
        open={decomposerOpen}
        onClose={() => setDecomposerOpen(false)}
        onNeedAuth={openAuth}
        onNeedUpgrade={openUpgrade}
      />
      <RandomizerModal open={randomizerOpen} onClose={() => setRandomizerOpen(false)} />
      <AntiplagiatModal
        open={antiplagiatOpen}
        onClose={() => setAntiplagiatOpen(false)}
        onNeedAuth={openAuth}
        onNeedUpgrade={openUpgrade}
      />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} onNeedAuth={openAuth} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} onNeedAuth={openAuth} />
    </div>
  );
};

export default QualityAnalysisTool;
