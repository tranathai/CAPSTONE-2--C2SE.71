import { useCallback, useEffect, useRef, useState } from "react";

export function useAsyncResource(loader) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestSeqRef = useRef(0);

  const run = useCallback(async () => {
    const requestId = requestSeqRef.current + 1;
    requestSeqRef.current = requestId;

    setLoading(true);
    setError("");
    try {
      const nextData = await loader();
      if (requestSeqRef.current === requestId) {
        setData(nextData);
      }
    } catch (apiError) {
      if (requestSeqRef.current === requestId) {
        setError(apiError?.message || "Khong tai duoc du lieu");
      }
    } finally {
      if (requestSeqRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [loader]);

  useEffect(() => {
    run();
    return () => {
      requestSeqRef.current += 1;
    };
  }, [run]);

  return { data, loading, error, reload: run };
}
