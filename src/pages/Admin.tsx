import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import { adminGet } from "@/lib/adminApi";
import StatsTab from "@/components/admin/StatsTab";
import NewsTab from "@/components/admin/NewsTab";
import FeedbackTab from "@/components/admin/FeedbackTab";
import ExperienceTab from "@/components/admin/ExperienceTab";

const Admin = () => {
  const { token, user } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setAllowed(false);
      return;
    }
    adminGet("check", token).then(() => setAllowed(true)).catch(() => setAllowed(false));
  }, [token, user]);

  if (allowed === null) return <div className="p-8 text-muted-foreground">Загрузка...</div>;

  if (!allowed || !token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
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
        <h1 className="font-display text-2xl md:text-3xl font-bold">Панель администратора</h1>
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
      </Tabs>
    </div>
  );
};

export default Admin;
