import { Rank } from './types';

export const RANKS: Record<string, Rank> = {
  intern: {
    id: 'intern',
    name: '实习生',
    points: 0,
    image: 'https://images.unsplash.com/photo-1629314124095-6b46918d57e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    color: '#94a3b8'
  },
  staff: {
    id: 'staff',
    name: '科员',
    points: 840,
    image: 'https://images.unsplash.com/photo-1707138937188-39f5be8fbd3a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    color: '#60a5fa'
  },
  deputy_chief_staff: {
    id: 'deputy_chief_staff',
    name: '副主任科员',
    points: 1120,
    image: 'https://images.unsplash.com/photo-1707138937193-8e14b801bcf0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    color: '#3b82f6'
  },
  chief_staff: {
    id: 'chief_staff',
    name: '主任科员',
    points: 1400,
    image: 'https://images.unsplash.com/photo-1754704631226-c5613ac5abb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    color: '#2563eb'
  },
  deputy_section_chief: {
    id: 'deputy_section_chief',
    name: '副科长',
    points: 1540,
    image: 'https://images.unsplash.com/photo-1706700808836-e3aae6c3a60f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    color: '#8b5cf6'
  },
  section_chief: {
    id: 'section_chief',
    name: '科长',
    points: 1680,
    image: 'https://images.unsplash.com/photo-1726805144759-36e99a57a34d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    color: '#7c3aed'
  },
  deputy_director: {
    id: 'deputy_director',
    name: '副处长',
    points: 2520,
    image: 'https://images.unsplash.com/photo-1711127169047-12f68297c88e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    color: '#f59e0b'
  },
  director: {
    id: 'director',
    name: '处长',
    points: 3360,
    image: 'https://images.unsplash.com/photo-1588378348708-4d5bf6b3bac1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    color: '#ea580c'
  },
  deputy_bureau_chief: {
    id: 'deputy_bureau_chief',
    name: '副局长',
    points: 3780,
    image: 'https://images.unsplash.com/photo-1573739738911-d73a09ab3033?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    color: '#dc2626'
  },
  bureau_chief: {
    id: 'bureau_chief',
    name: '局长',
    points: 4200,
    image: 'https://images.unsplash.com/photo-1588378348708-4d5bf6b3bac1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    color: '#fbbf24'
  }
};

export const FOCUS_DURATIONS = [
  { minutes: 15, label: '15分钟', desc: '实习生任务' },
  { minutes: 30, label: '30分钟', desc: '科员任务' },
  { minutes: 45, label: '45分钟', desc: '科长任务' },
  { minutes: 60, label: '60分钟', desc: '处长任务' },
  { minutes: 90, label: '90分钟', desc: '局长任务' }
];

export const FOCUS_CATEGORIES = [
  { id: 'study', label: '学习', icon: '📚' },
  { id: 'work', label: '工作', icon: '💼' },
  { id: 'exam', label: '备考', icon: '✍️' },
  { id: 'reading', label: '阅读', icon: '📖' },
  { id: 'exercise', label: '运动', icon: '🏃' },
  { id: 'other', label: '其他', icon: '⭐' }
];
