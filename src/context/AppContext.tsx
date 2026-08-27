import React, { createContext, useState, useContext, ReactNode } from "react";

interface AppContextType {
  test: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [test, setTest] = useState<string>("test");

  return (
    <AppContext.Provider
      value={{
        test,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
