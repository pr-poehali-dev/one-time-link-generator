import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Link {
  id: string;
  url: string;
  status: 'active' | 'used';
  createdAt: string;
  tickets: number;
}

const Index = () => {
  const { toast } = useToast();
  const [links, setLinks] = useState<Link[]>([
    {
      id: '1',
      url: 'https://creatium.com/register/abc123xyz',
      status: 'active',
      createdAt: '2026-01-27 14:30',
      tickets: 1,
    },
    {
      id: '2',
      url: 'https://creatium.com/register/def456uvw',
      status: 'used',
      createdAt: '2026-01-26 10:15',
      tickets: 3,
    },
  ]);

  const [amoSettings, setAmoSettings] = useState({
    pipelineStage: '',
    ticketsField: '',
    linkField: '',
  });

  const generateLink = () => {
    const newLink: Link = {
      id: Date.now().toString(),
      url: `https://creatium.com/register/${Math.random().toString(36).substring(7)}`,
      status: 'active',
      createdAt: new Date().toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      tickets: 1,
    };
    setLinks([newLink, ...links]);
    toast({
      title: 'Ссылка создана',
      description: 'Новая одноразовая ссылка успешно сгенерирована',
    });
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'Скопировано',
      description: 'Ссылка скопирована в буфер обмена',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Генератор одноразовых ссылок
          </h1>
          <p className="text-slate-600 text-lg">
            Создавайте уникальные ссылки для регистрации в Creatium с автоматической деактивацией
          </p>
        </header>

        <Tabs defaultValue="generator" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="generator" className="text-base">
              <Icon name="Link" size={18} className="mr-2" />
              Генератор
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-base">
              <Icon name="Settings" size={18} className="mr-2" />
              Настройки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="space-y-6">
            <Card className="p-8 bg-white shadow-sm border-slate-200">
              <div className="flex flex-col items-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon name="Link2" size={40} className="text-primary" />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                    Создать новую ссылку
                  </h2>
                  <p className="text-slate-600">
                    Нажмите кнопку ниже для генерации уникальной одноразовой ссылки
                  </p>
                </div>
                <Button onClick={generateLink} size="lg" className="px-8">
                  <Icon name="Plus" size={20} className="mr-2" />
                  Сгенерировать ссылку
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-white shadow-sm border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                <Icon name="List" size={24} className="mr-2 text-primary" />
                История ссылок
              </h3>
              <div className="space-y-3">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-3 mb-1">
                        <Badge
                          variant={link.status === 'active' ? 'default' : 'secondary'}
                          className={
                            link.status === 'active'
                              ? 'bg-green-100 text-green-800 hover:bg-green-100'
                              : 'bg-slate-200 text-slate-700'
                          }
                        >
                          {link.status === 'active' ? 'Активна' : 'Использована'}
                        </Badge>
                        <span className="text-sm text-slate-500">{link.createdAt}</span>
                      </div>
                      <p className="text-sm text-slate-700 font-mono truncate">{link.url}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(link.url)}
                      className="shrink-0"
                    >
                      <Icon name="Copy" size={16} className="mr-2" />
                      Копировать
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="p-8 bg-white shadow-sm border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon name="Settings2" size={24} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Настройки amoCRM</h2>
                  <p className="text-slate-600">Настройте интеграцию с вашей CRM-системой</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="pipeline" className="text-base">
                    Этап воронки
                  </Label>
                  <Input
                    id="pipeline"
                    placeholder="Например: Оплачено"
                    value={amoSettings.pipelineStage}
                    onChange={(e) =>
                      setAmoSettings({ ...amoSettings, pipelineStage: e.target.value })
                    }
                    className="h-11"
                  />
                  <p className="text-sm text-slate-500">
                    Укажите название этапа, при котором будет генерироваться ссылка
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tickets" className="text-base">
                    Поле с количеством билетов
                  </Label>
                  <Input
                    id="tickets"
                    placeholder="Например: Количество участников"
                    value={amoSettings.ticketsField}
                    onChange={(e) =>
                      setAmoSettings({ ...amoSettings, ticketsField: e.target.value })
                    }
                    className="h-11"
                  />
                  <p className="text-sm text-slate-500">
                    Поле в сделке, определяющее количество генерируемых ссылок
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkField" className="text-base">
                    Поле для сохранения ссылки
                  </Label>
                  <Input
                    id="linkField"
                    placeholder="Например: Ссылка на регистрацию"
                    value={amoSettings.linkField}
                    onChange={(e) =>
                      setAmoSettings({ ...amoSettings, linkField: e.target.value })
                    }
                    className="h-11"
                  />
                  <p className="text-sm text-slate-500">
                    Поле в сделке, куда будет записана сгенерированная ссылка
                  </p>
                </div>

                <div className="pt-4">
                  <Button size="lg" className="w-full">
                    <Icon name="Save" size={20} className="mr-2" />
                    Сохранить настройки
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex gap-3">
                <Icon name="Info" size={24} className="text-blue-600 shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Как работает интеграция</h3>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• При переходе сделки на указанный этап автоматически генерируются ссылки</li>
                    <li>• Количество ссылок определяется значением в поле с билетами</li>
                    <li>• Ссылки автоматически записываются в указанное поле сделки</li>
                    <li>• После использования ссылка становится неактивной</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
