import { useEffect, useRef } from 'react';
import { useSongs } from '../context/SongContext';
import { useUpdateModal } from '../context/UpdateModalContext';
import { showUpdateAvailable } from '../services/toast';

export default function StartupUpdateListener() {
  const { startupUpdateOffer, clearStartupUpdateOffer } = useSongs();
  const { openUpdateModal } = useUpdateModal();
  const shownRef = useRef(false);

  useEffect(() => {
    if (!startupUpdateOffer || shownRef.current) return;
    shownRef.current = true;
    const { profile, remoteVersion } = startupUpdateOffer;
    const version = remoteVersion.version ?? '';
    showUpdateAvailable(
      version,
      () => {
        openUpdateModal(profile, remoteVersion);
        clearStartupUpdateOffer();
      },
      remoteVersion.changelog
    );
  }, [startupUpdateOffer, openUpdateModal, clearStartupUpdateOffer]);

  return null;
}
