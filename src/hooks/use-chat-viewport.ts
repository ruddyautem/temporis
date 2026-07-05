import { useCallback, useEffect, useRef, useState } from "react";

export const useChatViewport = <T,>(displayMessages: T[]) => {
  const mainRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef(false);

  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (isUserScrolledUpRef.current) return;
    setTimeout(() => {
      scrollAnchorRef.current?.scrollIntoView({ behavior, block: "end" });
      setHasNewMessage(false);
    }, 150);
  }, []);

  const jumpToBottom = useCallback(() => {
    isUserScrolledUpRef.current = false;
    setIsUserScrolledUp(false);
    setHasNewMessage(false);
    setTimeout(() => {
      scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 50);
  }, []);

  // Track whether the user has manually scrolled away from the bottom.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const scrolledUp = distanceFromBottom > 80;
      isUserScrolledUpRef.current = scrolledUp;
      setIsUserScrolledUp(scrolledUp);
      if (!scrolledUp) setHasNewMessage(false);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // New message arrived: either follow it to the bottom, or flag it if scrolled up.
  useEffect(() => {
    if (displayMessages.length === 0) return;
    if (isUserScrolledUpRef.current) setHasNewMessage(true);
    else scrollToBottom();
  }, [displayMessages, scrollToBottom]);

  // Mobile keyboard opening/closing resizes the visual viewport; keep the
  // chat pinned inside it and follow the scroll position back to the bottom.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let lastHeight = vv.height;

    const updateLayout = () => {
      if (!mainRef.current) return;
      const heightChanged = vv.height !== lastHeight;
      lastHeight = vv.height;
      mainRef.current.style.height = `${vv.height}px`;
      mainRef.current.style.top = `${vv.offsetTop}px`;
      if (heightChanged && !isUserScrolledUpRef.current) {
        setTimeout(() => {
          scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 150);
      }
    };

    vv.addEventListener("resize", updateLayout);
    vv.addEventListener("scroll", updateLayout);
    updateLayout();
    return () => {
      vv.removeEventListener("resize", updateLayout);
      vv.removeEventListener("scroll", updateLayout);
    };
  }, []);

  return {
    mainRef,
    scrollAnchorRef,
    scrollContainerRef,
    isUserScrolledUp,
    hasNewMessage,
    jumpToBottom,
  };
};