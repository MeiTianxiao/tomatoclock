import { Volume2, VolumeX, Palette, Shield } from 'lucide-react';

interface SettingsPageProps {
  settings: any;
  onUpdateSettings: (settings: any) => void;
  currentUser?: any;
  onLogout?: () => void;
}

export function SettingsPage({ settings, onUpdateSettings, currentUser, onLogout }: SettingsPageProps) {
  const themes = [
    { id: 'business', name: '商务蓝', gradient: 'from-blue-500 to-blue-600' },
    { id: 'simple', name: '简约白', gradient: 'from-gray-400 to-gray-500' },
    { id: 'dark', name: '暗夜黑', gradient: 'from-gray-800 to-black' },
    { id: 'orange', name: '活力橙', gradient: 'from-orange-500 to-red-500' }
  ];

  const whiteNoiseOptions = [
    { id: 'office', name: '办公室', icon: '🏢' },
    { id: 'library', name: '图书馆', icon: '📚' },
    { id: 'cafe', name: '咖啡馆', icon: '☕' },
    { id: 'rain', name: '雨声', icon: '🌧️' },
    { id: 'piano', name: '钢琴', icon: '🎹' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">设置</h1>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            主题设置
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => onUpdateSettings({ ...settings, theme: theme.id })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  settings.theme === theme.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className={`w-full h-12 rounded-lg bg-gradient-to-r ${theme.gradient} mb-2`} />
                <div className="text-sm font-semibold text-gray-700">{theme.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            {settings.soundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
            音效设置
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-semibold text-gray-800">提示音</div>
                <div className="text-sm text-gray-500">专注开始和结束提示</div>
              </div>
              <button
                onClick={() => onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
                className={`w-12 h-6 rounded-full transition-all ${
                  settings.soundEnabled ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-all ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-semibold text-gray-800">晋升音效</div>
                <div className="text-sm text-gray-500">晋升时播放庆祝音效</div>
              </div>
              <button
                onClick={() => onUpdateSettings({ ...settings, promotionSoundEnabled: !settings.promotionSoundEnabled })}
                className={`w-12 h-6 rounded-full transition-all ${
                  settings.promotionSoundEnabled ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-all ${
                    settings.promotionSoundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-semibold text-gray-800">白噪音</div>
                <div className="text-sm text-gray-500">专注时播放背景音</div>
              </div>
              <button
                onClick={() => onUpdateSettings({ ...settings, whiteNoiseEnabled: !settings.whiteNoiseEnabled })}
                className={`w-12 h-6 rounded-full transition-all ${
                  settings.whiteNoiseEnabled ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-all ${
                    settings.whiteNoiseEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {settings.whiteNoiseEnabled && (
              <div className="pl-3">
                <div className="text-sm font-semibold text-gray-700 mb-2">选择白噪音类型</div>
                <div className="grid grid-cols-3 gap-2">
                  {whiteNoiseOptions.map((noise) => (
                    <button
                      key={noise.id}
                      onClick={() => onUpdateSettings({ ...settings, whiteNoiseType: noise.id })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        settings.whiteNoiseType === noise.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{noise.icon}</div>
                      <div className="text-xs font-semibold text-gray-700">{noise.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            隐私设置
          </h2>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-semibold text-gray-800">隐私模式</div>
              <div className="text-sm text-gray-500">隐藏专注记录和排行榜</div>
            </div>
            <button
              onClick={() => onUpdateSettings({ ...settings, privacyMode: !settings.privacyMode })}
              className={`w-12 h-6 rounded-full transition-all ${
                settings.privacyMode ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-all ${
                  settings.privacyMode ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {currentUser && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-4">
            <h2 className="font-bold text-gray-800 mb-4">账户信息</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">昵称</span>
                <span className="font-semibold text-gray-800">{currentUser.nickname}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">累计专注</span>
                <span className="font-semibold text-gray-800">
                  {Math.floor(currentUser.total_focus_minutes / 60)} 小时 {currentUser.total_focus_minutes % 60} 分钟
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">完成任务</span>
                <span className="font-semibold text-gray-800">{currentUser.total_sessions} 次</span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full mt-4 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                >
                  退出登录
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-400">
          版本 1.0.0 · 数据库已连接
        </div>
      </div>
    </div>
  );
}
