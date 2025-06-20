import React, { createContext, useContext, useState, useCallback } from 'react';

interface DashboardRefreshContextType {
  dashboardRefreshKey: number;
  triggerDashboardRefresh: () => void;
}

const DashboardRefreshContext = createContext<DashboardRefreshContextType | undefined>(undefined);

export const DashboardRefreshProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

  const triggerDashboardRefresh = useCallback(() => {
    setDashboardRefreshKey(prevKey => prevKey + 1);
  }, []);

  const value = {
    dashboardRefreshKey,
    triggerDashboardRefresh,
  };

  return (
    <DashboardRefreshContext.Provider value={value}>
      {children}
    </DashboardRefreshContext.Provider>
  );
};

export const useDashboardRefresh = () => {
  const context = useContext(DashboardRefreshContext);
  if (context === undefined) {
    throw new Error('useDashboardRefresh must be used within a DashboardRefreshProvider');
  }
  return context;
};