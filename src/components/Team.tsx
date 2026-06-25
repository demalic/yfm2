import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLeads } from '../hooks/useLeads';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';
import { Users, Plus, Trash2, TrendingUp, DollarSign, UserPlus } from 'lucide-react';
import type { Member } from '../types';
import { PageHeader } from './ui';

export type TeamSection = 'members' | 'commission';

interface TeamProps {
  section: TeamSection;
}

export function Team({ section }: TeamProps) {
  const { member } = useAuth();
  const { leads } = useLeads();
  const { commissionRate } = useSettings();
  const { showToast } = useToast();

  const [members, setMembers] = useState<Member[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'rep' | 'manager'>('rep');
  const [newMemberPassword, setNewMemberPassword] = useState('');

  useEffect(() => {
    async function loadMembers() {
      try {
        const { data, error } = await supabase
          .from('team')
          .select('*')
          .order('name');

        if (!error && data) {
          setMembers(data as Member[]);
        }
      } catch (err) {
        console.error('Failed to load members:', err);
      }
    }

    loadMembers();
  }, []);

  const teamStats = useMemo(() => {
    return members.map((m) => {
      const memberLeads = leads.filter(
        (l) => l.rep === m.name || l.rep === m.id
      );
      const sold = memberLeads.filter((l) => l.status === 'sold').length;
      const knocked = memberLeads.filter(
        (l) => !['new', 'untouched'].includes(l.status)
      ).length;
      const closeRate = knocked > 0 ? Math.round((sold / knocked) * 100) : 0;
      const commission = sold * commissionRate;

      return {
        ...m,
        sold,
        knocked,
        closeRate,
        commission,
        totalLeads: memberLeads.length,
      };
    });
  }, [members, leads, commissionRate]);

  const sortedBySales = [...teamStats].sort((a, b) => b.sold - a.sold);

  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      showToast('Please enter a name', 'error');
      return;
    }
    if (!newMemberPassword.trim()) {
      showToast('Please enter a password', 'error');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('team')
        .insert({
          name: newMemberName.trim(),
          role: newMemberRole,
          password: newMemberPassword.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setMembers([...members, data as Member]);
      setNewMemberName('');
      setNewMemberRole('rep');
      setNewMemberPassword('');
      setShowAddMember(false);
      showToast('Team member added', 'success');
    } catch (err) {
      console.error('Failed to add member:', err);
      showToast('Failed to add member', 'error');
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Remove this team member?')) return;

    try {
      const { error } = await supabase
        .from('team')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setMembers(members.filter((m) => m.id !== memberId));
      showToast('Team member removed', 'success');
    } catch (err) {
      console.error('Failed to delete member:', err);
      showToast('Failed to remove member', 'error');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return '🔴';
      case 'manager':
        return '🔵';
      default:
        return '🟢';
    }
  };

  return (
    <div className="h-full flex flex-col bg-dark-bg">
      <PageHeader
        title={section === 'members' ? 'Members' : 'Commission'}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {section === 'members' ? (
          <div>
            {/* Add Member Button */}
            <div className="px-4 py-3 border-b border-dark-border">
              <button
                onClick={() => setShowAddMember(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5
                         bg-accent-cyan/20 text-accent-cyan rounded-xl
                         hover:bg-accent-cyan/30 active:scale-[0.98] transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span className="font-medium">Add Team Member</span>
              </button>
            </div>

            {/* Team List */}
            <div className="divide-y divide-dark-border">
              {teamStats.map((m, index) => (
                <div
                  key={m.id}
                  className="px-4 py-4 hover:bg-dark-hover transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-dark-card flex items-center justify-center text-lg">
                      {getRoleIcon(m.role)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{m.name}</p>
                        {index === 0 && m.sold > 0 && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                            Top Seller
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 capitalize">{m.role}</p>

                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span>{m.sold} sold</span>
                        <span>{m.knocked} knocked</span>
                        <span>{m.closeRate}%</span>
                      </div>
                    </div>

                    {m.role !== 'admin' && member?.role === 'admin' && (
                      <button
                        onClick={() => handleDeleteMember(m.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Commission Tab */
          <div>
            {/* Commission Rate Setting */}
            <div className="px-4 py-4 border-b border-dark-border">
              <div className="bg-dark-card rounded-xl p-4 border border-dark-border">
                <p className="text-sm text-gray-400 mb-1">Commission Rate</p>
                <p className="text-2xl font-bold text-white">
                  ${commissionRate.toLocaleString()}
                  <span className="text-sm text-gray-400 font-normal"> per sale</span>
                </p>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="px-4 py-3">
              <h2 className="text-sm font-medium text-gray-400 mb-3">Leaderboard</h2>

              <div className="space-y-2">
                {sortedBySales.map((m, index) => (
                  <div
                    key={m.id}
                    className="bg-dark-card rounded-xl p-4 border border-dark-border flex items-center gap-3"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                  index === 1 ? 'bg-gray-400/20 text-gray-300' :
                                  index === 2 ? 'bg-amber-700/20 text-amber-600' :
                                  'bg-dark-bg text-gray-500'
                                }`}
                    >
                      {index + 1}
                    </div>

                    <div className="flex-1">
                      <p className="font-medium text-white">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.sold} sales</p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-white">
                        ${m.commission.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">{m.closeRate}% rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="w-full max-w-md bg-dark-card rounded-t-3xl border-t border-dark-border bottom-sheet">
            <div className="flex items-center justify-between px-4 py-4 border-b border-dark-border">
              <h3 className="font-semibold text-white">Add Team Member</h3>
              <button
                onClick={() => setShowAddMember(false)}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Name</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Enter name"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3
                           text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan
                           text-base"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Role</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewMemberRole('rep')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors
                              ${newMemberRole === 'rep'
                                ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/50'
                                : 'bg-dark-bg text-gray-400 border border-dark-border'
                              }`}
                  >
                    Rep
                  </button>
                  <button
                    onClick={() => setNewMemberRole('manager')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors
                              ${newMemberRole === 'manager'
                                ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/50'
                                : 'bg-dark-bg text-gray-400 border border-dark-border'
                              }`}
                  >
                    Manager
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Password</label>
                <input
                  type="password"
                  value={newMemberPassword}
                  onChange={(e) => setNewMemberPassword(e.target.value)}
                  placeholder="Set a password"
                  autoComplete="new-password"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3
                           text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan
                           text-base"
                />
              </div>

              <button
                onClick={handleAddMember}
                className="w-full bg-accent-cyan text-white font-semibold py-3 rounded-xl
                         hover:bg-accent-cyan/90 active:scale-[0.98] transition-all"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
