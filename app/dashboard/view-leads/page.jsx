"use client";

import React, { useState, useEffect } from "react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaDatabase,
  FaTable,
  FaEdit,
  FaTrash,
  FaExternalLinkAlt,
  FaCalendarAlt,
  FaUser,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaPlus,
} from "react-icons/fa";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function ViewLeadsPage() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const [leadTables, setLeadTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTable, setDeletingTable] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchLeadTables();
  }, [organization?.id, user?.id]);

  const fetchLeadTables = async () => {
    if (!organization?.id && !user?.id) return;
    setIsLoading(true);
    const orgId = organization?.id || user?.id;

    try {
      const { data, error } = await supabase
        .from("lead_tables")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeadTables(data || []);
    } catch (err) {
      console.error("Error fetching lead tables:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const stripTimestamp = (name) => {
    // Matches " - DD-MM-YYYY HH:mm" at the end
    return name.replace(/ - \d{2}-\d{2}-\d{4} \d{2}:\d{2}$/, "");
  };

  const startEditing = (table) => {
    setEditingId(table.id);
    setNewName(stripTimestamp(table.table_name));
  };

  const handleRename = async (id, originalName) => {
    if (!newName.trim() || isUpdating) return;
    setIsUpdating(true);
    const orgId = organization?.id || user?.id;

    // Preserve the original timestamp if it exists
    const timestampMatch = originalName.match(/ - \d{2}-\d{2}-\d{4} \d{2}:\d{2}$/);
    const finalName = timestampMatch ? `${newName.trim()}${timestampMatch[0]}` : newName.trim();

    try {
      // Check for uniqueness in the same organization (based on final name)
      const { data: existingTables } = await supabase
        .from("lead_tables")
        .select("id")
        .eq("org_id", orgId)
        .eq("table_name", finalName)
        .neq("id", id);

      if (existingTables && existingTables.length > 0) {
        alert("A list with this name already exists in your organization.");
        setIsUpdating(false);
        return;
      }

      const { error } = await supabase
        .from("lead_tables")
        .update({ table_name: finalName })
        .eq("id", id);

      if (error) throw error;

      setLeadTables((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, table_name: finalName } : t,
        ),
      );
      setEditingId(null);
    } catch (err) {
      console.error("Error renaming table:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const openDeleteModal = async (table) => {
    setDeletingTable(table);
    setIsDeleteModalOpen(true);
    setIsCheckingRole(true);
    setUserRole(null);

    try {
      const orgId = organization?.id;
      const userId = user?.id;

      if (!orgId) {
        // Personal workspace: user is the implicit admin of their own tables
        setUserRole("admin");
      } else {
        // First try to get the role directly from Clerk's organization membership
        const clerkRole = organization?.membership?.role;
        if (clerkRole === "org:admin" || clerkRole === "admin") {
          setUserRole("admin");
        } else if (userId) {
          // Fallback to Supabase query if Clerk role isn't explicitly admin
          const { data, error } = await supabase
            .from("memberships")
            .select("role")
            .eq("org_id", orgId)
            .eq("user_id", userId)
            .single();
            
          if (data) {
            setUserRole(data.role);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching user role:", err);
    } finally {
      setIsCheckingRole(false);
    }
  };

  const handleDeleteTable = async () => {
    if (!deletingTable || isDeleting) return;
    setIsDeleting(true);
    
    try {
      // Delete all leads associated with the table
      const { error: leadsError } = await supabase
        .from("leads")
        .delete()
        .eq("table_id", deletingTable.id);
        
      if (leadsError) throw leadsError;

      // Delete the table itself
      const { error: tableError } = await supabase
        .from("lead_tables")
        .delete()
        .eq("id", deletingTable.id);
        
      if (tableError) throw tableError;

      // Log action
      const orgId = organization?.id || null;
      await supabase.from("actions").insert({
        user_id: user?.id,
        org_id: orgId,
        action: `deleted ${stripTimestamp(deletingTable.table_name)} table`,
        credits_used: 0,
      });

      // Update state
      setLeadTables((prev) => prev.filter((t) => t.id !== deletingTable.id));
      setIsDeleteModalOpen(false);
      setDeletingTable(null);
    } catch (err) {
      console.error("Error deleting table:", err);
      alert("Failed to delete table. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">
            Lead Collections
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage and access your generated and custom lead lists.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/custom-list"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
          >
            <FaPlus size={12} className="text-slate-400" /> Custom List
          </Link>
          <Link
            href="/dashboard/lead-generator"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <FaPlus size={12} /> Generate AI List
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <FaSpinner className="animate-spin text-indigo-400" size={40} />
          <p className="text-slate-400 font-medium tracking-widest text-xs uppercase">
            Fetching your database...
          </p>
        </div>
      ) : leadTables.length === 0 ? (
        <div className="bg-white p-20 rounded-[2.5rem] border border-slate-200 border-dashed flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mb-6">
            <FaDatabase size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            No Lead Lists Found
          </h2>
          <p className="text-slate-500 max-w-sm mb-8">
            You haven't generated any lead lists yet. Start by using our Lead
            Generator or creating a custom list.
          </p>
          <Link
            href="/dashboard/lead-generator"
            className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
          >
            Create Your First List
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {leadTables.map((table) => (
              <motion.div
                key={table.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                layout
                className="bg-white group rounded-[2rem] border border-slate-200 hover:border-indigo-200 p-6 transition-all hover:shadow-xl hover:shadow-indigo-50/50 flex flex-col relative overflow-hidden"
              >
                {/* Status Tag */}
                <div className="absolute top-0 right-0 p-4">
                  <span
                    className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${
                      table.created_list
                        ? "bg-amber-50 text-amber-600 border-amber-100"
                        : "bg-emerald-50 text-emerald-600 border-emerald-100"
                    }`}
                  >
                    {table.created_list ? "Custom" : "Generated"}
                  </span>
                </div>

                <div className="mb-6 w-12 h-12 bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-2xl flex items-center justify-center transition-colors">
                  <FaTable size={24} />
                </div>

                {editingId === table.id ? (
                  <div className="flex-1 space-y-4">
                    <input
                      autoFocus
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-4 py-2 border border-indigo-200 rounded-xl outline-none ring-4 ring-indigo-50 font-bold text-slate-900"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRename(table.id, table.table_name)}
                        disabled={isUpdating}
                        className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                      >
                        {isUpdating ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <>
                            <FaCheck fontSize={10} /> Save
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-2 leading-snug h-[3.5rem] mb-2">
                      {stripTimestamp(table.table_name)}
                    </h3>

                    <div className="flex flex-col gap-2 mt-4">
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                        <FaUser size={14} className="text-slate-400" />
                        <span>{table.number_of_leads} results</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                        <FaCalendarAlt size={14} className="text-slate-400" />
                        <span>
                          {new Date(table.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {!editingId && (
                  <div className="mt-8 flex items-center gap-2 pt-6 border-t border-slate-50">
                    <Link
                      href={`/dashboard/view-leads/${table.id}`}
                      className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors"
                    >
                      <FaExternalLinkAlt size={10} /> Open List
                    </Link>
                    <button
                      onClick={() => startEditing(table)}
                      className="w-12 h-12 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all border border-slate-100"
                    >
                      <FaEdit size={16} />
                    </button>
                    <button
                      onClick={() => openDeleteModal(table)}
                      className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all border border-red-100"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && deletingTable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 font-sans"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
                  <FaTrash size={32} />
                </div>
                
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Delete Table
                </h3>
                
                {isCheckingRole ? (
                  <div className="flex items-center gap-2 text-slate-500">
                    <FaSpinner className="animate-spin" /> Checking permissions...
                  </div>
                ) : userRole !== "admin" ? (
                  <p className="text-slate-500 font-medium">
                    Only admins are allowed to delete tables.
                  </p>
                ) : (
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Are you sure you want to delete the <span className="font-bold text-slate-800">{stripTimestamp(deletingTable.table_name)}</span> table? This will permanently delete all leads inside this table. This action cannot be undone.
                  </p>
                )}
              </div>
              
              <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                {!isCheckingRole && userRole === "admin" && (
                  <button
                    onClick={handleDeleteTable}
                    disabled={isDeleting}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all shadow-md shadow-red-200 flex items-center gap-2"
                  >
                    {isDeleting && <FaSpinner className="animate-spin" />}
                    Confirm Delete
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
