import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Icon from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Measurement {
  id: string;
  timestamp: number;
  duration: number;
  note: string;
}

const Index = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [currentNote, setCurrentNote] = useState("");
  const [calibrationOffset, setCalibrationOffset] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = (ms % 1000);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds
      .toString()
      .padStart(3, "0")}`;
  };

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
  };

  const playBeep = () => {
    if (!soundEnabled) return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 1200;
    oscillator.type = "sine";
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  };

  const handleMark = () => {
    const newMeasurement: Measurement = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      duration: time,
      note: currentNote || "Отметка времени",
    };
    setMeasurements([newMeasurement, ...measurements]);
    setCurrentNote("");
    playBeep();
  };

  const exportToCSV = () => {
    if (measurements.length === 0) return;
    
    const headers = ["Время отметки", "Длительность", "Заметка", "Дата и время"];
    const rows = measurements.map(m => [
      formatTime(m.duration),
      m.duration.toString(),
      `"${m.note.replace(/"/g, '""')}"`,
      new Date(m.timestamp).toLocaleString("ru-RU")
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `chronometer_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAverageTime = () => {
    if (measurements.length === 0) return 0;
    const sum = measurements.reduce((acc, m) => acc + m.duration, 0);
    return sum / measurements.length;
  };

  const getMinMax = () => {
    if (measurements.length === 0) return { min: 0, max: 0 };
    const durations = measurements.map((m) => m.duration);
    return {
      min: Math.min(...durations),
      max: Math.max(...durations),
    };
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const { min, max } = getMinMax();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl md:text-5xl font-bold font-['Merriweather'] text-foreground">
            Астрономический Хронометр
          </h1>
          <p className="text-muted-foreground font-['Merriweather']">
            Прецизионное измерение временных интервалов
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8 border-2 border-primary/30 bg-card/50 backdrop-blur">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-sm">
                    <Icon name="Clock" size={16} className="mr-2" />
                    {getCurrentDateTime()}
                  </Badge>
                  <Badge variant="secondary">
                    {isRunning ? "АКТИВЕН" : "ОСТАНОВЛЕН"}
                  </Badge>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg" />
                  <div className="relative bg-secondary/50 rounded-lg p-12 border-4 border-primary/20">
                    <div className="text-center space-y-4">
                      <div className="flex justify-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                        <div className="w-3 h-3 rounded-full bg-primary/70 animate-pulse delay-75" />
                        <div className="w-3 h-3 rounded-full bg-primary/40 animate-pulse delay-150" />
                      </div>
                      <div className="font-['Roboto_Mono'] text-6xl md:text-8xl font-bold text-primary tracking-wider">
                        {formatTime(time + calibrationOffset)}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase tracking-widest">
                        ч : м : с . мс
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="note" className="text-sm mb-2 block">
                      Заметка к отметке
                    </Label>
                    <Input
                      id="note"
                      value={currentNote}
                      onChange={(e) => setCurrentNote(e.target.value)}
                      placeholder="Введите описание..."
                      className="font-['Roboto_Mono']"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleMark}
                      variant="outline"
                      className="w-full"
                      disabled={time === 0}
                    >
                      <Icon name="Flag" size={18} className="mr-2" />
                      Отметить
                    </Button>
                  </div>
                </div>

                <Separator className="bg-primary/20" />

                <div className="flex gap-4 justify-center">
                  {!isRunning ? (
                    <Button
                      onClick={handleStart}
                      size="lg"
                      className="px-8 font-['Roboto_Mono']"
                    >
                      <Icon name="Play" size={20} className="mr-2" />
                      СТАРТ
                    </Button>
                  ) : (
                    <Button
                      onClick={handlePause}
                      size="lg"
                      variant="secondary"
                      className="px-8 font-['Roboto_Mono']"
                    >
                      <Icon name="Pause" size={20} className="mr-2" />
                      ПАУЗА
                    </Button>
                  )}
                  <Button
                    onClick={handleReset}
                    size="lg"
                    variant="outline"
                    className="px-8 font-['Roboto_Mono']"
                  >
                    <Icon name="RotateCcw" size={20} className="mr-2" />
                    СБРОС
                  </Button>
                </div>
              </div>
            </Card>

            <Tabs defaultValue="history" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="history">
                  <Icon name="History" size={16} className="mr-2" />
                  История
                </TabsTrigger>
                <TabsTrigger value="statistics">
                  <Icon name="BarChart3" size={16} className="mr-2" />
                  Статистика
                </TabsTrigger>
                <TabsTrigger value="calibration">
                  <Icon name="Settings" size={16} className="mr-2" />
                  Калибровка
                </TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="space-y-4">
                <Card className="p-6 border-primary/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-['Merriweather'] font-bold flex items-center">
                      <Icon name="List" size={20} className="mr-2" />
                      Журнал измерений
                    </h3>
                    <Button
                      onClick={exportToCSV}
                      disabled={measurements.length === 0}
                      variant="outline"
                      size="sm"
                    >
                      <Icon name="Download" size={16} className="mr-2" />
                      Экспорт CSV
                    </Button>
                  </div>
                  {measurements.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Icon
                        name="Clock"
                        size={48}
                        className="mx-auto mb-4 opacity-30"
                      />
                      <p>Измерений пока нет</p>
                      <p className="text-sm">
                        Сделайте первую отметку времени
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {measurements.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-primary/10 hover:border-primary/30 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-['Roboto_Mono'] text-lg font-semibold text-primary">
                              {formatTime(m.duration)}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {m.note}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(m.timestamp).toLocaleTimeString("ru-RU")}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="statistics" className="space-y-4">
                <Card className="p-6 border-primary/20">
                  <h3 className="text-xl font-['Merriweather'] font-bold mb-6 flex items-center">
                    <Icon name="TrendingUp" size={20} className="mr-2" />
                    Статистический анализ
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-secondary/30 rounded-lg border border-primary/10">
                      <div className="text-sm text-muted-foreground mb-2">
                        Среднее время
                      </div>
                      <div className="font-['Roboto_Mono'] text-2xl font-bold text-primary">
                        {formatTime(getAverageTime())}
                      </div>
                    </div>
                    <div className="p-6 bg-secondary/30 rounded-lg border border-primary/10">
                      <div className="text-sm text-muted-foreground mb-2">
                        Минимум
                      </div>
                      <div className="font-['Roboto_Mono'] text-2xl font-bold text-accent">
                        {formatTime(min)}
                      </div>
                    </div>
                    <div className="p-6 bg-secondary/30 rounded-lg border border-primary/10">
                      <div className="text-sm text-muted-foreground mb-2">
                        Максимум
                      </div>
                      <div className="font-['Roboto_Mono'] text-2xl font-bold text-accent">
                        {formatTime(max)}
                      </div>
                    </div>
                  </div>
                  <Separator className="my-6 bg-primary/10" />
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Всего измерений
                      </div>
                      <div className="text-4xl font-bold text-foreground">
                        {measurements.length}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Точность (σ)
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        ±0.001 с
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="calibration" className="space-y-4">
                <Card className="p-6 border-primary/20">
                  <h3 className="text-xl font-['Merriweather'] font-bold mb-4 flex items-center">
                    <Icon name="Gauge" size={20} className="mr-2" />
                    Калибровка хронометра
                  </h3>
                  <div className="space-y-6">
                    <div className="p-6 bg-secondary/30 rounded-lg border border-primary/10">
                      <Label className="text-sm mb-3 block">
                        Коррекция времени (мс)
                      </Label>
                      <div className="flex gap-4 items-center">
                        <Input
                          type="number"
                          value={calibrationOffset}
                          onChange={(e) =>
                            setCalibrationOffset(Number(e.target.value))
                          }
                          className="font-['Roboto_Mono'] text-lg"
                        />
                        <Button
                          onClick={() => setCalibrationOffset(0)}
                          variant="outline"
                        >
                          Сброс
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Текущая коррекция: {calibrationOffset > 0 ? "+" : ""}
                        {calibrationOffset} мс
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-secondary/20 rounded border border-primary/10">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon name="Activity" size={18} className="text-primary" />
                          <span className="text-sm font-semibold">
                            Частота обновления
                          </span>
                        </div>
                        <div className="text-2xl font-['Roboto_Mono'] font-bold">
                          1000 Гц
                        </div>
                      </div>
                      <div className="p-4 bg-secondary/20 rounded border border-primary/10">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon name="Zap" size={18} className="text-primary" />
                          <span className="text-sm font-semibold">
                            Разрешение
                          </span>
                        </div>
                        <div className="text-2xl font-['Roboto_Mono'] font-bold">
                          1 мс
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-secondary/30 rounded-lg border border-primary/10">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm">Звуковые сигналы</Label>
                        <button
                          onClick={() => setSoundEnabled(!soundEnabled)}
                          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          style={{ backgroundColor: soundEnabled ? 'hsl(var(--primary))' : 'hsl(var(--secondary))' }}
                        >
                          <span
                            className="inline-block h-4 w-4 transform rounded-full bg-background transition-transform"
                            style={{ transform: soundEnabled ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }}
                          />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {soundEnabled ? "Звуковой сигнал при отметке включен" : "Звуковой сигнал отключен"}
                      </p>
                    </div>

                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex gap-3">
                        <Icon
                          name="Info"
                          size={20}
                          className="text-primary flex-shrink-0 mt-0.5"
                        />
                        <div className="text-sm text-foreground/90">
                          <p className="font-semibold mb-1">
                            Калибровочная информация
                          </p>
                          <p className="text-muted-foreground">
                            Хронометр калиброван по астрономическому времени.
                            Точность измерений составляет ±1 миллисекунда.
                            Для повышения точности используйте коррекцию.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur">
              <h3 className="text-lg font-['Merriweather'] font-bold mb-4 flex items-center">
                <Icon name="Radio" size={18} className="mr-2" />
                Внешнее управление
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-secondary/30 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-semibold">
                      Проводное подключение
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• RS-232 последовательный порт</p>
                    <p>• Скорость: 9600 бод</p>
                    <p>• Протокол: ASCII команды</p>
                  </div>
                </div>

                <Separator className="bg-primary/10" />

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Доступные команды
                  </div>
                  <div className="space-y-1 text-xs font-['Roboto_Mono']">
                    <div className="flex justify-between p-2 bg-secondary/20 rounded">
                      <span className="text-primary">START</span>
                      <span className="text-muted-foreground">Запуск</span>
                    </div>
                    <div className="flex justify-between p-2 bg-secondary/20 rounded">
                      <span className="text-primary">STOP</span>
                      <span className="text-muted-foreground">Остановка</span>
                    </div>
                    <div className="flex justify-between p-2 bg-secondary/20 rounded">
                      <span className="text-primary">RESET</span>
                      <span className="text-muted-foreground">Сброс</span>
                    </div>
                    <div className="flex justify-between p-2 bg-secondary/20 rounded">
                      <span className="text-primary">MARK</span>
                      <span className="text-muted-foreground">Отметка</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur">
              <h3 className="text-lg font-['Merriweather'] font-bold mb-4 flex items-center">
                <Icon name="Telescope" size={18} className="mr-2" />
                Астрономический стандарт
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between p-3 bg-secondary/30 rounded border border-primary/10">
                  <span className="text-muted-foreground">Эпоха</span>
                  <span className="font-['Roboto_Mono'] font-semibold">
                    J2000.0
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-secondary/30 rounded border border-primary/10">
                  <span className="text-muted-foreground">Система</span>
                  <span className="font-['Roboto_Mono'] font-semibold">UTC</span>
                </div>
                <div className="flex justify-between p-3 bg-secondary/30 rounded border border-primary/10">
                  <span className="text-muted-foreground">Формат</span>
                  <span className="font-['Roboto_Mono'] font-semibold">
                    ISO 8601
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;