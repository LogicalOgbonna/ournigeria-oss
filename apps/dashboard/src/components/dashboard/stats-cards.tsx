"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, MessagesSquare, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsData {
  users: number;
  conversations: number;
  messages: number;
  documents: number;
}

const cards = [
  { key: "users" as const, label: "Users", icon: Users, color: "text-chart-1" },
  { key: "conversations" as const, label: "Conversations", icon: MessagesSquare, color: "text-chart-2" },
  { key: "messages" as const, label: "Messages", icon: MessageSquare, color: "text-chart-3" },
  { key: "documents" as const, label: "Documents", icon: FileText, color: "text-chart-4" },
];

export function StatsCards({ data }: { data: StatsData }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <Card
          key={card.key}
          className={cn(
            "opacity-0 animate-fade-in-up",
            i === 0 && "stagger-1",
            i === 1 && "stagger-2",
            i === 2 && "stagger-3",
            i === 3 && "stagger-4",
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
            <card.icon className={cn("h-4 w-4", card.color)} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">
              {data[card.key].toLocaleString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
