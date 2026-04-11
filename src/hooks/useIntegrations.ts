import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "flowops_integrations";

export interface IntegrationState {
  connected: boolean;
  webhookUrl?: string;
  channel?: string;
  url?: string;
  description?: string;
}

export type IntegrationKey = "email" | "slack" | "google_calendar" | "webhooks";

type IntegrationsMap = Record<IntegrationKey, IntegrationState>;

const defaultState: IntegrationsMap = {
  email: { connected: false },
  slack: { connected: false },
  google_calendar: { connected: false },
  webhooks: { connected: false },
};

function load(): IntegrationsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState, ...JSON.parse(raw) };
  } catch {}
  return { ...defaultState };
}

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<IntegrationsMap>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(integrations));
  }, [integrations]);

  const connect = useCallback((key: IntegrationKey, data?: Partial<IntegrationState>) => {
    setIntegrations((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...data, connected: true },
    }));
  }, []);

  const disconnect = useCallback((key: IntegrationKey) => {
    setIntegrations((prev) => ({
      ...prev,
      [key]: { connected: false },
    }));
  }, []);

  return { integrations, connect, disconnect };
}
