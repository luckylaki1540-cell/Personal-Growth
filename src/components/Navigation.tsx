/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, LayoutDashboard, Compass, MessageSquareCode, Settings2, Flame, LogOut, CircleUser } from 'lucide-react';
import { UserProfile } from '../types';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: UserProfile | null;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  profile,
  onLogout,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Growth board', icon: LayoutDashboard },
    { id: 'session', label: 'Active Session', icon: Compass },
    { id: 'chat', label: 'Growth Coach', icon: MessageSquareCode },
    { id: 'profile', label: 'Profile & Goals', icon: Settings2 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1F1F22] bg-[#0A0A0B]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Name */}
        <div id="app_brand" className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#2DD4BF] to-[#14B8A6] text-[#0A0A0B] shadow-sm font-bold">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-sans text-sm sm:text-base font-bold tracking-tight text-slate-100">Personal Growth</h1>
            <span className="block text-[9px] font-mono tracking-wider uppercase text-[#2DD4BF]">Bento System V2.4</span>
          </div>
        </div>

        {/* Tab Selection */}
        {profile && (
          <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 border ${
                    isActive
                      ? 'bg-[#141416] text-[#2DD4BF] border-[#262629]'
                      : 'border-transparent text-slate-400 hover:bg-[#141416]/50 hover:text-slate-100'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-[#2DD4BF]' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* User Mini Card & Actions */}
        <div className="flex items-center space-x-4">
          {profile ? (
            <>
              {/* Streak Tracker */}
              <div 
                id="header_streak_widget"
                className="flex items-center space-x-1 rounded-full bg-orange-950/40 border border-orange-900/40 px-3 py-1 font-mono text-xs font-semibold text-orange-400 shadow-sm"
                title={`${profile.streak}-day growth streak`}
              >
                <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500 animate-pulse" />
                <span className="text-[11px]">{profile.streak} Days</span>
              </div>

              {/* XP & Level Summary */}
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-xs font-bold text-slate-100">Level {profile.level}</span>
                <span className="text-[10px] text-slate-500 font-mono">XP: {profile.xp}/{profile.level * 100}</span>
              </div>

              {/* Profile Shortcut */}
              <div 
                id="header-user-avatar"
                className="flex items-center space-x-2 border-l border-[#1F1F22] pl-3"
              >
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-teal-950/50 text-[#2DD4BF] border border-teal-800/40">
                  <span className="text-xs font-bold leading-none">{profile.name.charAt(0).toUpperCase()}</span>
                </div>
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  className="rounded p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                  title="Sign out of your profile"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2 text-slate-500">
              <CircleUser className="h-5 w-5" />
              <span className="text-xs font-medium">Guest Mode</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Tab bar - Stick to bottom on small devices */}
      {profile && (
        <nav 
          id="mobile-bottom-nav" 
          className="flex md:hidden border-t border-[#1F1F22] bg-[#0A0A0B] justify-around py-2 shrink-0 px-2"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`mobile-nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center space-y-0.5 px-3 py-1 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-[#2DD4BF]' : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-[#2DD4BF]' : 'text-slate-500'}`} />
                <span>{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
};
