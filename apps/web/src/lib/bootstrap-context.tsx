import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';

import { fetchPublicBootstrap } from './api';
import type { PublicBootstrap } from '../types/public';

interface BootstrapContextValue {
  data: PublicBootstrap | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const BootstrapContext = createContext<BootstrapContextValue | null>(null);

const loadBootstrapData = async (
  onSuccess: (payload: PublicBootstrap) => void,
  onError: (message: string) => void,
  onComplete: () => void,
) => {
  try {
    const payload = await fetchPublicBootstrap();
    onSuccess(payload);
  } catch (loadError) {
    const message = loadError instanceof Error ? loadError.message : 'Ошибка загрузки';
    onError(message);
  } finally {
    onComplete();
  }
};

export const BootstrapProvider = ({ children }: PropsWithChildren) => {
  const [data, setData] = useState<PublicBootstrap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setIsLoading(true);
    setError(null);
    await loadBootstrapData(setData, setError, () => setIsLoading(false));
  };

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    void loadBootstrapData(setData, setError, () => setIsLoading(false));
  }, []);

  return (
    <BootstrapContext.Provider
      value={{
        data,
        isLoading,
        error,
        refresh,
      }}
    >
      {children}
    </BootstrapContext.Provider>
  );
};

export const useBootstrap = () => {
  const context = useContext(BootstrapContext);

  if (!context) {
    throw new Error('useBootstrap must be used within BootstrapProvider');
  }

  return context;
};
