import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => { };

// `useSyncExternalStore` uses `getServerSnapshot` during server rendering
// and `getSnapshot` on the client, preventing cascading renders and hydration mismatches.
export function useClientOnlyValue<S, C>(server: S, client: C): S | C {
  return useSyncExternalStore<S | C>(
    emptySubscribe,
    () => client,
    () => server
  );
}
