
import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  CheckCircle2,
  X,
  Save,
  Loader2,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import { customerApi } from '../../services/api';

export default function CustomerProfileModal({
  isOpen,
  onClose,
  sessionId,
  onProfileUpdated,
}) {
  const [profile, setProfile] = useState({
    name: 'Alex Vance',
    email: 'alex@agentrelay.ai',
    phone: '+91 9876543210',
    autonomousSpendingLimit: 10000,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchProfile();
    }
  }, [isOpen, sessionId]);

  const fetchProfile = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await customerApi.getProfile(sessionId);
      const customer = res.data.customer;

      if (customer) {
        setProfile({
          name: customer.name || 'Alex Vance',
          email: customer.email || 'alex@agentrelay.ai',
          phone: customer.phone || '',
          autonomousSpendingLimit:
            customer.autonomousSpendingLimit ?? 10000,
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setErrorMsg(
        err.response?.data?.message || 'Failed to load buyer profile.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const limit = Number(profile.autonomousSpendingLimit);

    if (!Number.isFinite(limit) || limit < 0) {
      setErrorMsg('Enter a valid non-negative spending limit.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        autonomousSpendingLimit: limit,
      };

      const res = await customerApi.updateProfile(sessionId, payload);
      const updatedCustomer = res.data.customer;

      setProfile({
        name: updatedCustomer.name,
        email: updatedCustomer.email,
        phone: updatedCustomer.phone || '',
        autonomousSpendingLimit:
          updatedCustomer.autonomousSpendingLimit,
      });

      if (onProfileUpdated) {
        onProfileUpdated(updatedCustomer);
      }

      setSuccessMsg('Your buyer preferences have been saved.');

      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 1000);
    } catch (err) {
      console.error('Failed to save buyer profile:', err);
      setErrorMsg(
        err.response?.data?.message || 'Failed to save buyer preferences.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-5 relative">

        <button
          onClick={onClose}
          disabled={saving}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 bg-slate-50 border border-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 pr-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <User className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Buyer Profile & Preferences
            </h3>
            <p className="text-xs text-slate-500">
              Manage your account and AI spending policy.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center space-y-2">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">
              Loading buyer profile...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 text-xs">

            <div className="space-y-3">
              <h4 className="font-bold text-slate-800">
                Personal Details
              </h4>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-slate-800">
                  AI Spending Preferences
                </h4>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-3">
                <div>
                  <label className="block text-indigo-950 font-bold mb-1">
                    Autonomous Spending Limit (INR)
                  </label>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={profile.autonomousSpendingLimit}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          autonomousSpendingLimit: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-indigo-200 rounded-xl pl-8 pr-3 py-3 text-lg font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <p className="text-[11px] text-slate-600 mt-2">
                    Purchases exceeding this amount require additional
                    human approval under the current buyer policy.
                  </p>
                </div>

                <div className="flex items-start gap-2 p-3 bg-white/70 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    This is a spending-policy threshold, not permission
                    for automatic payment. You must still review and
                    approve payment through PayPal checkout.
                  </p>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>
                {saving ? 'Saving...' : 'Save Buyer Preferences'}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
