import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../app/lib/supabase";

export function useScrapeStatus(orgId) {
  const [activeRequest, setActiveRequest] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Storage for latest values to prevent stale closures in polling/realtime
  const stateRef = useRef({ activeRequest: false, scrapeStatus: null });

  const updateLocalState = useCallback((active, status) => {
    if (stateRef.current.activeRequest !== active) {
      setActiveRequest(active);
    }
    if (stateRef.current.scrapeStatus !== status) {
      setScrapeStatus(status);
    }
    stateRef.current = { activeRequest: active, scrapeStatus: status };
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!orgId) return;
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("active_request, scrape_status")
        .eq("org_id", orgId)
        .single();

      if (data) {
        updateLocalState(data.active_request, data.scrape_status);
      }
    } catch (err) {
      console.error("Fetch Status Error:", err);
    } finally {
      setLoading(false);
    }
  }, [orgId, updateLocalState]);

  const resetStatus = useCallback(async () => {
    if (!orgId) return;
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          scrape_status: null,
          active_request: false
        })
        .eq("org_id", orgId);
      
      if (error) throw error;
      
      updateLocalState(false, null);
    } catch (err) {
      console.error("Error resetting scrape status:", err);
    }
  }, [orgId, updateLocalState]);

  useEffect(() => {
    if (!orgId) return;

    fetchStatus();

    // 1. POLLING FALLBACK (Every 3 seconds)
    // Ensures status updates even if Realtime subscription is flaky or blocked by firewall
    const pollInterval = setInterval(() => {
      fetchStatus();
    }, 3000);

    // 2. ROBUST REALTIME SUBSCRIPTION
    // We listen to all changes on the table and filter by org_id in JS.
    // This bypasses issues with PostgreSQL Replication settings that sometimes break row-level filters.
    const channel = supabase
      .channel(`org-global-sync-${orgId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "organizations",
        },
        (payload) => {
          // JS Filter instead of Postgres Filter for higher reliability
          if (payload.new && payload.new.org_id === orgId) {
            console.log("Hybrid Sync: Realtime update caught for org:", orgId, payload.new.scrape_status);
            updateLocalState(payload.new.active_request, payload.new.scrape_status);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Hybrid Sync: Subscribed for org: ${orgId}`);
        }
      });

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [orgId, fetchStatus, updateLocalState]);

  return { activeRequest, scrapeStatus, loading, resetStatus, refreshStatus: fetchStatus };
}
