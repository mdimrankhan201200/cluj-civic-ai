import { anthropic } from "@/lib/anthropic";
import type { AiAnalysisResult } from "@/types";

const VALID_ISSUE_TYPES = [
  "POTHOLE", "BROKEN_ROAD", "SIDEWALK_DAMAGE", "OVERFLOWING_BIN",
  "GARBAGE", "BROKEN_STREET_LIGHT", "TRAFFIC_LIGHT_DAMAGE", "WATER_LEAKAGE",
  "TRAFFIC_SIGN_DAMAGE", "CONSTRUCTION_HAZARD", "ROAD_CRACK", "OTHER",
] as const;

const VALID_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

type MediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

function isAnthropicConfigured() {
  const key = process.env.ANTHROPIC_API_KEY ?? "";
  return key.length > 10 && !key.includes("your-") && !key.includes("placeholder");
}


const DEMO_SCENARIOS: Array<{
  issueType: typeof VALID_ISSUE_TYPES[number];
  severity: typeof VALID_SEVERITIES[number];
  summary: string;
  confidence: number;
  additionalNotes: string;
}> = [
  {
    issueType: "POTHOLE",
    severity: "HIGH",
    summary: "A deep pothole approximately 30 cm wide detected on the roadway, posing a risk of vehicle damage.",
    confidence: 91,
    additionalNotes: "Temporary warning marking recommended until repair is completed.",
  },
  {
    issueType: "BROKEN_ROAD",
    severity: "MEDIUM",
    summary: "Road surface shows longitudinal cracks and advanced deterioration over an extended section.",
    confidence: 85,
    additionalNotes: "Requires asphalt resurfacing in the near term.",
  },
  {
    issueType: "SIDEWALK_DAMAGE",
    severity: "MEDIUM",
    summary: "Cracked and displaced paving slabs creating a tripping hazard for pedestrians.",
    confidence: 88,
    additionalNotes: "Area frequented by elderly residents — medium priority.",
  },
  {
    issueType: "OVERFLOWING_BIN",
    severity: "LOW",
    summary: "Waste bin is overflowing with garbage exceeding container capacity.",
    confidence: 94,
    additionalNotes: "Requires urgent collection and possibly increased collection frequency.",
  },
  {
    issueType: "BROKEN_STREET_LIGHT",
    severity: "HIGH",
    summary: "Non-functional street light pole detected, leaving the area with reduced visibility at night.",
    confidence: 89,
    additionalNotes: "Safety risk for pedestrians and vehicle traffic during nighttime hours.",
  },
  {
    issueType: "WATER_LEAKAGE",
    severity: "CRITICAL",
    summary: "Visible water leak from the underground network causing water accumulation on the roadway.",
    confidence: 87,
    additionalNotes: "Urgent intervention required to prevent structural damage to the road.",
  },
  {
    issueType: "GARBAGE",
    severity: "LOW",
    summary: "Illegally dumped household waste on public space, affecting the appearance of the area.",
    confidence: 92,
    additionalNotes: "Recommended: place a prohibition sign and clean up immediately.",
  },
  {
    issueType: "ROAD_CRACK",
    severity: "MEDIUM",
    summary: "Transverse and longitudinal cracks on the asphalt surface indicating early structural deterioration.",
    confidence: 83,
    additionalNotes: "Preventive treatment recommended before the cold season.",
  },
  {
    issueType: "TRAFFIC_SIGN_DAMAGE",
    severity: "HIGH",
    summary: "Damaged and partially illegible road sign reducing traffic safety at the intersection.",
    confidence: 90,
    additionalNotes: "Urgent replacement recommended in accordance with road safety regulations.",
  },
  {
    issueType: "CONSTRUCTION_HAZARD",
    severity: "HIGH",
    summary: "Construction site without adequate signage, posing a danger to passersby.",
    confidence: 86,
    additionalNotes: "Immediate placement of protective barriers and warning signs required.",
  },
  {
    issueType: "TRAFFIC_LIGHT_DAMAGE",
    severity: "HIGH",
    summary: "Traffic light unit is damaged or non-functional, creating a safety hazard at the intersection.",
    confidence: 89,
    additionalNotes: "Requires urgent repair or replacement to restore safe traffic flow.",
  },
];

function getDemoResult(buffer?: Buffer): AiAnalysisResult {
  let hash = 0;
  if (buffer && buffer.length > 0) {
    const step = Math.max(1, Math.floor(buffer.length / 8));
    for (let i = 0; i < buffer.length; i += step) {
      hash = (hash * 31 + (buffer[i] ?? 0)) & 0xffffffff;
    }
  } else {
    hash = Math.floor(Math.random() * 0xffffffff);
  }
  const idx = Math.abs(hash) % DEMO_SCENARIOS.length;
  return { ...DEMO_SCENARIOS[idx], isDemoMode: true };
}

export async function analyzeInfrastructureImage(
  imageUrl: string,
  buffer?: Buffer,
  mimeType?: string
): Promise<AiAnalysisResult> {
  if (!isAnthropicConfigured()) {
    // Simulate a brief analysis delay for realism
    await new Promise((r) => setTimeout(r, 1200));
    return getDemoResult(buffer);
  }

  try {
    const isLocal = imageUrl.startsWith("/") || imageUrl.startsWith("http://localhost");

    const imageSource = isLocal && buffer
      ? { type: "base64" as const, media_type: (mimeType ?? "image/jpeg") as MediaType, data: buffer.toString("base64") }
      : { type: "url" as const, url: imageUrl };

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: imageSource },
            {
              type: "text",
              text: `You are an AI assistant for the Cluj Civic platform that analyzes photos of urban infrastructure problems in Cluj-Napoca, Romania.

Look carefully at the image and identify the main infrastructure problem visible.

Respond ONLY with a valid JSON object in this exact format (no markdown, no extra text):
{
  "issueType": "<choose the BEST matching type from the list below>",
  "severity": "<one of: LOW, MEDIUM, HIGH, CRITICAL>",
  "summary": "<1-2 sentences describing the specific problem visible in the image>",
  "confidence": <integer 0-100>,
  "additionalNotes": "<safety observations or empty string>"
}

Issue type options (pick the most specific match):
- POTHOLE: hole or depression in road surface
- BROKEN_ROAD: large-scale road deterioration, crumbling asphalt
- SIDEWALK_DAMAGE: broken, cracked or displaced pavement/footpath
- OVERFLOWING_BIN: waste bin that is full or overflowing
- GARBAGE: illegally dumped waste or litter
- BROKEN_STREET_LIGHT: street lamp pole or fixture that is broken/dark
- TRAFFIC_LIGHT_DAMAGE: traffic signal (red/yellow/green light) that is broken, damaged or non-functional
- WATER_LEAKAGE: water pipe leak, flooding from underground, or visible water damage
- TRAFFIC_SIGN_DAMAGE: road sign (stop, speed limit, direction) that is broken or missing
- CONSTRUCTION_HAZARD: unsafe construction site, open excavation, missing barriers
- ROAD_CRACK: surface cracks or fissures in road
- OTHER: any infrastructure problem not matching the above

Severity guide:
- LOW: cosmetic issue, no safety risk
- MEDIUM: needs attention within weeks
- HIGH: hazard that could cause accidents
- CRITICAL: immediate danger, requires same-day response

Respond ONLY with JSON.`,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return getDemoResult(buffer);

    const raw = JSON.parse(textBlock.text) as AiAnalysisResult;
    const issueType = VALID_ISSUE_TYPES.includes(raw.issueType as never) ? raw.issueType : "OTHER";
    const severity = VALID_SEVERITIES.includes(raw.severity as never) ? raw.severity : "MEDIUM";

    return {
      issueType,
      severity,
      summary: raw.summary ?? getDemoResult(buffer).summary,
      confidence: Math.min(100, Math.max(0, raw.confidence ?? 50)),
      additionalNotes: raw.additionalNotes ?? "",
    };
  } catch (err) {
    console.error("[AI Analysis] Anthropic API error:", err);
    return getDemoResult(buffer);
  }
}
