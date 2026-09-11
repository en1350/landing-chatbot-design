import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";

/* ---------- Задание 7: Сетевые протоколы ---------- */

interface OsiLevel {
  num: number;
  name: string;
  purpose: string;
  protocols: string;
}

const OSI_LEVELS: OsiLevel[] = [
  { num: 7, name: "Прикладной (Application)", purpose: "Взаимодействие с пользователем", protocols: "HTTP, HTTPS, FTP, SMTP, DNS, Telnet" },
  { num: 6, name: "Представительный (Presentation)", purpose: "Кодирование, шифрование, сжатие", protocols: "SSL/TLS, JPEG, MPEG" },
  { num: 5, name: "Сеансовый (Session)", purpose: "Управление сеансом связи", protocols: "RPC, NetBIOS, PPTP" },
  { num: 4, name: "Транспортный (Transport)", purpose: "Надёжная доставка данных", protocols: "TCP, UDP" },
  { num: 3, name: "Сетевой (Network)", purpose: "Маршрутизация и адресация", protocols: "IP, ICMP, ARP" },
  { num: 2, name: "Канальный (Data Link)", purpose: "Формирование кадров, контроль ошибок", protocols: "Ethernet, Wi-Fi (802.11), PPP" },
  { num: 1, name: "Физический (Physical)", purpose: "Передача битов по среде", protocols: "USB, RJ-45, оптоволокно" },
];

interface TcpIpLevel {
  name: string;
  osi: string;
  protocols: string;
}

const TCPIP_LEVELS: TcpIpLevel[] = [
  { name: "Прикладной", osi: "Прикладной + Представительный + Сеансовый", protocols: "HTTP, FTP, SMTP, DNS" },
  { name: "Транспортный", osi: "Транспортный", protocols: "TCP, UDP" },
  { name: "Интернет", osi: "Сетевой", protocols: "IP, ICMP" },
  { name: "Сетевого доступа", osi: "Канальный + Физический", protocols: "Ethernet, Wi-Fi" },
];

const NETWORK_PROTOCOLS_LIST = [
  { name: "IP (Internet Protocol)", desc: "маршрутизация пакетов по адресу." },
  { name: "TCP (Transmission Control Protocol)", desc: "надёжная доставка с установлением соединения." },
  { name: "UDP (User Datagram Protocol)", desc: "быстрая, но ненадёжная доставка без соединения." },
  { name: "HTTP/HTTPS", desc: "передача веб-страниц (HTTPS — с шифрованием)." },
  { name: "FTP", desc: "передача файлов." },
  { name: "SMTP/POP3/IMAP", desc: "электронная почта." },
  { name: "DNS", desc: "преобразование доменных имён в IP-адреса." },
];

interface NetworkQuestion {
  q: string;
  options: string[];
  correct: number;
}

const NETWORK_QUIZ: NetworkQuestion[] = [
  { q: "Сколько уровней в эталонной модели OSI?", options: ["4", "5", "7", "6"], correct: 2 },
  { q: "Какой уровень модели OSI отвечает за маршрутизацию пакетов?", options: ["Транспортный", "Сетевой", "Канальный", "Сеансовый"], correct: 1 },
  { q: "На каком уровне модели OSI работает протокол IP?", options: ["Прикладной", "Транспортный", "Сетевой", "Физический"], correct: 2 },
  { q: "Какой протокол работает на транспортном уровне?", options: ["HTTP", "IP", "TCP", "Ethernet"], correct: 2 },
  { q: "Какой уровень OSI обеспечивает надёжную доставку данных с установлением соединения?", options: ["Сетевой", "Канальный", "Транспортный", "Прикладной"], correct: 2 },
  { q: "На каком уровне модели OSI работает протокол HTTP?", options: ["Транспортный", "Сетевой", "Прикладной", "Представительный"], correct: 2 },
  { q: "Какой протокол работает преимущественно на канальном уровне?", options: ["IP", "TCP", "Ethernet", "HTTP"], correct: 2 },
  { q: "Сколько уровней в модели TCP/IP?", options: ["4", "5", "6", "7"], correct: 0 },
  { q: "Какой протокол используется для преобразования доменных имён в IP-адреса?", options: ["HTTP", "FTP", "DNS", "SMTP"], correct: 2 },
  { q: "Какой протокол обеспечивает быструю, но ненадёжную передачу данных без установления соединения?", options: ["TCP", "UDP", "IP", "HTTP"], correct: 1 },
];

const NetworkProtocolsTask = () => {
  const [step, setStep] = useState<"register" | "theory" | "quiz" | "result">("register");
  const [studentName, setStudentName] = useState("");
  const [studentGroup, setStudentGroup] = useState("");
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const score = NETWORK_QUIZ.reduce((acc, item, i) => (answers[i] === item.correct ? acc + 1 : acc), 0);
  const percent = (score / NETWORK_QUIZ.length) * 100;

  let grade = "2 (неудовлетворительно)";
  let gradeMessage = "К сожалению, материал нужно изучить повторно.";
  if (percent >= 90) {
    grade = "5 (отлично)";
    gradeMessage = "Превосходный результат! Вы отлично разбираетесь в теме.";
  } else if (percent >= 75) {
    grade = "4 (хорошо)";
    gradeMessage = "Хороший результат! Есть небольшие пробелы.";
  } else if (percent >= 60) {
    grade = "3 (удовлетворительно)";
    gradeMessage = "Базовые знания есть, но рекомендуем повторить материал.";
  }

  const today = new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });

  const reset = () => {
    setStep("register");
    setStudentName("");
    setStudentGroup("");
    setAnswers({});
  };

  if (step === "register") {
    return (
      <div className="space-y-4 max-w-sm">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Фамилия Имя обучающегося</label>
          <Input
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Например: Иванов Иван"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Группа</label>
          <Input
            value={studentGroup}
            onChange={(e) => setStudentGroup(e.target.value)}
            placeholder="Например: ИС-21"
          />
        </div>
        <Button
          className="w-full h-11 gap-2"
          disabled={!studentName.trim() || !studentGroup.trim()}
          onClick={() => setStep("theory")}
        >
          <Icon name="ArrowRight" size={16} />
          Начать обучение
        </Button>
      </div>
    );
  }

  if (step === "theory") {
    return (
      <div className="space-y-6">
        <p className="text-sm leading-relaxed">
          <strong>Сетевой протокол</strong> — это набор правил и соглашений, определяющих формат и порядок обмена
          данными между устройствами в компьютерной сети.
        </p>

        <div>
          <h3 className="font-display font-bold text-base mb-2">1. Модель OSI (Open Systems Interconnection)</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Эталонная модель, разработанная ISO в 1984 году. Состоит из <strong>7 уровней</strong>, каждый из
            которых выполняет свою функцию:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-border p-2 text-left">№</th>
                  <th className="border border-border p-2 text-left">Уровень</th>
                  <th className="border border-border p-2 text-left">Назначение</th>
                  <th className="border border-border p-2 text-left">Примеры протоколов</th>
                </tr>
              </thead>
              <tbody>
                {OSI_LEVELS.map((l) => (
                  <tr key={l.num} className="even:bg-secondary/40">
                    <td className="border border-border p-2">{l.num}</td>
                    <td className="border border-border p-2">{l.name}</td>
                    <td className="border border-border p-2">{l.purpose}</td>
                    <td className="border border-border p-2">{l.protocols}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="font-display font-bold text-base mb-2">2. Модель TCP/IP</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Более практичная модель, лежащая в основе Интернета. Состоит из <strong>4 уровней</strong>:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-border p-2 text-left">Уровень TCP/IP</th>
                  <th className="border border-border p-2 text-left">Соответствие OSI</th>
                  <th className="border border-border p-2 text-left">Протоколы</th>
                </tr>
              </thead>
              <tbody>
                {TCPIP_LEVELS.map((l) => (
                  <tr key={l.name} className="even:bg-secondary/40">
                    <td className="border border-border p-2">{l.name}</td>
                    <td className="border border-border p-2">{l.osi}</td>
                    <td className="border border-border p-2">{l.protocols}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="font-display font-bold text-base mb-2">3. Ключевые протоколы</h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
            {NETWORK_PROTOCOLS_LIST.map((p) => (
              <li key={p.name}>
                <strong className="text-foreground">{p.name}</strong> — {p.desc}
              </li>
            ))}
          </ul>
        </div>

        <Button className="w-full h-11 gap-2" onClick={() => setStep("quiz")}>
          Перейти к тестированию
          <Icon name="ArrowRight" size={16} />
        </Button>
      </div>
    );
  }

  if (step === "quiz") {
    return (
      <div className="space-y-5">
        {NETWORK_QUIZ.map((item, i) => (
          <div key={i}>
            <p className="font-medium text-sm mb-2">
              {i + 1}. {item.q}
            </p>
            <div className="space-y-1.5">
              {item.options.map((opt, oi) => {
                const isSelected = answers[i] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-sm transition-colors ${
                      isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <Button
          className="w-full h-11 gap-2"
          disabled={Object.keys(answers).length < NETWORK_QUIZ.length}
          onClick={() => setStep("result")}
        >
          <Icon name="CheckCircle2" size={16} />
          Завершить тест
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-secondary/60 to-secondary/20 p-6 text-center">
        <p className="text-2xl mb-2">🎉</p>
        <h2 className="font-display font-bold text-lg mb-1">Тестирование завершено!</h2>
        <p className="text-sm text-muted-foreground mb-1">
          {studentName} ({studentGroup})
        </p>
        <p className="font-display text-4xl font-bold text-primary my-3">
          {score} / {NETWORK_QUIZ.length}
        </p>
        <p className="font-semibold mb-1">Оценка: {grade}</p>
        <p className="text-sm text-muted-foreground">{gradeMessage}</p>
      </div>

      <div className="print:block rounded-2xl border-[6px] border-double border-amber-500/60 bg-white p-6 sm:p-10 text-center">
        <p className="font-display text-2xl sm:text-3xl tracking-widest text-primary mb-1">СЕРТИФИКАТ</p>
        <p className="text-sm italic text-muted-foreground mb-6">об успешном прохождении обучения</p>
        <p className="text-sm text-muted-foreground mb-2">Настоящий сертификат подтверждает, что</p>
        <p className="font-display text-2xl sm:text-3xl text-primary border-b-2 border-amber-500/60 inline-block px-6 pb-1 mb-4">
          {studentName}
        </p>
        <p className="leading-relaxed mb-4">
          обучающийся группы <strong>{studentGroup}</strong>
          <br />
          успешно освоил(а) тему
          <br />
          <em>«Сетевые протоколы. Классификация по уровням модели»</em>
        </p>
        <p className="font-display text-xl font-bold text-primary mb-6">Оценка: {grade}</p>
        <div className="flex justify-between items-end px-2 sm:px-10 mt-8">
          <div className="text-xs text-muted-foreground">
            <div className="border-t border-foreground w-32 sm:w-36 pt-1">Преподаватель</div>
          </div>
          <div className="text-xs text-muted-foreground">
            <div className="border-t border-foreground w-32 sm:w-36 pt-1">Обучающийся</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-6">Дата: {today}</p>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        <Button className="gap-2" onClick={() => window.print()}>
          <Icon name="Printer" size={16} />
          Распечатать сертификат
        </Button>
        <Button variant="outline" className="gap-2" onClick={reset}>
          <Icon name="RotateCcw" size={16} />
          Пройти заново
        </Button>
      </div>
    </div>
  );
};

export default NetworkProtocolsTask;
