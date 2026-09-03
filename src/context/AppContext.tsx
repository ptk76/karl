import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { getTokenClient } from "../../worker/auth";

interface AppContextType {
  code: string | null;
  token: string | null;
  test: string;
  initToken: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export type RequestPayloadType = {
  type: "goggle";
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [code, setCode] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [test, setTest] = useState<string>("test");

  const sendRequest = async (body: RequestPayloadType): Promise<unknown[]> => {
    try {
      const result = await fetch("/api", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return await result.json();
    } catch (error) {
      return [];
    }
  };

  const requestToken = async () => {
    const result = await sendRequest({ type: "goggle" });
    console.info("RESULT", result);
  };

  useEffect(() => {
    // requestToken();
    return () => {};
  }, []);

  const initToken = async () => {
    await sendRequest({ type: "goggle" });
  };

  return (
    <AppContext.Provider
      value={{
        code,
        token,
        test,
        initToken,
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
