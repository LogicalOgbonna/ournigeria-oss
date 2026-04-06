import { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicChatView } from "./PublicChatView";
import { AIResponseContent } from "@/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://spending-api.arinze.online";

interface PublicConversation {
  id: string;
  title: string;
  slug: string;
  sharedAt: string;
  mentionedStates: string[];
  mentionedYears: number[];
  createdAt: string;
  messages: {
    id: string;
    sequenceNumber: number;
    role: "user" | "assistant";
    content: string;
    richContent?: AIResponseContent;
    createdAt: string;
  }[];
}

const getConversation = cache(
  async (slug: string): Promise<PublicConversation | null> => {
    try {
      const res = await fetch(
        `${API_URL}/api/conversations/public/${slug}`,
        { cache: "no-store" },
      );
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const conversation = await getConversation(slug);

  if (!conversation) {
    return { title: "Conversation Not Found | OurNigeria" };
  }

  const description =
    conversation.messages.find((m) => m.role === "assistant")?.content?.slice(0, 160) ??
    "Explore Nigerian budget data through AI-powered conversations on OurNigeria.";

  const url = `${process.env.NEXT_PUBLIC_APP_URL || "https://ournigeria.ng"}/chat/${slug}`;

  return {
    title: `${conversation.title} | OurNigeria`,
    description,
    openGraph: {
      title: conversation.title,
      description,
      url,
      siteName: "OurNigeria",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: conversation.title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function PublicChatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const conversation = await getConversation(slug);

  if (!conversation) {
    notFound();
  }

  // FAQ structured data for SEO
  const faqPairs = conversation.messages.reduce<
    { question: string; answer: string }[]
  >((acc, msg, i, arr) => {
    if (msg.role === "user" && arr[i + 1]?.role === "assistant") {
      acc.push({
        question: msg.content,
        answer: arr[i + 1].content.slice(0, 500),
      });
    }
    return acc;
  }, []);

  const jsonLd =
    faqPairs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqPairs.map((pair) => ({
            "@type": "Question",
            name: pair.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: pair.answer,
            },
          })),
        }
      : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <PublicChatView conversation={conversation} />
    </>
  );
}
