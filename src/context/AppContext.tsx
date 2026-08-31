import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";

interface AppContextType {
  code: string | null;
  token: string | null;
  test: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [code, setCode] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [test, setTest] = useState<string>("test");

  useEffect(() => {
    console.log("GET CODE");
    const url = new URL(location.href);

    setCode(url.searchParams.get("code"));
    console.log("URL", url);
    return () => {};
  }, []);

  return (
    <AppContext.Provider
      value={{
        code,
        token,
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
