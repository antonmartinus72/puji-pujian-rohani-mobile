import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { DatabaseProfile } from '../services/databaseRegistry';
import type { RemoteVersionPayload } from '../services/updater';

export interface UpdateModalTarget {
  profile: DatabaseProfile;
  remoteVersion: RemoteVersionPayload;
}

export interface UpdateModalContextValue {
  target: UpdateModalTarget | null;
  loading: boolean;
  openUpdateModal: (profile: DatabaseProfile, remoteVersion: RemoteVersionPayload) => void;
  closeUpdateModal: () => void;
  setLoading: (loading: boolean) => void;
}

const UpdateModalContext = createContext<UpdateModalContextValue | null>(null);

export function UpdateModalProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<UpdateModalTarget | null>(null);
  const [loading, setLoading] = useState(false);

  const openUpdateModal = useCallback(
    (profile: DatabaseProfile, remoteVersion: RemoteVersionPayload) => {
      setTarget({ profile, remoteVersion });
    },
    []
  );

  const closeUpdateModal = useCallback(() => {
    setTarget(null);
    setLoading(false);
  }, []);

  const value = useMemo<UpdateModalContextValue>(
    () => ({
      target,
      loading,
      openUpdateModal,
      closeUpdateModal,
      setLoading,
    }),
    [target, loading, openUpdateModal, closeUpdateModal]
  );

  return (
    <UpdateModalContext.Provider value={value}>{children}</UpdateModalContext.Provider>
  );
}

export function useUpdateModal(): UpdateModalContextValue {
  const ctx = useContext(UpdateModalContext);
  if (!ctx) throw new Error('useUpdateModal must be used within UpdateModalProvider');
  return ctx;
}
