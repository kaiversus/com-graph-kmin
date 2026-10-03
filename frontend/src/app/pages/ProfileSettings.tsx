import { useState } from 'react';
import { User, Mail, MapPin, Globe, Bell, Lock, CreditCard, Save, Upload } from 'lucide-react';

export function ProfileSettings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications' | 'privacy' | 'billing'>('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'billing', label: 'Billing', icon: CreditCard }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg border border-border p-4 sticky top-8">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl mb-6">Profile Information</h2>
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl">
                    AM
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 mb-2">
                      <Upload className="w-4 h-4" />
                      Upload Photo
                    </button>
                    <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">First Name</label>
                    <input
                      type="text"
                      defaultValue="Alex"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Last Name</label>
                    <input
                      type="text"
                      defaultValue="Morgan"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <input
                    type="email"
                    defaultValue="alex.morgan@example.com"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Bio</label>
                  <textarea
                    defaultValue="Passionate developer with a strong foundation in React and Node.js. Love building scalable web applications and learning new technologies."
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background resize-none"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Location</label>
                    <input
                      type="text"
                      defaultValue="San Francisco, CA"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Website</label>
                    <input
                      type="text"
                      defaultValue="alexmorgan.dev"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Learning Goals</label>
                  <textarea
                    defaultValue="Master full-stack development, build 10 production-ready projects, contribute to open source."
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background resize-none"
                    rows={3}
                  />
                </div>

                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-2xl mb-6">Change Password</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Current Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                  <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                    Update Password
                  </button>
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-2xl mb-6">Connected Accounts</h2>
                <div className="space-y-3">
                  {['Google', 'GitHub', 'LinkedIn'].map((provider) => (
                    <div key={provider} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                          <Globe className="w-5 h-5" />
                        </div>
                        <span className="font-medium">{provider}</span>
                      </div>
                      <button className="px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors">
                        {provider === 'Google' ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-lg border border-red-200 p-6">
                <h2 className="text-2xl mb-4 text-red-600">Danger Zone</h2>
                <div className="space-y-3">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-medium mb-2">Delete Account</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl mb-6">Notification Preferences</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4">Email Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Course updates', description: 'New lessons and announcements' },
                      { label: 'Project feedback', description: 'Mentor reviews and comments' },
                      { label: 'Mentor sessions', description: 'Booking confirmations and reminders' },
                      { label: 'Community activity', description: 'Replies to your questions' },
                      { label: 'Achievement unlocked', description: 'Badges and milestones' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <div className="font-medium">{item.label}</div>
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-4">Push Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Learning reminders', description: 'Daily learning goals' },
                      { label: 'Streak alerts', description: 'Maintain your learning streak' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <div className="font-medium">{item.label}</div>
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl mb-6">Privacy Settings</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4">Profile Visibility</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Public profile', description: 'Your profile is visible to everyone' },
                      { label: 'Show learning progress', description: 'Display your courses and projects' },
                      { label: 'Show achievements', description: 'Display badges and certificates' },
                      { label: 'Show activity', description: 'Display recent learning activity' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <div className="font-medium">{item.label}</div>
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-2xl mb-6">Payment Methods</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-8 h-8" />
                      <div>
                        <div className="font-medium">Visa •••• 4242</div>
                        <div className="text-sm text-muted-foreground">Expires 12/2026</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-sm border border-border rounded hover:bg-background">
                        Edit
                      </button>
                      <button className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
                <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                  Add Payment Method
                </button>
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-2xl mb-6">Billing History</h2>
                <div className="space-y-3">
                  {[
                    { date: 'Apr 1, 2026', description: 'Mentor Session - Sarah Chen', amount: '$85.00' },
                    { date: 'Mar 15, 2026', description: 'Course - Advanced React Patterns', amount: '$49.99' },
                    { date: 'Mar 1, 2026', description: 'Mentor Session - Michael Rodriguez', amount: '$100.00' }
                  ].map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground">{transaction.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{transaction.amount}</div>
                        <button className="text-xs text-primary hover:underline">Download</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
