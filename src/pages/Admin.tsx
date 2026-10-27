import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import SiteLogoLink from "@/components/SiteLogoLink";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import { adminGet } from "@/lib/adminApi";
import StatsTab from "@/components/admin/StatsTab";
import NewsTab from "@/components/admin/NewsTab";
import FeedbackTab from "@/components/admin/FeedbackTab";
import ExperienceTab from "@/components/admin/ExperienceTab";
import MailingTab from "@/components/admin/MailingTab";

const Admin = () => {
  const { token, user, loading } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!token) {
      setAllowed(false);
      return;
    }
    adminGet("check", token).then(() => setAllowed(true)).catch(() => setAllowed(false));
  }, [token, user, loading]);

  if (allowed === null) return <div className="p-8 text-muted-foreground">Загрузка...</div>;

  if (!allowed || !token) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="absolute left-4 top-4 sm:left-6 sm:top-5">
          <SiteLogoLink />
        </div>
        <Icon name="Lock" size={40} className="text-muted-foreground" />
        <p className="text-lg">Доступ только для администратора. Войдите под своим аккаунтом на главной странице.</p>
        <Button asChild>
          <Link to="/">На главную</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex min-w-0 items-center gap-4">
          <SiteLogoLink />
          <h1 className="font-display text-2xl md:text-3xl font-bold">Панель администратора</h1>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/">На сайт</Link>
        </Button>
      </div>
      <Tabs defaultValue="stats">
        <TabsList className="mb-4">
          <TabsTrigger value="stats">Посетители и метрика</TabsTrigger>
          <TabsTrigger value="news">Новости</TabsTrigger>
          <TabsTrigger value="feedback">Отзывы</TabsTrigger>
          <TabsTrigger value="experience">Модерация ленты опыта</TabsTrigger>
          <TabsTrigger value="mailing">Рассылка</TabsTrigger>
        </TabsList>
        <TabsContent value="stats">
          <StatsTab token={token} />
        </TabsContent>
        <TabsContent value="news">
          <NewsTab token={token} />
        </TabsContent>
        <TabsContent value="feedback">
          <FeedbackTab token={token} />
        </TabsContent>
        <TabsContent value="experience">
          <ExperienceTab token={token} />
        </TabsContent>
        <TabsContent value="mailing">
          <MailingTab token={token} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;