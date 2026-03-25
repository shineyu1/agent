"use client";

import React from "react";
import { useState } from "react";

type CommandCopyButtonProps = {
  commands: readonly string[];
  copy: {
    idle: string;
    copied: string;
    idleAriaLabel: string;
    copiedAriaLabel: string;
  };
};

export function CommandCopyButton({ commands, copy }: CommandCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const commitCopiedState = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleCopy = async () => {
    const payload = commands.join("\n");

    try {
      await navigator.clipboard.writeText(payload);
      commitCopiedState();
    } catch {
      const helper = document.createElement("textarea");
      helper.value = payload;
      helper.setAttribute("readonly", "true");
      helper.style.position = "absolute";
      helper.style.left = "-9999px";
      document.body.appendChild(helper);
      helper.select();

      const copiedWithFallback = document.execCommand("copy");
      document.body.removeChild(helper);

      if (copiedWithFallback) {
        commitCopiedState();
      } else {
        setCopied(false);
      }
    }
  };

  return (
    <button
      type="button"
      aria-label={copied ? copy.copiedAriaLabel : copy.idleAriaLabel}
      className="hero-copy-button"
      onClick={handleCopy}
    >
      {copied ? copy.copied : copy.idle}
    </button>
  );
}
