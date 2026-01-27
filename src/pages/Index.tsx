import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Template {
  id: string;
  name: string;
  baseUrl: string;
  createdAt: string;
}

interface GeneratedLink {
  id: string;
  templateId: string;
  templateName: string;
  fullUrl: string;
  status: 'new' | 'used';
  createdAt: string;
}

const Index = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Humanconf Education',
      baseUrl: 'https://humanconf.ru/education/reg?token=',
      createdAt: '2026-01-27 14:30',
    },
  ]);

  const [links, setLinks] = useState<GeneratedLink[]>([
    {
      id: '1',
      templateId: '1',
      templateName: 'Humanconf Education',
      fullUrl: 'https://humanconf.ru/education/reg?token=bfd72eff-4024-429c-8062-3ae7ebe699aa',
      status: 'new',
      createdAt: '2026-01-28 10:15',
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', baseUrl: '' });

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const createTemplate = () => {
    if (!newTemplate.name || !newTemplate.baseUrl) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    const template: Template = {
      id: Date.now().toString(),
      name: newTemplate.name,
      baseUrl: newTemplate.baseUrl,
      createdAt: new Date().toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setTemplates([template, ...templates]);
    setNewTemplate({ name: '', baseUrl: '' });
    setIsDialogOpen(false);
    toast({
      title: 'Шаблон создан',
      description: `Шаблон "${template.name}" успешно сохранён`,
    });
  };

  const generateLink = (template: Template) => {
    const uuid = generateUUID();
    const fullUrl = `${template.baseUrl}${uuid}`;

    const newLink: GeneratedLink = {
      id: Date.now().toString(),
      templateId: template.id,
      templateName: template.name,
      fullUrl,
      status: 'new',
      createdAt: new Date().toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setLinks([newLink, ...links]);
    toast({
      title: 'Ссылка сгенерирована',
      description: 'Ссылка добавлена в Google Таблицу',
    });
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'Скопировано',
      description: 'Ссылка скопирована в буфер обмена',
    });
  };

  const stats = {
    total: links.length,
    new: links.filter((l) => l.status === 'new').length,
    used: links.filter((l) => l.status === 'used').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <header className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500 mb-4 shadow-lg">
            <Icon name="Link2" size={32} className="text-white" />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-3">Генератор ссылок</h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Создавайте шаблоны и генерируйте уникальные ссылки с автоматической интеграцией в
            Google Таблицы
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-scale-in">
          <Card className="p-6 bg-white shadow-sm border-slate-200 hover-scale">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Icon name="Link" size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Всего ссылок</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white shadow-sm border-slate-200 hover-scale">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Icon name="CheckCircle2" size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Новых</p>
                <p className="text-3xl font-bold text-slate-900">{stats.new}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white shadow-sm border-slate-200 hover-scale">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Icon name="Clock" size={24} className="text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Использовано</p>
                <p className="text-3xl font-bold text-slate-900">{stats.used}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-white shadow-sm border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-slate-900 flex items-center">
                <Icon name="FileText" size={28} className="mr-3 text-blue-500" />
                Шаблоны
              </h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                    <Icon name="Plus" size={18} className="mr-2" />
                    Создать
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Новый шаблон</DialogTitle>
                    <DialogDescription>
                      Создайте шаблон для генерации уникальных ссылок
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Название шаблона</Label>
                      <Input
                        id="name"
                        placeholder="Например: Humanconf Education"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="baseUrl">Базовый URL</Label>
                      <Input
                        id="baseUrl"
                        placeholder="https://example.com/page?token="
                        value={newTemplate.baseUrl}
                        onChange={(e) =>
                          setNewTemplate({ ...newTemplate, baseUrl: e.target.value })
                        }
                      />
                      <p className="text-xs text-slate-500">
                        URL должен заканчиваться на параметр, к которому будет добавлен UUID
                      </p>
                    </div>
                    <Button onClick={createTemplate} className="w-full bg-blue-500 hover:bg-blue-600">
                      <Icon name="Check" size={18} className="mr-2" />
                      Создать шаблон
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {templates.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Icon name="FileX" size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Нет шаблонов</p>
                </div>
              ) : (
                templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 mb-1">{template.name}</h3>
                        <p className="text-sm text-slate-600 font-mono truncate">
                          {template.baseUrl}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{template.createdAt}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => generateLink(template)}
                        className="shrink-0 ml-3 bg-blue-500 hover:bg-blue-600"
                      >
                        <Icon name="Sparkles" size={16} className="mr-1" />
                        Генерировать
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6 bg-white shadow-sm border-slate-200 animate-fade-in">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center">
              <Icon name="List" size={28} className="mr-3 text-blue-500" />
              Сгенерированные ссылки
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {links.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Icon name="Link2Off" size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Нет сгенерированных ссылок</p>
                </div>
              ) : (
                links.map((link) => (
                  <div
                    key={link.id}
                    className="p-4 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="secondary"
                            className={
                              link.status === 'new'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-slate-200 text-slate-700'
                            }
                          >
                            {link.status === 'new' ? '🟢 New' : '⚪ Used'}
                          </Badge>
                          <span className="text-xs text-slate-500">{link.createdAt}</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-1">{link.templateName}</p>
                        <p className="text-sm text-slate-700 font-mono break-all">{link.fullUrl}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(link.fullUrl)}
                        className="shrink-0"
                      >
                        <Icon name="Copy" size={16} />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <Card className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 animate-fade-in">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
              <Icon name="Database" size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2 text-lg">
                Интеграция с Google Таблицами
              </h3>
              <p className="text-sm text-blue-800 mb-2">
                Все сгенерированные ссылки автоматически сохраняются в Google Таблицу с полями:
              </p>
              <div className="flex gap-4 text-sm">
                <Badge variant="outline" className="bg-white border-blue-300 text-blue-900">
                  📎 link
                </Badge>
                <Badge variant="outline" className="bg-white border-blue-300 text-blue-900">
                  🟢 status
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
