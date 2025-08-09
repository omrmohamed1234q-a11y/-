import { Card } from '@/components/ui/card';

const actions = [
  {
    id: 'quick-print',
    title: 'طباعة سريعة',
    subtitle: 'اطبع الآن',
    icon: 'fas fa-print',
    bgColor: 'bg-accent/10',
    iconColor: 'text-accent',
  },
  {
    id: 'smart-scan',
    title: 'مسح ذكي',
    subtitle: 'OCR + تحرير',
    icon: 'fas fa-camera',
    bgColor: 'bg-success/10',
    iconColor: 'text-success',
  },
  {
    id: 'bounty-points',
    title: 'نقاط المكافآت',
    subtitle: '1,250',
    icon: 'fas fa-coins',
    bgColor: 'bg-gradient-to-br from-warning/10 to-accent/10',
    iconColor: 'text-warning',
    isPoints: true,
  },
  {
    id: 'pdf-tools',
    title: 'أدوات PDF',
    subtitle: 'دمج • تقسيم • ضغط',
    icon: 'fas fa-file-pdf',
    bgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
  },
];

interface QuickActionsProps {
  userPoints?: number;
}

export default function QuickActions({ userPoints = 1250 }: QuickActionsProps) {
  const handleActionClick = (actionId: string) => {
    // TODO: Implement action handlers
    console.log('Action clicked:', actionId);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Card
            key={action.id}
            className={`p-6 hover-lift text-center cursor-pointer transition-all ${
              action.isPoints ? action.bgColor : 'bg-white'
            }`}
            onClick={() => handleActionClick(action.id)}
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${
              action.isPoints ? 'bg-warning/20' : action.bgColor
            }`}>
              <i className={`${action.icon} ${action.iconColor} text-xl`}></i>
            </div>
            <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
            {action.isPoints ? (
              <p className="text-lg font-bold text-warning arabic-nums">
                {userPoints.toLocaleString('ar-EG')}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{action.subtitle}</p>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
