import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import {
  Gift,
  Settings,
  Users,
  TrendingUp,
  Award,
  DollarSign,
  UserPlus,
  FileText,
  BarChart3,
  Star,
  Plus,
  Edit,
  Save,
  RotateCcw,
  Trash2,
  Eye,
  Target
} from 'lucide-react';

interface RewardSettings {
  points_per_milestone: number;
  milestone_reward: number;
  referral_reward: number;
  first_login_bonus: number;
  max_referral_rewards: number;
}

interface RewardStats {
  totalUsers: number;
  totalFreePoints: number;
  totalEarnedPoints: number;
  totalPrintedPages: number;
  totalReferrals: number;
  rewardTypeStats: Record<string, number>;
  averagePagesPerUser: number;
  averagePointsPerUser: number;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  reward_type: string;
  reward_value: any;
  available: boolean;
  limit_per_user: number | null;
  created_at: string;
}

interface UserOption {
  value: string;
  label: string;
  displayName: string;
  email: string;
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: string;
  target_value: number;
  points_reward: number;
  is_daily: boolean;
  active: boolean;
  created_at: string;
}

export default function RewardsManagement() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<RewardSettings>({
    points_per_milestone: 500,
    milestone_reward: 10,
    referral_reward: 10,
    first_login_bonus: 10,
    max_referral_rewards: 100
  });
  const [originalSettings, setOriginalSettings] = useState<RewardSettings>(settings);
  const [stats, setStats] = useState<RewardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // إدارة المكافآت والتحديات
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [rewardDialog, setRewardDialog] = useState(false);
  const [challengeDialog, setChallengeDialog] = useState(false);

  // منح مكافأة يدوية
  const [manualRewardDialog, setManualRewardDialog] = useState(false);
  const [manualRewardForm, setManualRewardForm] = useState({
    userId: '',
    points: '',
    reason: ''
  });

  // جلب قائمة المستخدمين للقائمة المنسدلة
  const { data: usersResponse, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['/api/admin/users-dropdown'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users-dropdown');
      const data = await response.json();
      return data;
    },
    enabled: manualRewardDialog, // جلب البيانات فقط عند فتح النافذة
  });
  
  const usersList: UserOption[] = usersResponse?.data || [];

  // تحميل الإعدادات الحالية
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', '/api/admin/rewards/settings');
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
        setOriginalSettings(data.data);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // استخدام القيم الافتراضية إذا فشل التحميل
      toast({
        title: 'تحذير',
        description: 'تم تحميل الإعدادات الافتراضية. تأكد من حفظ التغييرات.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // تحميل الإحصائيات
  const loadStats = async () => {
    try {
      const response = await apiRequest('GET', '/api/admin/rewards/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="rewards-management-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2" data-testid="page-title">
          إدارة المكافآت
        </h1>
        <p className="text-gray-600 dark:text-gray-400" data-testid="page-description">
          إدارة نظام المكافآت والتحديات للمستخدمين
        </p>
      </div>

      <Card data-testid="test-message-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            اختبار الصفحة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-green-600 text-lg font-semibold" data-testid="success-message">
              ✅ تم تحميل صفحة إدارة المكافآت بنجاح!
            </p>
            <p className="text-gray-600" data-testid="test-info">
              هذه رسالة اختبار للتأكد من أن الراوت يعمل بشكل صحيح.
            </p>
            <Button 
              onClick={() => toast({ title: "نجح الاختبار", description: "الصفحة تعمل بشكل طبيعي" })}
              data-testid="test-button"
            >
              اختبر التوست
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}