"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { User, Bot, FileText, ExternalLink, Flag, FlagOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  sources?: { title: string; filePath: string; score: number }[];
}

export function MessageThread({
  messages,
  flagged,
  onToggleFlag,
}: {
  messages: ChatMessage[];
  flagged: boolean;
  onToggleFlag?: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {messages.length} messages
        </p>
        {onToggleFlag && (
          <Button
            variant={flagged ? "destructive" : "outline"}
            size="sm"
            onClick={onToggleFlag}
          >
            {flagged ? (
              <>
                <FlagOff className="h-3.5 w-3.5 mr-1.5" />
                Unflag
              </>
            ) : (
              <>
                <Flag className="h-3.5 w-3.5 mr-1.5" />
                Flag for review
              </>
            )}
          </Button>
        )}
      </div>

      <ScrollArea className="h-[600px] custom-scrollbar">
        <div className="space-y-4 pr-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === "assistant" && "flex-row",
                msg.role === "user" && "flex-row",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  msg.role === "user" ? "bg-primary/10" : "bg-chart-2/10",
                )}
              >
                {msg.role === "user" ? (
                  <User className="h-4 w-4 text-primary" />
                ) : (
                  <Bot className="h-4 w-4 text-chart-2" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium capitalize">
                    {msg.role}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleString()}
                  </span>
                </div>
                <Card>
                  <CardContent className="py-3 px-4">
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:mt-3 prose-headings:mb-1 prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1 prose-table:text-xs">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    )}
                  </CardContent>
                </Card>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">
                      Sources cited:
                    </p>
                    {msg.sources.map((src, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs bg-muted px-2 py-1.5 rounded"
                      >
                        <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate flex-1">{src.title}</span>
                        <Badge
                          variant="outline"
                          className="text-[10px] shrink-0"
                        >
                          {(src.score * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
