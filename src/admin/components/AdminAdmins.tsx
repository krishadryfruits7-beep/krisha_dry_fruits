import { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  Users,
  KeyRound,
} from 'lucide-react';
import { useAdminWhitelist, isPermanentAdmin } from '@/admin-auth';

export default function AdminAdmins() {
  const { emails, addAdmin, removeAdmin } = useAdminWhitelist();
  const [newEmail, setNewEmail] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    const res = addAdmin(newEmail);
    setStatusMsg({ text: res.message, error: !res.success });
    if (res.success) {
      setNewEmail('');
    }
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleRemove = (email: string) => {
    if (!confirm(`Are you sure you want to revoke admin access for ${email}?`)) return;
    const res = removeAdmin(email);
    setStatusMsg({ text: res.message, error: !res.success });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-luxury border border-brand-200/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-forest-100 text-forest-800">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-950">
              Admin Team & Access Control
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-brand-600 mt-1 max-w-2xl">
            Authorize executive team members to access the Krisha Admin Console via Google Sign-In. Non-whitelisted accounts will be denied entry automatically.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-xs font-semibold">
          <KeyRound className="w-3.5 h-3.5" />
          <span>Google OAuth Protected</span>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border text-sm font-medium flex items-center gap-2.5 shadow-sm animate-fade-in ${
            statusMsg.error
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {statusMsg.error ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Grant Privileges Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-luxury border border-brand-200/60 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-brand-100">
            <UserPlus className="w-4 h-4 text-brand-700" />
            <h2 className="font-serif text-base font-bold text-brand-950">
              Authorize New Admin
            </h2>
          </div>

          <p className="text-xs text-brand-600 leading-relaxed">
            Enter the Google email address of the team member you wish to authorize. They can immediately log in using their Google account.
          </p>

          <form onSubmit={handleAdd} className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-bold text-brand-900 block mb-1.5">
                Google Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. manager@gmail.com"
                  className="input-field pl-10 text-xs sm:text-sm"
                  required
                />
                <Mail className="w-4 h-4 text-brand-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full btn-primary py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Grant Admin Access</span>
            </button>
          </form>

          <div className="p-4 rounded-2xl bg-cream-100/70 border border-brand-200 text-xs text-brand-700 space-y-1.5 mt-4">
            <div className="font-bold flex items-center gap-1.5 text-brand-900">
              <Lock className="w-3.5 h-3.5 text-brand-600" />
              <span>Security Access Rules:</span>
            </div>
            <p>• Only authorized team Google accounts can log into the executive console.</p>
            <p>• Primary root super-admin accounts have permanent protected access.</p>
            <p>• You can authorize or revoke access for additional team members at any time.</p>
          </div>
        </div>

        {/* Right Column: Whitelist Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-luxury border border-brand-200/60 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-brand-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-700" />
              <h2 className="font-serif text-base font-bold text-brand-950">
                Active Authorized Administrators
              </h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800">
              {emails.length} Authorized
            </span>
          </div>

          <div className="space-y-3">
            {emails.map((email) => {
              const isPermanent = isPermanentAdmin(email);
              return (
                <div
                  key={email}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    isPermanent
                      ? 'bg-amber-50/60 border-amber-200/80 shadow-sm'
                      : 'bg-cream-50/50 border-brand-200/70 hover:border-brand-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                        isPermanent
                          ? 'bg-gradient-to-tr from-amber-600 to-brand-600 text-white shadow-sm'
                          : 'bg-brand-200 text-brand-800'
                      }`}
                    >
                      {email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-brand-950">{email}</span>
                        {isPermanent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-600 text-white shadow-sm">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Permanent Super Admin</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-brand-500">
                        {isPermanent ? 'Full root console privileges (unrevokable)' : 'Authorized Management Privileges'}
                      </span>
                    </div>
                  </div>

                  <div>
                    {isPermanent ? (
                      <span className="text-xs font-medium text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Protected</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRemove(email)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                        title="Revoke admin privileges"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Revoke</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
