import { useEffect, useState } from "react";

/** Retorna true quando a viewport é <= bp px (default 640). */
export default function useIsMobile(bp = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, [bp]);
  return isMobile;
}
