import { describe, it, expect } from "vitest";
import { formatInstagramCarousel, parseCarouselSlides } from "../formats/instagram-carousel.js";
import { formatVideoScript, parseVideoScript } from "../formats/video-script.js";
import { formatWhatsApp } from "../formats/whatsapp-forward.js";

describe("Instagram Carousel", () => {
  describe("parseCarouselSlides", () => {
    it("parses standard slide format", () => {
      const input = `Slide 1: State Budget Overview
Number: ₦352.8B
Caption: Lagos state budget don reach ₦352.8 billion

Slide 2: Education Spending
Number: ₦45.2B
Caption: Education get ₦45.2 billion allocation`;
      const slides = parseCarouselSlides(input);
      expect(slides).toHaveLength(2);
      expect(slides[0].title).toBe("State Budget Overview");
      expect(slides[0].bigNumber).toBe("₦352.8B");
      expect(slides[0].caption).toContain("Lagos");
    });

    it("returns empty array for unparseable input", () => {
      const slides = parseCarouselSlides("Just some text without slide markers");
      expect(slides).toHaveLength(0);
    });
  });

  describe("formatInstagramCarousel", () => {
    it("formats valid carousel output", () => {
      const input = `Slide 1: Test
Number: ₦1B
Caption: Test caption`;
      const result = formatInstagramCarousel(input, { state: "Lagos" }, "budget-expose");
      expect(result.type).toBe("instagram-carousel");
      expect(typeof result.content).toBe("string");
      const parsed = JSON.parse(result.content as string);
      expect(parsed).toHaveLength(1);
    });

    it("warns on empty slides", () => {
      const result = formatInstagramCarousel("No slides", {}, "budget-expose");
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain("No parseable slides");
    });
  });
});

describe("Video Script", () => {
  describe("parseVideoScript", () => {
    it("parses scene markers", () => {
      const input = `Scene 1 (Hook): Lagos don budget ₦352B but where the money go?
Scene 2 (Data): Education get ₦45B allocation
Scene 3 (Impact): That money fit build 200 schools
Scene 4 (CTA): Check your state for app.ournigeria.ng`;
      const narration = parseVideoScript(input);
      expect(narration).toHaveLength(4);
      expect(narration[0]).toContain("Lagos");
    });

    it("falls back to paragraphs when no scene markers", () => {
      const input = `This is the first paragraph about Lagos budget.

This is the second paragraph about education spending in Lagos state.

This is the third paragraph about the impact on citizens.`;
      const narration = parseVideoScript(input);
      expect(narration.length).toBeGreaterThan(0);
    });
  });

  describe("formatVideoScript", () => {
    it("produces valid JSON with composition reference", () => {
      const input = "Scene 1 (Hook): Test narration";
      const result = formatVideoScript(input, { state: "Lagos", year: 2024 }, "budget-expose");
      expect(result.type).toBe("video-script");
      const parsed = JSON.parse(result.content as string);
      expect(parsed.composition).toBe("StateBudget");
      expect(parsed.props.state).toBe("Lagos");
      expect(parsed.narration).toHaveLength(1);
    });

    it("maps recipe IDs to compositions", () => {
      const cases: [string, string][] = [
        ["budget-expose", "StateBudget"],
        ["corruption-impact", "CorruptionCase"],
        ["state-comparison", "StateComparison"],
        ["faac-allocation", "FAACAllocation"],
      ];

      for (const [recipeId, expected] of cases) {
        const result = formatVideoScript("Scene 1 (Hook): Test", {}, recipeId);
        const parsed = JSON.parse(result.content as string);
        expect(parsed.composition).toBe(expected);
      }
    });
  });
});

describe("WhatsApp Forward", () => {
  it("formats with header and CTA", () => {
    const result = formatWhatsApp("Budget analysis text", { state: "Lagos", year: 2024 }, "budget-expose");
    expect(result.type).toBe("whatsapp");
    expect(typeof result.content).toBe("string");
    const text = result.content as string;
    expect(text).toContain("Lagos");
    expect(text).toContain("app.ournigeria.ng");
    expect(text).toContain("Forward this");
  });

  it("strips Tweet markers from text", () => {
    const result = formatWhatsApp("Tweet 1: First\nTweet 2: Second", { state: "Lagos" }, "budget-expose");
    const text = result.content as string;
    expect(text).not.toContain("Tweet 1:");
    expect(text).toContain("First");
  });

  it("strips citation markers", () => {
    const result = formatWhatsApp("Some text [1] with citations [2]", { state: "Lagos" }, "budget-expose");
    const text = result.content as string;
    expect(text).not.toContain("[1]");
    expect(text).not.toContain("[2]");
  });

  it("uses different headers per recipe", () => {
    const budget = formatWhatsApp("Test", { state: "Lagos" }, "budget-expose");
    const corruption = formatWhatsApp("Test", { state: "Lagos" }, "corruption-impact");
    expect((budget.content as string)).toContain("Budget Wahala");
    expect((corruption.content as string)).toContain("Corruption Alert");
  });

  it("warns when message is truncated", () => {
    const longText = "A".repeat(5000);
    const result = formatWhatsApp(longText, { state: "Lagos" }, "budget-expose");
    expect(result.warnings).toBeDefined();
    expect(result.warnings![0]).toContain("truncated");
  });
});
