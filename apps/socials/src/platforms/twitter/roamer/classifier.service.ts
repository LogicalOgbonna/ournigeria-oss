import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { generateObject } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { z } from "zod";
import type { SocialsEnvConfig } from "../../../config/env.validation.js";
import type { RawTweet } from "./twitter-search.service.js";

const ClassificationSchema = z.object({
  relevant: z.boolean(),
  score: z.number().min(0).max(1),
  reason: z.string().min(1).max(400),
  intent: z.enum([
    "buying",
    "complaining",
    "asking",
    "promoting",
    "discussing",
    "other",
  ]),
});

export type Classification = z.infer<typeof ClassificationSchema>;

export interface ClassifyTopic {
  name: string;
  description: string;
  positiveExamples: string[];
  negativeExamples: string[];
}

const SYSTEM_PROMPT = `You are a tweet relevance classifier.

Given a topic and a tweet (with author context), decide whether the tweet is genuinely on-topic for the given topic and assign a relevance score from 0 to 1.

Score rubric:
- 0.0–0.3: off-topic or only tangentially related
- 0.4–0.6: mentions the topic but not the user's primary subject
- 0.7–0.85: clearly about the topic with substantive content
- 0.86–1.0: highly on-topic, original signal, useful to surface

Return ONLY a JSON object with this exact shape:
{"relevant": boolean, "score": number, "reason": string, "intent": one of "buying"|"complaining"|"asking"|"promoting"|"discussing"|"other"}

The "reason" must be ONE short sentence (under 200 characters) explaining the score. Pick the "intent" that best describes what the author is doing in the tweet.`;

@Injectable()
export class ClassifierService {
  private readonly logger = new Logger(ClassifierService.name);
  private readonly model: ReturnType<ReturnType<typeof createDeepSeek>>;
  readonly modelVersion: string;
  private readonly temperature: number;

  constructor(config: ConfigService<SocialsEnvConfig>) {
    const provider = createDeepSeek({
      apiKey: config.get("DEEPSEEK_API_KEY")!,
      baseURL: config.get("DEEPSEEK_BASE_URL"),
    });
    const modelId = config.get("SOCIALS_CLASSIFIER_MODEL")!;
    this.model = provider(modelId);
    this.modelVersion = `${modelId}@v1`;
    this.temperature = config.get("SOCIALS_CLASSIFIER_TEMPERATURE")!;
  }

  async classify(
    topic: ClassifyTopic,
    tweet: RawTweet,
  ): Promise<Classification | null> {
    try {
      const { object } = await generateObject({
        model: this.model,
        schema: ClassificationSchema,
        system: SYSTEM_PROMPT,
        prompt: this.userPrompt(topic, tweet),
        temperature: this.temperature,
        maxOutputTokens: 300,
        abortSignal: AbortSignal.timeout(30_000),
      });
      return object;
    } catch (err) {
      this.logger.warn(
        `classify failed: ${err instanceof Error ? err.message : err}`,
      );
      return null;
    }
  }

  private userPrompt(topic: ClassifyTopic, tweet: RawTweet): string {
    const pos =
      topic.positiveExamples.length > 0
        ? `\nPositive examples (clearly relevant):\n${topic.positiveExamples
            .map((e) => `- ${e}`)
            .join("\n")}`
        : "";
    const neg =
      topic.negativeExamples.length > 0
        ? `\nNegative examples (NOT relevant):\n${topic.negativeExamples
            .map((e) => `- ${e}`)
            .join("\n")}`
        : "";

    return `TOPIC: ${topic.name}
Description: ${topic.description}${pos}${neg}

TWEET to classify:
Author: ${tweet.authorName} (@${tweet.authorScreenName})
Author bio: ${tweet.authorBio}
Author followers: ${tweet.authorFollowers}
Engagement: ${tweet.likeCount} likes, ${tweet.replyCount} replies, ${tweet.quoteCount} quotes, ${tweet.retweetCount} retweets
Is reply: ${tweet.isReply}
Is quote: ${tweet.isQuote}

Tweet text:
${tweet.text}

Classify this tweet against the topic.`;
  }
}
