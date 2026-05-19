import { useEffect, useState } from 'react';
import { Coffee, Moon, Activity } from 'lucide-react';

interface HealthReminderProps {
  onClose: () => void;
  type: 'rest' | 'sleep' | 'move';
}

export function HealthReminder({ onClose, type }: HealthReminderProps) {
  const [show, setShow] = useState(true);

  const config = {
    rest: {
      icon: Coffee,
      color: '#f59e0b',
      title: '该休息一下了',
      message: '您已经专注很久了！\n建议站起来走动走动，\n喝杯水，放松一下眼睛。',
      tips: '每专注60分钟，休息10分钟效率更高哦！'
    },
    sleep: {
      icon: Moon,
      color: '#6366f1',
      title: '夜深了，该休息了',
      message: '现在已经很晚了，\n充足的睡眠才能保持\n良好的专注力和健康。',
      tips: '建议您早点休息，明天继续努力！'
    },
    move: {
      icon: Activity,
      color: '#10b981',
      title: '活动一下身体',
      message: '久坐对身体不好哦！\n站起来伸展伸展，\n做做简单的运动。',
      tips: '健康的身体是专注的基础！'
    }
  };

  const { icon: Icon, color, title, message, tips } = config[type];

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl animate-scaleIn">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-8 h-8" style={{ color }} />
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-3">{title}</h2>

        <p className="text-gray-600 whitespace-pre-line mb-4 leading-relaxed">
          {message}
        </p>

        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-500">{tips}</p>
        </div>

        <button
          onClick={handleClose}
          className="w-full py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all"
          style={{ backgroundColor: color }}
        >
          知道了
        </button>
      </div>
    </div>
  );
}

export function useHealthReminders(
  isActive: boolean,
  focusStartTime: number | null,
  showReminder: (type: 'rest' | 'sleep' | 'move') => void
) {
  useEffect(() => {
    if (!isActive || !focusStartTime) return;

    const checkReminders = () => {
      const now = Date.now();
      const focusDuration = (now - focusStartTime) / 1000 / 60;
      const hour = new Date().getHours();

      if (hour >= 23 || hour < 6) {
        showReminder('sleep');
      } else if (focusDuration >= 60 && focusDuration % 60 < 1) {
        showReminder('rest');
      } else if (focusDuration >= 90 && focusDuration % 90 < 1) {
        showReminder('move');
      }
    };

    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [isActive, focusStartTime, showReminder]);
}
