import { useState } from 'react';
import { LogIn, UserPlus, Sparkles } from 'lucide-react';

interface AuthPageProps {
  onAuth: (nickname: string, isNewUser: boolean) => void;
}

export function AuthPage({ onAuth }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.length < 2) {
      alert('昵称至少需要2个字符');
      return;
    }

    setIsLoading(true);
    try {
      await onAuth(nickname, mode === 'register');
    } catch (error) {
      console.error('认证失败:', error);
      alert('操作失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">你好局长</h1>
          <p className="text-gray-600">专注换晋升，开启您的职场之旅</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              mode === 'login'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <LogIn className="w-5 h-5 inline-block mr-2" />
            登录
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              mode === 'register'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <UserPlus className="w-5 h-5 inline-block mr-2" />
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {mode === 'register' ? '设置昵称' : '输入昵称'}
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="请输入您的昵称"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none transition-colors"
              maxLength={20}
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              {mode === 'register'
                ? '昵称将显示在排行榜上，至少2个字符'
                : '使用注册时的昵称登录'}
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || nickname.length < 2}
            className="w-full py-4 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isLoading ? '处理中...' : mode === 'register' ? '创建账户并开始' : '登录'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>本应用使用Supabase安全存储您的数据</p>
          <p className="mt-1">我们不会收集任何敏感个人信息</p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-3">功能亮点</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-500">✓</span>
              <span>云端同步，跨设备访问您的数据</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500">✓</span>
              <span>每周清零，公平竞争排行榜</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-500">✓</span>
              <span>10级职位晋升，专注即可升级</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
