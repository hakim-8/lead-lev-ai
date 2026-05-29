"use client";
import React, { useState, useEffect } from "react";
import {
  FaCog,
  FaPlus,
  FaTrash,
  FaLock,
  FaGlobe,
  FaServer,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEnvelope,
} from "react-icons/fa";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ShieldCheck,
  Mail,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

export default function SettingsPage() {
  const { orgId, isLoaded: clerkLoaded } = useAuth();

  const [configs, setConfigs] = useState([]);
  const [hasLegacyPassword, setHasLegacyPassword] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Modal States
  const [showAddForm, setShowAddForm] = useState(false);
  const [showResultModal, setShowResultModal] = useState(null); // 'success' | 'failure'
  const [isTesting, setIsTesting] = useState(false);

  const [deletingIndex, setDeletingIndex] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState("");

  // New Email Form
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    host: "",
    port: 587,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  // Change Password State
  const [changingIndex, setChangingIndex] = useState(null);
  const [changePasswords, setChangePasswords] = useState({
    old: "",
    new: "",
    confirm: "",
  });
  const [showChangePasswords, setShowChangePasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const [status, setStatus] = useState({ message: "", isError: false });

  const triggerMessage = (message, isError = false) => {
    setStatus({ message, isError });
    setTimeout(() => setStatus({ message: "", isError: false }), 5000);
  };

  async function checkPasswordStatus() {
    if (!clerkLoaded || !orgId) return;
    try {
      setLoadingData(true);
      const res = await fetch(`/api/organizations/password?orgId=${orgId}`);
      const data = await res.json();
      if (res.ok) {
        setConfigs(data.configs || []);
        setHasLegacyPassword(data.hasLegacyPassword || false);
      }
    } catch (err) {
      console.error("Failed to load credential configurations", err);
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    checkPasswordStatus();
  }, [orgId, clerkLoaded]);

  // Handle n8n Webhook Test
  const handleTestAndSave = async (e) => {
    e.preventDefault();
    setFormError("");

    const portInt = parseInt(formData.port);
    if (portInt !== 587 && portInt !== 465) {
      return setFormError("Only port numbers 587 and 465 are allowed.");
    }
    if (!formData.username || !formData.password || !formData.host) {
      return setFormError("All fields are required.");
    }

    setIsTesting(true);
    try {
      const testRes = await fetch(
        "https://revlaunchdigital.app.n8n.cloud/webhook-test/60e35714-0d5d-41bc-8009-691f106c0298",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );

      const testData = await testRes.json();

      if (testData.result === "success") {
        // Now save to our DB
        const saveRes = await fetch("/api/organizations/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orgId, ...formData }),
        });

        if (!saveRes.ok) {
          const saveData = await saveRes.json();
          throw new Error(saveData.error || "Failed to save configuration");
        }

        setShowResultModal("success");
        setShowAddForm(false);
        setFormData({ username: "", password: "", host: "", port: "587" });
        await checkPasswordStatus();
      } else {
        setShowResultModal("failure");
      }
    } catch (err) {
      setFormError(err.message || "An error occurred during testing.");
    } finally {
      setIsTesting(false);
    }
  };

  // Handle Password Change
  const handleChangeSubmit = async (e) => {
    e.preventDefault();
    if (
      !changePasswords.old ||
      !changePasswords.new ||
      !changePasswords.confirm
    ) {
      return triggerMessage("All fields are required.", true);
    }
    if (changePasswords.new !== changePasswords.confirm) {
      return triggerMessage("New password confirmation does not match.", true);
    }

    setIsTesting(true);
    const currentConfig = configs.find((c) => c.index === changingIndex);

    try {
      // Step 1: Verify Old Password via Backend
      const verifyRes = await fetch("/api/organizations/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          index: changingIndex,
          oldPassword: changePasswords.old,
          action: "verify",
        }),
      });

      if (!verifyRes.ok) {
        const verifyData = await verifyRes.json();
        throw new Error(verifyData.error || "Old password verification failed");
      }

      // Step 2: Run n8n test with NEW credentials
      const testRes = await fetch(
        "https://revlaunchdigital.app.n8n.cloud/webhook-test/60e35714-0d5d-41bc-8009-691f106c0298",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: currentConfig.username,
            password: changePasswords.new,
            host: currentConfig.host,
            port: currentConfig.port,
          }),
        },
      );

      const testData = await testRes.json();

      if (testData.result !== "success") {
        setShowResultModal("failure");
        setIsTesting(false);
        return;
      }

      // Step 3: All verified -> Commit Update to DB
      const res = await fetch("/api/organizations/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          index: changingIndex,
          oldPassword: changePasswords.old,
          newPassword: changePasswords.new,
          action: "update",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Execution error during update");
      }

      triggerMessage("Verification successful! Credentials updated.");
      setShowResultModal("success");
      setChangingIndex(null);
      setChangePasswords({ old: "", new: "", confirm: "" });
      await checkPasswordStatus();
    } catch (err) {
      triggerMessage(err.message, true);
    } finally {
      setIsTesting(false);
    }
  };

  // Handle Email Deletion
  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    if (!deletePassword) return;

    setDeleteModalError("");
    setIsDeleting(true);
    try {
      const res = await fetch("/api/organizations/password", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          index: deletingIndex,
          password: deletePassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Deletion failed");

      triggerMessage("Email configuration removed successfully.");
      setDeletingIndex(null);
      setDeletePassword("");
      await checkPasswordStatus();
    } catch (err) {
      setDeleteModalError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!clerkLoaded || loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-4">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
        <p className="text-sm font-semibold tracking-wide uppercase">
          Syncing email credentials...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 px-4 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Settings
          </h1>
          <p className="text-slate-500 font-medium">
            Manage your SMTP outreach configurations.
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            disabled={configs.length >= 5}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm ${
              configs.length >= 5
                ? "bg-slate-100 text-slate-400 cursor-not-allowed grayscale"
                : "bg-indigo-600 text-white hover:bg-slate-900 hover:shadow-indigo-100 shadow-xl"
            }`}
            title={
              configs.length >= 5 ? "Maximum number of emails reached" : ""
            }
          >
            <FaPlus size={12} /> Add Email
          </button>
        )}
      </div>

      {configs.length >= 5 && !showAddForm && (
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3 text-amber-700 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <FaExclamationTriangle size={16} />
          <span>
            Maximum occupancy reached. You have the maximum number of 5 emails
            entered.
          </span>
        </div>
      )}

      {status.message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border animate-in zoom-in-95 ${
            status.isError
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          {status.isError ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span>{status.message}</span>
        </div>
      )}

      {/* Existing Configs List */}
      <div className="grid grid-cols-1 gap-4">
        {configs.map((cfg) => (
          <div
            key={cfg.index}
            className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-indigo-200 transition-all group overflow-hidden relative"
          >
            <div
              className={`absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[100%] -mr-16 -mt-16 transition-transform group-hover:scale-110 z-0`}
            />

            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <FaEnvelope size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">
                      {cfg.username}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setDeletingIndex(cfg.index);
                      setDeleteModalError("");
                      setDeletePassword("");
                    }}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    title="Remove Email"
                  >
                    <FaTrash size={14} />
                  </button>
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                    <ShieldCheck size={12} /> Encrypted
                  </div>
                </div>
              </div>

              {changingIndex === cfg.index ? (
                <form
                  onSubmit={handleChangeSubmit}
                  className="pt-4 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-4 duration-300"
                >
                  <div className="grid grid-cols-1 gap-4">
                    {/* Old Password */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Old Password
                        </label>
                        <Link
                          href="/"
                          className="text-[9px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest"
                        >
                          Forgot Password?
                        </Link>
                      </div>
                      <div className="relative">
                        <input
                          type={showChangePasswords.old ? "text" : "password"}
                          value={changePasswords.old}
                          onChange={(e) =>
                            setChangePasswords({
                              ...changePasswords,
                              old: e.target.value,
                            })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowChangePasswords({
                              ...showChangePasswords,
                              old: !showChangePasswords.old,
                            })
                          }
                          className="absolute right-3 top-2.5 text-slate-300"
                        >
                          {showChangePasswords.old ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                    {/* New Password */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showChangePasswords.new ? "text" : "password"}
                            value={changePasswords.new}
                            onChange={(e) =>
                              setChangePasswords({
                                ...changePasswords,
                                new: e.target.value,
                              })
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowChangePasswords({
                                ...showChangePasswords,
                                new: !showChangePasswords.new,
                              })
                            }
                            className="absolute right-3 top-2.5 text-slate-300"
                          >
                            {showChangePasswords.new ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5">
                          Confirm
                        </label>
                        <div className="relative">
                          <input
                            type={
                              showChangePasswords.confirm ? "text" : "password"
                            }
                            value={changePasswords.confirm}
                            onChange={(e) =>
                              setChangePasswords({
                                ...changePasswords,
                                confirm: e.target.value,
                              })
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowChangePasswords({
                                ...showChangePasswords,
                                confirm: !showChangePasswords.confirm,
                              })
                            }
                            className="absolute right-3 top-2.5 text-slate-300"
                          >
                            {showChangePasswords.confirm ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setChangingIndex(null)}
                      className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all tracking-widest uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isTesting}
                      className="flex-[2] py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all tracking-widest uppercase shadow-lg shadow-indigo-50 flex items-center justify-center gap-2"
                    >
                      {isTesting ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : null}
                      {isTesting ? "Verifying..." : "Update & Verify"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 group-hover:bg-white transition-colors duration-300">
                  <div className="flex items-center gap-3 text-slate-500">
                    <FaLock size={12} />
                    <span className="text-[11px] font-bold uppercase tracking-tight">
                      Security Check Required Prior to Reveal
                    </span>
                  </div>
                  <button
                    onClick={() => setChangingIndex(cfg.index)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-indigo-600 hover:border-indigo-200 hover:shadow-md transition-all text-slate-600 shadow-sm"
                  >
                    Change Password
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {hasLegacyPassword && configs.length === 0 && (
          <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2rem] text-center space-y-4 shadow-sm border-dashed">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="text-indigo-600" size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-indigo-900 font-black uppercase tracking-tight">
                Migration Required
              </h3>
              <p className="text-slate-500 text-sm font-medium">
                You have a legacy password stored. Please add an email to
                normalize your settings.
              </p>
            </div>
          </div>
        )}

        {configs.length === 0 && !hasLegacyPassword && !showAddForm && (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-16 rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 bg-white text-slate-200 rounded-full flex items-center justify-center shadow-sm">
              <Mail size={32} />
            </div>
            <p className="text-slate-400 font-bold text-sm tracking-tight capitalize">
              No email integrations found for this organization.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-2 flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-50"
            >
              Connect First Email <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Add Email Form */}
      {showAddForm && (
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-2xl space-y-8 animate-in zoom-in-95 duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8">
            <button
              onClick={() => setShowAddForm(false)}
              className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:text-slate-900 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center shadow-inner">
              <FaPlus size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Connect New Email
              </h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                SMTP Outreach Module
              </p>
            </div>
          </div>

          {formError && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 text-[11px] font-black uppercase tracking-tight">
              <FaExclamationTriangle size={14} /> {formError}
            </div>
          )}

          <form onSubmit={handleTestAndSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">
                  Email Username
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="info@yourcompany.com"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-bold placeholder:text-slate-300"
                  />
                  <div className="absolute right-6 top-4 text-slate-200">
                    <FaEnvelope />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-4 text-slate-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">
                  SMTP Host
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="smtp.example.com"
                    value={formData.host}
                    onChange={(e) =>
                      setFormData({ ...formData, host: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-bold placeholder:text-slate-300"
                  />
                  <div className="absolute right-6 top-4 text-slate-200">
                    <FaServer />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">
                  Secure Port
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="587"
                    value={formData.port}
                    onChange={(e) =>
                      setFormData({ ...formData, port: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-black"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isTesting}
              className="w-full bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl py-5 font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-50 flex items-center justify-center gap-3 disabled:bg-slate-200 disabled:scale-100 group"
            >
              {isTesting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Testing Protocols...
                </>
              ) : (
                <>
                  Submit for Testing{" "}
                  <ArrowRight
                    className="group-hover:translate-x-1 transition-transform"
                    size={18}
                  />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingIndex && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden">
            <button
              onClick={() => setDeletingIndex(null)}
              className="absolute top-6 right-6 text-slate-300 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <div className="w-20 h-20 mx-auto bg-red-50 text-red-600 rounded-full flex items-center justify-center shadow-inner">
              <FaTrash size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Verify Removal
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                To remove this email integration, please enter your associated
                password for validation.
              </p>
            </div>
            <form onSubmit={handleDeleteSubmit} className="space-y-4">
              {deleteModalError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-black uppercase tracking-tight animate-in shake-in">
                  {deleteModalError}
                </div>
              )}
              <div>
                <div className="flex justify-between items-center mb-1.5 px-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Confirm Password
                  </label>
                  <Link
                    href="/"
                    className="text-[9px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showDeletePassword ? "text" : "password"}
                    placeholder="Enter password..."
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-4 focus:ring-red-50 focus:border-red-500 transition-all font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-6 top-4 text-slate-300"
                  >
                    {showDeletePassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isDeleting}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-50 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                {isDeleting && <Loader2 size={14} className="animate-spin" />}
                {isDeleting ? "Wiping Data..." : "Confirm Deletion"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Result Modals */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 text-center space-y-8 shadow-2xl animate-in zoom-in-95 duration-500">
            <div
              className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center shadow-inner ${showResultModal === "success" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}
            >
              {showResultModal === "success" ? (
                <FaCheckCircle size={48} />
              ) : (
                <FaExclamationTriangle size={48} />
              )}
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight capitalize">
                Testing {showResultModal}
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                {showResultModal === "success"
                  ? "SMTP connectivity verified. Your configuration has been securely encrypted and synchronized with our outreach systems."
                  : "Verification failed. Please check your SMTP host, port, and password. Reach out to support if the issue persists."}
              </p>
            </div>
            <button
              onClick={() => setShowResultModal(null)}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all ${
                showResultModal === "success"
                  ? "bg-slate-900 text-white hover:bg-emerald-600 shadow-emerald-50"
                  : "bg-slate-900 text-white hover:bg-red-600 shadow-red-50"
              }`}
            >
              Return to Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
