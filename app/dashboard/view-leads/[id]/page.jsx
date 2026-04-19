"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useOrganization } from "@clerk/nextjs";
import {
  FaArrowLeft,
  FaGlobe,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaStar,
  FaSearch,
  FaDownload,
  FaTable,
  FaSpinner,
  FaUserTie,
  FaCheckCircle,
  FaExclamationTriangle,
  FaQuestionCircle,
  FaCopy,
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaTimes,
  FaCheck,
  FaExchangeAlt,
  FaChevronDown,
} from "react-icons/fa";
import { supabase } from "../../../lib/supabase";

export default function LeadDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { organization } = useOrganization();
  const [leads, setLeads] = useState([]);
  const [tableName, setTableName] = useState("Loading...");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Selection State
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  const [targetTableId, setTargetTableId] = useState("");
  const [isFetchingTables, setIsFetchingTables] = useState(false);

  // Lead Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    business_name: "",
    business_category: "",
    website_url: "",
    address: "",
    business_email: "",
    business_phone: "",
    google_rank: "",
    reviews: "",
    avg_rating: "",
    decision_maker_name: "",
    decision_maker_job: "",
    decision_maker_email: "",
    email_validity: "untested",
  });

  useEffect(() => {
    if (id) {
      fetchLeads();
      fetchTableInfo();
    }
  }, [id]);

  const fetchTableInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("lead_tables")
        .select("table_name")
        .eq("id", id)
        .single();

      if (data) setTableName(data.table_name);
    } catch (err) {
      console.error("Error fetching table info:", err);
    }
  };

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("table_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      console.error("Error fetching leads:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableTables = async () => {
    const orgId = organization?.id || user?.id;
    if (!orgId) return;

    setIsFetchingTables(true);
    try {
      const { data, error } = await supabase
        .from("lead_tables")
        .select("id, table_name")
        .eq("org_id", orgId)
        .neq("id", id) // Don't show current table
        .order("table_name", { ascending: true });

      if (error) throw error;
      setAvailableTables(data || []);
    } catch (err) {
      console.error("Error fetching tables:", err);
    } finally {
      setIsFetchingTables(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === leads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map((l) => l.id));
    }
  };

  const toggleSelectLead = (leadId) => {
    if (selectedLeadIds.includes(leadId)) {
      setSelectedLeadIds((prev) => prev.filter((i) => i !== leadId));
    } else {
      setSelectedLeadIds((prev) => [...prev, leadId]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeadIds.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedLeadIds.length} selected leads?`,
      )
    )
      return;

    setIsProcessingBulk(true);
    try {
      const { error } = await supabase
        .from("leads")
        .delete()
        .in("id", selectedLeadIds);

      if (error) throw error;

      // Update source table count sequentially
      const { data: currentCountData } = await supabase
        .from("lead_tables")
        .select("number_of_leads")
        .eq("id", id)
        .single();

      const newCount = Math.max(
        0,
        (currentCountData?.number_of_leads || 0) - selectedLeadIds.length,
      );

      await supabase
        .from("lead_tables")
        .update({ number_of_leads: newCount })
        .eq("id", id);

      setLeads((prev) => prev.filter((l) => !selectedLeadIds.includes(l.id)));
      setSelectedLeadIds([]);
      alert("Leads deleted successfully.");
    } catch (err) {
      console.error("Error deleting leads:", err);
      alert("Failed to delete selected leads.");
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkTransfer = async () => {
    if (!targetTableId || selectedLeadIds.length === 0) return;

    setIsProcessingBulk(true);
    try {
      // 1. Update leads table_id
      const { error: moveError } = await supabase
        .from("leads")
        .update({ table_id: targetTableId })
        .in("id", selectedLeadIds);

      if (moveError) throw moveError;

      // 2. Sequential update for SOURCE table
      const { data: sourceData } = await supabase
        .from("lead_tables")
        .select("number_of_leads")
        .eq("id", id)
        .single();

      const newSourceCount = Math.max(
        0,
        (sourceData?.number_of_leads || 0) - selectedLeadIds.length,
      );
      await supabase
        .from("lead_tables")
        .update({ number_of_leads: newSourceCount })
        .eq("id", id);

      // 3. Sequential update for DESTINATION table
      const { data: destData } = await supabase
        .from("lead_tables")
        .select("number_of_leads")
        .eq("id", targetTableId)
        .single();

      const newDestCount =
        (destData?.number_of_leads || 0) + selectedLeadIds.length;
      await supabase
        .from("lead_tables")
        .update({ number_of_leads: newDestCount })
        .eq("id", targetTableId);

      setLeads((prev) => prev.filter((l) => !selectedLeadIds.includes(l.id)));
      setSelectedLeadIds([]);
      setIsTransferModalOpen(false);
      alert("Leads transferred successfully.");
    } catch (err) {
      console.error("Error transferring leads:", err);
      alert("Failed to transfer leads.");
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleOpenModal = (lead = null) => {
    if (lead) {
      setCurrentLead(lead);
      setFormData({
        business_name: lead.business_name || "",
        business_category: lead.business_category || "",
        website_url: lead.website_url || "",
        address: lead.address || "",
        business_email: lead.business_email || "",
        business_phone: lead.business_phone || "",
        google_rank: lead.google_rank || "",
        reviews: lead.reviews || "",
        avg_rating: lead.avg_rating || "",
        decision_maker_name: lead.decision_maker_name || "",
        decision_maker_job: lead.decision_maker_job || "",
        decision_maker_email: lead.decision_maker_email || "",
        email_validity: lead.email_validity || "untested",
      });
    } else {
      setCurrentLead(null);
      setFormData({
        business_name: "",
        business_category: "",
        website_url: "",
        address: "",
        business_email: "",
        business_phone: "",
        google_rank: "",
        reviews: "",
        avg_rating: "",
        decision_maker_name: "",
        decision_maker_job: "",
        decision_maker_email: "",
        email_validity: "untested",
      });
    }
    setIsModalOpen(true);
  };

  const handleDeleteLead = async (leadId) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      const { error } = await supabase.from("leads").delete().eq("id", leadId);
      if (error) throw error;

      // Sequential decrement
      const { data: currentCountData } = await supabase
        .from("lead_tables")
        .select("number_of_leads")
        .eq("id", id)
        .single();

      const newCount = Math.max(
        0,
        (currentCountData?.number_of_leads || 0) - 1,
      );
      await supabase
        .from("lead_tables")
        .update({ number_of_leads: newCount })
        .eq("id", id);

      setLeads((prev) => prev.filter((l) => l.id !== leadId));
    } catch (err) {
      console.error("Error deleting lead:", err);
      alert("Failed to delete lead.");
    }
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (currentLead) {
        // Update
        const { data, error } = await supabase
          .from("leads")
          .update({ ...formData })
          .eq("id", currentLead.id)
          .select()
          .single();

        if (error) throw error;
        setLeads((prev) => prev.map((l) => (l.id === data.id ? data : l)));
      } else {
        // Add
        const { data, error } = await supabase
          .from("leads")
          .insert({
            ...formData,
            table_id: id,
            user_id: user?.id,
            status: "Not Mailed",
            search_params: null,
          })
          .select()
          .single();

        if (error) throw error;

        // Sequential increment
        const { data: currentCountData } = await supabase
          .from("lead_tables")
          .select("number_of_leads")
          .eq("id", id)
          .single();

        const newCount = (currentCountData?.number_of_leads || 0) + 1;
        await supabase
          .from("lead_tables")
          .update({ number_of_leads: newCount })
          .eq("id", id);

        setLeads((prev) => [data, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving lead:", err);
      alert("Failed to save lead details.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredLeads = leads.filter(
    (lead) =>
      lead.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.business_category
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      lead.decision_maker_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const getValidityBadge = (validity) => {
    const val = validity?.toLowerCase();
    if (val === "valid")
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100 uppercase">
          <FaCheckCircle size={10} /> Valid
        </span>
      );
    if (val === "risky")
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold border border-amber-100 uppercase">
          <FaExclamationTriangle size={10} /> Risky
        </span>
      );
    if (val === "invalid")
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold border border-red-100 uppercase">
          Invalid
        </span>
      );
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-bold border border-slate-100 uppercase">
        <FaQuestionCircle size={10} /> {validity || "Untested"}
      </span>
    );
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  const stripTimestamp = (name) => {
    return name.replace(/ - \d{2}-\d{2}-\d{4} \d{2}:\d{2}$/, "");
  };

  return (
    <div className="space-y-6 font-sans relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all font-sans"
          >
            <FaArrowLeft size={16} />
          </button>
          <div className="font-sans">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3 font-sans">
              <FaTable className="text-indigo-600" size={20} />{" "}
              {stripTimestamp(tableName)}
            </h1>
            <p className="text-xs text-slate-500 font-medium font-sans">
              Collection Overview • {leads.length} records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-sans">
          <div className="relative flex-1 md:w-64 font-sans">
            <FaSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={12}
            />
            <input
              type="text"
              placeholder="Filter list..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-50 font-sans font-medium"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all font-sans"
          >
            <FaPlus size={12} /> Add Lead
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedLeadIds.length > 0 && (
        <div className="sticky top-24 z-40 bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center justify-between border border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">
                Selected Leads
              </span>
              <span className="text-lg font-bold">
                {selectedLeadIds.length} Records
              </span>
            </div>
            <div className="h-10 w-px bg-slate-800 mx-2" />
            <button
              onClick={() => {
                fetchAvailableTables();
                setIsTransferModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-indigo-600 text-sm font-bold rounded-xl transition-all"
            >
              <FaExchangeAlt size={12} className="text-indigo-400" /> Transfer
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isProcessingBulk}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-red-600 text-sm font-bold rounded-xl transition-all"
            >
              {isProcessingBulk ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaTrashAlt size={12} className="text-red-400" />
              )}{" "}
              Delete
            </button>
          </div>
          <button
            onClick={() => setSelectedLeadIds([])}
            className="text-xs font-bold text-slate-500 hover:text-white transition-colors"
          >
            Clear Selection
          </button>
        </div>
      )}

      <div className="flex items-center justify-between font-sans">
        <div className="flex items-center gap-2 p-1 px-3 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 font-sans text-[10px] font-black uppercase tracking-widest">
          <FaCheckCircle className="shrink-0" size={10} /> Manual Verification
          Mode
        </div>
        <button
          className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
          onClick={() => alert("Verification engine is being initialized...")}
        >
          Verify Emails
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white p-20 rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center space-y-4 font-sans">
          <FaSpinner className="animate-spin text-indigo-500" size={40} />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest font-sans">
            Syncing Leads...
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col font-sans">
          <div className="block max-w-full overflow-x-auto scrollbar-default">
            <table className="w-full text-left border-collapse min-w-[1500px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 w-12 text-center border-r border-slate-100 font-sans">
                    <input
                      type="checkbox"
                      checked={
                        selectedLeadIds.length === leads.length &&
                        leads.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">
                    Business
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">
                    Decision Maker
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">
                    Business Email
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">
                    Website
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">
                    Validity
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`hover:bg-slate-50/50 transition-colors font-sans ${selectedLeadIds.includes(lead.id) ? "bg-indigo-50/30" : ""}`}
                  >
                    <td className="px-6 py-6 border-r border-slate-50 text-center font-sans">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(lead.id)}
                        onChange={() => toggleSelectLead(lead.id)}
                        className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-6 min-w-[300px]">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-slate-900 leading-tight mb-1">
                          {lead.business_name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-indigo-500 uppercase px-2 py-0.5 bg-indigo-50 rounded-md">
                            {lead.business_category}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 pr-2 border-r border-slate-100">
                            <FaStar size={8} /> {lead.avg_rating || "N/A"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 ml-1">
                            Rank #{lead.google_rank || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400">
                          <FaMapMarkerAlt size={10} className="shrink-0" />
                          <span className="truncate max-w-[220px]">
                            {lead.address}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-6 border-l border-slate-50 min-w-[250px]">
                      {lead.decision_maker_name ? (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                            <FaUserTie size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 leading-none mb-1">
                              {lead.decision_maker_name}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
                              {lead.decision_maker_job || "Member"}
                            </span>
                            {lead.decision_maker_email && (
                              <span className="text-[11px] font-medium text-indigo-600 line-clamp-1">
                                {lead.decision_maker_email}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] italic text-slate-300">
                          Unspecified
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-6 border-l border-slate-50 min-w-[200px]">
                      {lead.business_email ? (
                        <div className="group/copy flex items-center justify-between gap-3 p-2 px-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <span className="text-[11px] font-bold text-slate-600 truncate">
                            {lead.business_email}
                          </span>
                          <button
                            onClick={() => copyToClipboard(lead.business_email)}
                            className="text-slate-300 hover:text-indigo-600 transition-colors"
                          >
                            <FaCopy size={12} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] italic text-slate-300">
                          Unavailable
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-6 border-l border-slate-50">
                      {lead.website_url && lead.website_url !== "null" ? (
                        <a
                          href={
                            lead.website_url.startsWith("http")
                              ? lead.website_url
                              : `https://${lead.website_url}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
                        >
                          <FaGlobe
                            size={12}
                            className="text-slate-300 group-hover:text-indigo-400"
                          />
                          <span className="truncate max-w-[150px] border-b border-transparent group-hover:border-indigo-200">
                            {lead.website_url
                              .replace(/^https?:\/\//, "")
                              .replace(/^www\./, "")}
                          </span>
                        </a>
                      ) : (
                        <span className="text-[10px] italic text-slate-300">
                          None
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-6 border-l border-slate-50">
                      {lead.business_phone ? (
                        <a
                          href={`tel:${lead.business_phone}`}
                          className="group flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
                        >
                          <FaPhone
                            size={10}
                            className="text-slate-300 group-hover:text-indigo-400"
                          />
                          <span className="whitespace-nowrap">
                            {lead.business_phone}
                          </span>
                        </a>
                      ) : (
                        <span className="text-[10px] italic text-slate-300">
                          None
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-6 border-l border-slate-50">
                      {getValidityBadge(lead.email_validity)}
                    </td>

                    <td className="px-6 py-6 border-l border-slate-50 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(lead)}
                          className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center font-sans shadow-sm"
                          title="Edit Lead"
                        >
                          <FaEdit size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center font-sans shadow-sm"
                          title="Remove Lead"
                        >
                          <FaTrashAlt size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
          <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col font-sans">
            <div className="p-6 px-10 border-b border-slate-100 flex items-center justify-between font-sans">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-sans">
                  {currentLead ? "Refine Lead Record" : "Introduce New Lead"}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1 font-sans">
                  Manual entry for custom outreach collections.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 font-sans">
              <form
                id="lead-form"
                onSubmit={handleSaveLead}
                className="space-y-8 font-sans"
              >
                <div className="space-y-6 font-sans">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 font-sans">
                    Business Intel
                  </h3>
                  <div className="grid grid-cols-2 gap-6 font-sans">
                    <div className="space-y-2 font-sans">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 font-sans">
                        Establishment Name
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.business_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            business_name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 font-sans"
                      />
                    </div>
                    <div className="space-y-2 font-sans">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 font-sans">
                        Trade Category
                      </label>
                      <input
                        type="text"
                        value={formData.business_category}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            business_category: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 font-sans"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 font-sans">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 font-sans">
                      Digital Presence (URL)
                    </label>
                    <input
                      type="text"
                      value={formData.website_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          website_url: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 font-sans"
                    />
                  </div>
                  <div className="space-y-2 font-sans">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 font-sans font-sans">
                      Physical Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 font-sans"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6 font-sans">
                    <div className="space-y-2 font-sans">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 font-sans">
                        Public Email
                      </label>
                      <input
                        type="email"
                        value={formData.business_email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            business_email: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 font-sans"
                      />
                    </div>
                    <div className="space-y-2 font-sans">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 font-sans">
                        Phone Line
                      </label>
                      <input
                        type="text"
                        value={formData.business_phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            business_phone: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 font-sans"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6 font-sans">
                    <div className="space-y-2 font-sans">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 font-sans">
                        Google Rank
                      </label>
                      <input
                        type="number"
                        value={formData.google_rank}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            google_rank: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 font-sans"
                      />
                    </div>
                    <div className="space-y-2 font-sans">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 font-sans">
                        Total Reviews
                      </label>
                      <input
                        type="number"
                        value={formData.reviews}
                        onChange={(e) =>
                          setFormData({ ...formData, reviews: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 font-sans"
                      />
                    </div>
                    <div className="space-y-2 font-sans">
                      <label className="text-[10px) font-bold text-slate-400 uppercase tracking-widest ml-1 font-sans">
                        Avg Rating
                      </label>
                      <input
                        type="text"
                        value={formData.avg_rating}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            avg_rating: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 font-sans"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-50 w-full" />

                <div className="space-y-6 font-sans">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 font-sans">
                    Decision Maker Details
                  </h3>
                  <div className="grid grid-cols-2 gap-6 font-sans">
                    <div className="space-y-2 font-sans font-sans">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 font-sans">
                        Decision Maker Name
                      </label>
                      <input
                        type="text"
                        value={formData.decision_maker_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            decision_maker_name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 font-sans"
                      />
                    </div>
                    <div className="space-y-2 font-sans">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 font-sans">
                        Decision Maker Job Title
                      </label>
                      <input
                        type="text"
                        value={formData.decision_maker_job}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            decision_maker_job: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 font-sans"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 font-sans">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 font-sans">
                      Decision Maker Email
                    </label>
                    <input
                      type="email"
                      value={formData.decision_maker_email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          decision_maker_email: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 font-sans"
                    />
                  </div>
                </div>

                <div className="h-px bg-slate-50 w-full" />

                <div className="space-y-6 font-sans">
                  <div className="space-y-2 font-sans">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 font-sans">
                      Initial Email Status
                    </label>
                    <select
                      value={formData.email_validity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          email_validity: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700 text-sm appearance-none font-sans"
                    >
                      <option value="valid">✅ Valid</option>
                      <option value="invalid">❌ Invalid</option>
                      <option value="untested">❓ Untested</option>
                      <option value="risky">⚠️ Risky</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-8 px-10 border-t border-slate-100 flex items-center justify-end gap-4 bg-slate-50/50 font-sans">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 text-slate-500 font-bold text-sm hover:text-slate-800 transition-all font-sans"
              >
                Cancel
              </button>
              <button
                form="lead-form"
                type="submit"
                disabled={isSaving}
                className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-100 disabled:opacity-50 disabled:cursor-not-allowed font-sans"
              >
                {isSaving ? (
                  <>
                    <FaSpinner className="animate-spin" /> Persisting Record...
                  </>
                ) : (
                  <>
                    {currentLead ? <FaCheck size={12} /> : <FaPlus size={12} />}{" "}
                    {currentLead ? "Update Perspective" : "Commit Lead"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-10 space-y-8 font-sans">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 font-sans">
                Transfer Leads
              </h2>
              <p className="text-sm text-slate-500 mt-2 font-sans font-sans">
                Move {selectedLeadIds.length} leads to a different collection
                workspace.
              </p>
            </div>

            <div className="space-y-4 font-sans font-sans">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                Destination Table
              </label>
              <div className="relative font-sans">
                <select
                  value={targetTableId}
                  onChange={(e) => setTargetTableId(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700 appearance-none font-sans"
                >
                  <option value="">Select a collection...</option>
                  {availableTables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {stripTimestamp(t.table_name)}
                    </option>
                  ))}
                </select>
                <FaChevronDown
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  size={14}
                />
              </div>
              {isFetchingTables && (
                <p className="text-[10px] text-indigo-500 font-bold animate-pulse font-sans">
                  Fetching organization workspace...
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 font-sans">
              <button
                onClick={handleBulkTransfer}
                disabled={isProcessingBulk || !targetTableId}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 disabled:bg-slate-200 transition-all shadow-xl shadow-indigo-100 font-sans"
              >
                {isProcessingBulk ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  "Initiate Transfer"
                )}
              </button>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="w-full py-4 text-slate-400 font-bold hover:text-slate-700 transition-colors font-sans font-sans"
              >
                Discard Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
