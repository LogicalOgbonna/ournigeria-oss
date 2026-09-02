import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { generateObject } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { z } from "zod";
import type { SocialsEnvConfig } from "../../../config/env.validation.js";
import type { RawTweet } from "../roamer/twitter-search.service.js";

const GeoClassificationSchema = z.object({
  isNigerian: z.boolean(),
  // State SLUG from the provided list, or null when the author is Nigerian but
  // no state is attributable. Validated against the real list by the caller.
  stateSlug: z.string().nullable(),
  lgaName: z.string().nullable(),
  wardName: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  evidence: z.string().min(1).max(300),
});

export type GeoClassification = z.infer<typeof GeoClassificationSchema>;

const SYSTEM_PROMPT = `You are a profile geo-attribution classifier for Nigerian X (Twitter) accounts.

Given an X author (name, handle, bio, follower count) and one of their tweets, decide:
1. Is this a real individual Nigerian person (not a brand, media outlet, bot, parody, or non-Nigerian)?
2. Which Nigerian STATE can they be attributed to — where they live or come from — based ONLY on explicit signals in the profile location, bio, or tweet (place names, "from X", "based in X", indigene claims, local references)? A Nigerian place in the profile location field is the strongest signal.
3. If the bio/tweet names a specific Local Government Area (LGA) or ward, report it; otherwise null. Do NOT guess granularity that isn't stated.

Rules:
- stateSlug MUST be one of the provided slugs, or null. Never invent slugs.
- A mere mention of a place ("Kano traders are suffering") is weak; self-identification ("proud Kano indigene", bio says "Kano") is strong.
- confidence reflects the STATE attribution (0 if stateSlug is null).
- evidence: ONE short sentence quoting the signal you used.

Return ONLY a JSON object: {"isNigerian": boolean, "stateSlug": string|null, "lgaName": string|null, "wardName": string|null, "confidence": number, "evidence": string}`;

export interface GeoCandidate {
  name: string;
  handle: string;
  bio: string;
  /** Free-text profile location field — the strongest attribution signal when set. */
  location: string;
  followers: number;
  tweetText: string;
}

@Injectable()
export class GeoClassifierService {
  private readonly logger = new Logger(GeoClassifierService.name);
  private readonly model: ReturnType<ReturnType<typeof createDeepSeek>>;
  private readonly temperature: number;

  constructor(config: ConfigService<SocialsEnvConfig>) {
    const provider = createDeepSeek({
      apiKey: config.get("DEEPSEEK_API_KEY")!,
      baseURL: config.get("DEEPSEEK_BASE_URL"),
    });
    const modelId = config.get("SOCIALS_CLASSIFIER_MODEL")!;
    this.model = provider(modelId);
    this.temperature = config.get("SOCIALS_CLASSIFIER_TEMPERATURE")!;
  }

  /**
   * Classify one author. `stateSlugs` is the authoritative slug list (from
   * nigerian_states); a returned slug outside it is nulled out (model
   * hallucination guard — the GM-code incident class of bug).
   */
  async classify(
    candidate: GeoCandidate,
    stateSlugs: string[],
    scoutedStateHint: { slug: string; name: string },
  ): Promise<GeoClassification | null> {
    try {
      const { object } = await generateObject({
        model: this.model,
        schema: GeoClassificationSchema,
        system: SYSTEM_PROMPT,
        prompt: this.userPrompt(candidate, stateSlugs, scoutedStateHint),
        temperature: this.temperature,
        maxOutputTokens: 300,
        abortSignal: AbortSignal.timeout(30_000),
      });
      if (object.stateSlug && !stateSlugs.includes(object.stateSlug)) {
        this.logger.warn(
          `model returned unknown state slug "${object.stateSlug}" for @${candidate.handle} — nulling`,
        );
        return { ...object, stateSlug: null, confidence: 0 };
      }
      return object;
    } catch (err) {
      this.logger.warn(
        `geo classify failed for @${candidate.handle}: ${err instanceof Error ? err.message : err}`,
      );
      return null;
    }
  }

  static fromRawTweet(t: RawTweet): GeoCandidate {
    return {
      name: t.authorName,
      handle: t.authorScreenName,
      bio: t.authorBio,
      location: t.authorLocation,
      followers: t.authorFollowers,
      tweetText: t.text,
    };
  }

  private userPrompt(
    c: GeoCandidate,
    stateSlugs: string[],
    hint: { slug: string; name: string },
  ): string {
    return `Valid state slugs: ${stateSlugs.join(", ")}

This author surfaced in a search for people from ${hint.name} (slug: ${hint.slug}) — a hint, NOT proof. Attribute only what the text supports; a different state (or null) is a correct answer.

AUTHOR:
Name: ${c.name} (@${c.handle})
Bio: ${c.bio || "(empty)"}
Profile location: ${c.location || "(empty)"}
Followers: ${c.followers}

Tweet text:
${c.tweetText}

Classify this author.`;
  }
}
