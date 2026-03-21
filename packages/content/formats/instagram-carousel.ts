/**
 * Instagram Carousel Format Adapter
 *
 * Generates a series of square (1080x1080) branded image descriptions
 * from content. Each slide is a data-card or chart-card JSON that can
 * be rendered by render.ts.
 */

import type { FormattedOutput, RecipeParams } from "../recipes/types.js";

interface CarouselSlide {
  type: "data-card" | "chart-card";
  title: string;
  bigNumber?: string;
  subtitle?: string;
  caption: string;
  footer?: string;
}

/**
 * Parse LLM output into carousel slide descriptions.
 * Expects LLM to output slides in format:
 *   Slide 1: [title]
 *   Number: [big number]
 *   Caption: [pidgin caption]
 */
export function parseCarouselSlides(llmOutput: string): CarouselSlide[] {
  const slides: CarouselSlide[] = [];
  const lines = llmOutput.split("\n");
  let current: Partial<CarouselSlide> | null = null;

  for (const line of lines) {
    const slideMatch = line.match(/^Slide\s*\d+:\s*(.*)/i);
    if (slideMatch) {
      if (current?.title && current?.caption) {
        slides.push({
          type: "data-card",
          title: current.title,
          bigNumber: current.bigNumber ?? "",
          caption: current.caption,
          subtitle: current.subtitle,
        });
      }
      current = { title: slideMatch[1].trim() };
      continue;
    }

    if (!current) continue;

    const numberMatch = line.match(/^Number:\s*(.*)/i);
    if (numberMatch) {
      current.bigNumber = numberMatch[1].trim();
      continue;
    }

    const subtitleMatch = line.match(/^Subtitle:\s*(.*)/i);
    if (subtitleMatch) {
      current.subtitle = subtitleMatch[1].trim();
      continue;
    }

    const captionMatch = line.match(/^Caption:\s*(.*)/i);
    if (captionMatch) {
      current.caption = captionMatch[1].trim();
      continue;
    }
  }

  // Push last slide
  if (current?.title && current?.caption) {
    slides.push({
      type: "data-card",
      title: current.title,
      bigNumber: current.bigNumber ?? "",
      caption: current.caption,
      subtitle: current.subtitle,
    });
  }

  return slides;
}

/**
 * Format LLM output as Instagram carousel JSON descriptions.
 */
export function formatInstagramCarousel(
  llmOutput: string,
  params: RecipeParams,
  recipeId: string,
): FormattedOutput {
  const slides = parseCarouselSlides(llmOutput);
  const warnings: string[] = [];

  if (slides.length === 0) {
    warnings.push("No parseable slides in LLM output");
  }
  if (slides.length > 10) {
    warnings.push("Instagram carousel max is 10 slides");
  }

  return {
    type: "instagram-carousel",
    content: JSON.stringify(slides, null, 2),
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
