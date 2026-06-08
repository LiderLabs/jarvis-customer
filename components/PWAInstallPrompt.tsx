"use client";
import { useState, useEffect } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download, X, Share } from "lucide-react";

export const PWAInstallPrompt = () => {
  const { isInstallable, promptInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsIOS(ios);
    setIsStandalone(standalone);
  }, []);

  if (isDismissed || isStandalone) return null;
  if (!isInstallable && !isIOS) return null;

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) setIsDismissed(true);
  };

  // iOS Safari banner
  if (isIOS && !isInstallable) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto bg-card border border-border rounded-2xl shadow-xl p-4">
        <button onClick={() => setIsDismissed(true)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Share className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Install Rapid Wash</h3>
            <p className="text-xs text-muted-foreground">Add to your Home Screen</p>
          </div>
        </div>
        <div className="bg-muted rounded-xl p-3 text-xs text-muted-foreground space-y-1.5">
          <p>1. Tap the <strong>Share</strong> button (⬆️) at the bottom of Safari</p>
          <p>2. Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong></p>
          <p>3. Tap <strong>&ldquo;Add&rdquo;</strong> to install</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto bg-card border border-border rounded-2xl shadow-xl p-4">
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">Install Rapid Wash</h3>
          <p className="text-xs text-muted-foreground">Faster access & offline support</p>
        </div>
      </div>
      <button
        onClick={handleInstall}
        className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        Install App
      </button>
    </div>
  );
};
