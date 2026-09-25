import React, { createContext, useState, useContext, ReactNode } from "react";

interface AppContextType {
  code: string | null;
  token: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [code] = useState<string | null>(null);
  const [token] = useState<string | null>(null);

  return (
    <AppContext.Provider value={{ code, token }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export default AppContext;
