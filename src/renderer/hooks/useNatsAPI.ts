import { useEffect, useState } from 'react';

export function useNatsAPI() {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);

  useEffect(() => {
    setIsAvailable(typeof window !== 'undefined' && !!(window as any).natsAPI);
  }, []);

  return {
    api: (typeof window !== 'undefined' ? (window as any).natsAPI : null),
    isAvailable,
  };
}

export default useNatsAPI;
