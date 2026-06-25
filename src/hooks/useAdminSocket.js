import { useEffect } from 'react';
import { getSocket } from '../services/socket';

/**
 * Subscribe to socket.io events in an admin component.
 * @param {Object} handlers - { 'event:name': callbackFn }
 */
export default function useAdminSocket(handlers) {
  useEffect(() => {
    const socket = getSocket();
    const entries = Object.entries(handlers);
    entries.forEach(([event, fn]) => socket.on(event, fn));
    return () => {
      entries.forEach(([event, fn]) => socket.off(event, fn));
    };
  }, []); // mount/unmount only — handlers are stable callbacks
}
