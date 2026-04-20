"use client";

import { RezoomAITrialNotice } from "@/components/RezoomAITrialNotice";
import { useRezoomAIAccess } from "@/hooks/useRezoomAIAccess";
import { Icons } from "./icons";

export function CopilotPanel({
  messages,
  input,
  setInput,
  onSend,
  isLoading,
  aiAccess,
}: {
  messages: { role: "user" | "assistant"; content: string }[];
  input: string;
  setInput: (v: string) => void;
  onSend: (message?: string) => void;
  isLoading: boolean;
  aiAccess: ReturnType<typeof useRezoomAIAccess>;
}) {
  const quickActions = [
    "Summarize this job",
    "Write cover letter",
    "Tailor my resume",
    "Interview prep tips",
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-stone-800 flex items-center gap-3">
        <div className="w-8 h-8 border border-orange-600/50 bg-orange-600/10 flex items-center justify-center text-orange-500">
          <Icons.Agent />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-stone-200 font-mono">RezoomAI</h3>
          <p className="text-[10px] text-stone-500 font-mono">Powered by Gemini</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-[10px] text-stone-500 font-mono">Online</span>
        </div>
      </div>

      <div className="px-4 py-3 flex gap-2 flex-wrap border-b border-stone-800/50">
        <div className="w-full">
          <RezoomAITrialNotice
            isAuthenticated={aiAccess.isAuthenticated}
            remainingGuestCredits={aiAccess.remainingGuestCredits}
            requiresLogin={aiAccess.requiresLogin}
            loginHref={aiAccess.loginHref}
            encouragement={aiAccess.encouragement}
            theme="dark"
          />
        </div>
        {quickActions.map((action) => (
          <button
            key={action}
            onClick={() => onSend(action)}
            disabled={isLoading || aiAccess.requiresLogin}
            className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-[11px] font-medium border border-purple-500/20 hover:bg-purple-500/20 transition-all disabled:opacity-50"
          >
            {action}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 text-sm font-mono ${
                msg.role === "user"
                  ? "bg-orange-600/10 text-orange-200"
                  : "bg-stone-800 text-stone-300"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-stone-800 px-4 py-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-stone-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              aiAccess.requiresLogin
                ? "Log in to continue with RezoomAI..."
                : "Ask anything or tailor your resume..."
            }
            disabled={isLoading || aiAccess.requiresLogin}
            className="flex-1 bg-transparent border-b border-stone-800 rounded-none px-4 py-2.5 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-orange-600 focus:ring-0 transition-all disabled:opacity-50 font-mono"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || aiAccess.requiresLogin}
            className="w-10 h-10 bg-orange-600/10 text-orange-500 border border-orange-600/50 flex items-center justify-center hover:bg-orange-600/20 transition-colors disabled:opacity-50"
          >
            <Icons.Send />
          </button>
        </form>
      </div>
    </div>
  );
}
