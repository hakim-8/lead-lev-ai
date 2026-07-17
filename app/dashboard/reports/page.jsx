"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useUser, useOrganization } from "@clerk/nextjs";
import {
  FaDatabase,
  FaFileAlt,
  FaSearch,
  FaRocket,
  FaFilter,
  FaCalendarAlt,
  FaUser,
  FaSpinner,
  FaCoins,
} from "react-icons/fa";
import { supabase } from "../../lib/supabase";

export default function ReportsPage() {
  const { user } = useUser();
  const { organization } = useOrganization();

  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  // Organization Stats
  const [orgStats, setOrgStats] = useState({
    leads_collected: 0,
    reports_generated: 0,
    email_searches: 0,
    campaigns_launched: 0,
  });

  // Actions and Members
  const [allActions, setAllActions] = useState([]);
  const [orgMembers, setOrgMembers] = useState({}); // { clerk_id: { first_name, last_name } }

  // Filters
  const [timeFilter, setTimeFilter] = useState("all_time"); // today, last_7, this_month, last_month, last_3_months, last_6_months, all_time, custom
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [memberFilter, setMemberFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    fetchReportsData();
  }, [organization?.id, user?.id]);

  useEffect(() => {
    // Reset page to 1 when filters change
    setCurrentPage(1);
  }, [timeFilter, customFrom, customTo, memberFilter]);

  const fetchReportsData = async () => {
    const orgId = organization?.id;
    const userId = user?.id;
    if (!orgId || !userId) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch User Role cleanly from Supabase
      let role = null;
      const { data: roleData, error: roleError } = await supabase
        .from("memberships")
        .select("role")
        .eq("org_id", orgId)
        .eq("user_id", userId)
        .maybeSingle(); // Using maybeSingle avoids throwing an error if no row exists

      if (roleData) {
        role = roleData.role;
      } else if (roleError) {
        console.error("Error fetching user role from database:", roleError);
      }

      setUserRole(role);

      // 2. Fetch Org Stats
      const { data: orgData } = await supabase
        .from("organizations")
        .select(
          "leads_collected, reports_generated, email_searches, campaigns_launched",
        )
        .eq("org_id", orgId)
        .single();

      if (orgData) {
        setOrgStats(orgData);
      }

      // 3. Fetch Members (If Admin)
      let memberMap = {};
      if (role === "admin") {
        const { data: memberships } = await supabase
          .from("memberships")
          .select("user_id")
          .eq("org_id", orgId);

        if (memberships && memberships.length > 0) {
          const userIds = memberships.map((m) => m.user_id);
          const { data: usersData } = await supabase
            .from("users")
            .select("clerk_id, first_name, last_name")
            .in("clerk_id", userIds);

          if (usersData) {
            usersData.forEach((u) => {
              memberMap[u.clerk_id] = {
                first_name: u.first_name,
                last_name: u.last_name,
              };
            });
          }
        }
      }
      setOrgMembers(memberMap);

      // 4. Fetch Actions
      let query = supabase
        .from("actions")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      // If member, only fetch their actions
      if (role !== "admin") {
        query = query.eq("user_id", userId);
      }

      const { data: actionsData, error: actionsError } = await query;
      if (actionsError) throw actionsError;

      setAllActions(actionsData || []);
    } catch (err) {
      console.error("Error fetching reports data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredActions = () => {
    let filtered = allActions;

    // Filter by Member
    if (userRole === "admin" && memberFilter !== "all") {
      filtered = filtered.filter((a) => a.user_id === memberFilter);
    }

    // Filter by Time
    if (timeFilter !== "all_time") {
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date(); // Represents end of the current period if applicable

      // We will perform naive filtering based on JS Date evaluation
      // setting hours to 00:00:00 for start boundaries and 23:59:59 for end boundaries

      if (timeFilter === "today") {
        startDate.setHours(0, 0, 0, 0);
      } else if (timeFilter === "last_7") {
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
      } else if (timeFilter === "this_month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (timeFilter === "last_month") {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (timeFilter === "last_3_months") {
        startDate.setMonth(now.getMonth() - 3);
        startDate.setHours(0, 0, 0, 0);
      } else if (timeFilter === "last_6_months") {
        startDate.setMonth(now.getMonth() - 6);
        startDate.setHours(0, 0, 0, 0);
      } else if (timeFilter === "custom" && customFrom && customTo) {
        startDate = new Date(customFrom);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(customTo);
        endDate.setHours(23, 59, 59, 999);
      }

      filtered = filtered.filter((a) => {
        const actionDate = new Date(a.created_at);
        if (timeFilter === "last_month" || timeFilter === "custom") {
          return actionDate >= startDate && actionDate <= endDate;
        }
        return actionDate >= startDate;
      });
    }

    return filtered;
  };

  const filteredActions = useMemo(
    () => getFilteredActions(),
    [allActions, timeFilter, customFrom, customTo, memberFilter, userRole],
  );
  const totalCredits = useMemo(
    () =>
      filteredActions.reduce(
        (sum, action) => sum + (action.credits_used || 0),
        0,
      ),
    [filteredActions],
  );
  const paginatedActions = useMemo(
    () =>
      filteredActions.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
      ),
    [filteredActions, currentPage],
  );
  const totalPages = Math.ceil(filteredActions.length / pageSize) || 1;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <FaSpinner className="animate-spin text-indigo-400" size={40} />
        <p className="text-slate-400 font-medium tracking-widest text-xs uppercase">
          Fetching analytics & activity...
        </p>
      </div>
    );
  }

  if (!organization?.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Organization Required
        </h2>
        <p className="text-slate-500">
          You must be part of an organization to view reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10 mt-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900">
          Reports & Analytics
        </h1>
        <p className="text-slate-500 mt-2">
          View your organization's statistics and usage activity.
        </p>
      </div>

      {/* Organization Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FaDatabase size={20} />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">
              Leads Collected
            </p>
            <h3 className="text-3xl font-black text-slate-900">
              {orgStats.leads_collected.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <FaFileAlt size={20} />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">
              Reports Generated
            </p>
            <h3 className="text-3xl font-black text-slate-900">
              {orgStats.reports_generated.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <FaSearch size={20} />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">
              Email Searches
            </p>
            <h3 className="text-3xl font-black text-slate-900">
              {orgStats.email_searches.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <FaRocket size={20} />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">
              Campaigns Launched
            </p>
            <h3 className="text-3xl font-black text-slate-900">
              {orgStats.campaigns_launched.toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* Activity Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
        {/* Activity Header & Filters */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              {userRole === "admin" ? "Team's Activity" : "My Activity"}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <FaCoins className="text-yellow-500" />
              <span className="text-slate-600 font-semibold">
                Total Credits Used:{" "}
                <span className="text-slate-900">
                  {totalCredits.toLocaleString()}
                </span>
              </span>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md ml-2 border border-slate-200">
                For selected filters
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {/* Member Filter (Admin Only) */}
            {userRole === "admin" && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <FaUser className="text-slate-400" />
                <select
                  value={memberFilter}
                  onChange={(e) => setMemberFilter(e.target.value)}
                  className="bg-transparent border-none text-sm font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="all">All Members</option>
                  {Object.entries(orgMembers).map(([id, mem]) => (
                    <option key={id} value={id}>
                      {mem.first_name} {mem.last_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Time Filter */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <FaCalendarAlt className="text-slate-400" />
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="bg-transparent border-none text-sm font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all_time">All Time</option>
                <option value="today">Today</option>
                <option value="last_7">Last 7 Days</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="last_3_months">Last 3 Months</option>
                <option value="last_6_months">Last 6 Months</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Date Inputs */}
            {timeFilter === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400 transition-colors"
                />
                <span className="text-slate-400 font-medium">to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400 transition-colors"
                />
              </div>
            )}
          </div>
        </div>

        {/* Activity Table */}
        {filteredActions.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center border border-dashed border-slate-200 rounded-3xl">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <FaFilter size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">
              No activity found
            </h3>
            <p className="text-slate-500">
              There are no actions matching your current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {userRole === "admin" && (
                    <th className="pb-4 pl-4 font-semibold">Team Member</th>
                  )}
                  <th className="pb-4 pl-4 font-semibold">Action Detail</th>
                  <th className="pb-4 font-semibold">Date & Time</th>
                  <th className="pb-4 text-right pr-4 font-semibold">
                    Credits Used
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedActions.map((action) => {
                  const member = orgMembers[action.user_id];
                  const memberName = member
                    ? `${member.first_name} ${member.last_name}`
                    : "Unknown User";
                  const dateObj = new Date(action.created_at);
                  const formattedDate = dateObj.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });
                  const formattedTime = dateObj.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr
                      key={action.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      {userRole === "admin" && (
                        <td className="py-4 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                              {member ? member.first_name.charAt(0) : "?"}
                            </div>
                            <span className="font-semibold text-slate-700">
                              {memberName}
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="py-4 pl-4">
                        <span className="text-slate-700 font-medium capitalize">
                          {action.action}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="text-sm font-semibold text-slate-600">
                          {formattedDate}
                        </div>
                        <div className="text-xs text-slate-400">
                          {formattedTime}
                        </div>
                      </td>
                      <td className="py-4 text-right pr-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold">
                          {action.credits_used}{" "}
                          <FaCoins className="text-yellow-500 text-xs" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredActions.length > pageSize && (
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
            <p className="text-sm text-slate-500 font-medium">
              Showing{" "}
              <span className="font-bold text-slate-700">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-slate-700">
                {Math.min(currentPage * pageSize, filteredActions.length)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-700">
                {filteredActions.length}
              </span>{" "}
              entries
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
