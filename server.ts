import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "25mb" }));

// System Prompt for HiddenBrains BA SOP Evaluation
const SYSTEM_INSTRUCTION = `
You are the Lead Business Analyst (BA) Intelligence Engine at HiddenBrains Infotech.
Your task is to analyze inbound leads (email threads, briefs, call notes, attached specs) strictly according to the "HiddenBrains Business Analyst — Lead Qualification & Approach SOP (Global Inbound Leads)".

Follow this exact 3-Axis Qualification Framework:

--- AXIS 1: ENTITY TYPE (Max 4 Pts) ---
* If contact is an intermediary (digital agency, reseller, freelancer, consultant), score the END CLIENT's entity type, NOT the intermediary.
- 1 Pt: New / idea-stage startup (no funding, no team)
- 2 Pts: Digital agency / reseller (qualify end client where possible)
- 3 Pts: Funded startup (seed / Series A+) or established SME
- 4 Pts: Enterprise / large corporate

--- AXIS 2: GEOGRAPHY & PAYING CAPACITY (Max 4 Pts) ---
* Score the market of the PAYING ENTITY, NOT the point of contact's home country!
  e.g., an Indian-based contact representing a US buyer is Tier A (4 pts).
  e.g., an African contact representing a European enterprise buyer is Tier A (4 pts).
- Tier A (4 Pts): US, UK, Canada, Australia, Western Europe, Gulf enterprises
- Tier B (3 Pts): Israel, Singapore, Eastern Europe, established South Africa / Gulf SMEs
- Tier C (2 Pts): India (funded startups / enterprises), Mexico & LatAm mid-market
- Tier D (1 Pt): India bootstrapped SMB, broader Africa SMB, LatAm/SEA bootstrapped

--- AXIS 3: READINESS / PREPARATION LEVEL (Max 4 Pts) ---
- Level 0 (1 Pt): Single line, no reference ("I want to build an app like Uber")
- Level 1 (2 Pts): Reference site/app given, no written specs
- Level 2 (3 Pts): Written requirement list / feature brief, informal
- Level 3 (4 Pts): Documented spec / PRD / wireframes / working prototype

--- COMPOSITE SCORING & TIERING ---
Composite score = Axis 1 + Axis 2 + Axis 3 (Max 12 pts).
- Platinum (10 - 12 pts): High budget, high complexity/scale, well-prepared
- Gold (7 - 9 pts): Strong potential, at least one axis needs development
- Silver (4 - 6 pts): Real opportunity but price-sensitive and/or early-stage
- Bronze (3 pts): Lowest near-term potential, nurture

--- RED FLAGS (Disqualification Criteria) ---
Evaluate if any of these are present:
1. Stated budget is clearly incompatible with stated scope (e.g. full marketplace app for $300).
2. No verifiable contact details or contact avoids providing verifiable channel.
3. Requests for free detailed specs, architecture, or estimates beyond reasonable pre-engagement.
4. Repeated qualification cycles with no willingness to share budget, timeline, or decision-maker.
5. Prior engagement history flagged for non-payment, disputes, or abusive conduct.

If a Red Flag is detected, downgrade assigned tier if necessary or flag CRITICAL escalation.

--- THIN-INFORMATION PROTOCOL (Section 7) ---
If Readiness is L0 or L1, set requiresThinInfoProtocol to TRUE and construct tailored versions of the 7 Thin-Info Questions:
1. Budget range?
2. Target timeline / launch date?
3. Decision-maker & evaluation team?
4. Existing team or first build?
5. Reference apps/sites (likes/dislikes & why)?
6. Target users & core monetization model?
7. 3-5 must-have features vs nice-to-haves?

--- TIER-BASED APPROACH PLAYBOOK (Section 6) ---
- Platinum: Senior BA + Practice Head/Principal; SLA <24h; Full discovery workshop (multi-session); Detailed SOW with phased roadmap, dedicated-team/milestone pricing.
- Gold: Senior / Mid BA; SLA <48h; Structured discovery call 60-90 min; Detailed estimate + phased SOW.
- Silver: Mid / Junior BA; SLA <3 business days; Template-driven call 30-45 min + questionnaire; Fixed-scope quick estimate, standard packages.
- Bronze: Junior BA / automated nurture; Templated auto-response; Qualifying questionnaire by email first; Ballpark range only, nurture sequence.

Provide a thorough, objective analysis in JSON strictly adhering to the schema.
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    leadTitle: { type: Type.STRING, description: "Short descriptive lead title" },
    prospectName: { type: Type.STRING, description: "Extracted or inferred prospect name" },
    prospectCompany: { type: Type.STRING, description: "Extracted prospect company name or entity" },
    
    axis1: {
      type: Type.OBJECT,
      properties: {
        entityType: { type: Type.STRING, description: "IDEA_STARTUP, AGENCY_RESELLER, FUNDED_STARTUP_SME, or ENTERPRISE" },
        score: { type: Type.INTEGER, description: "1, 2, 3, or 4" },
        entityTypeName: { type: Type.STRING, description: "Human readable entity type label" },
        endClientName: { type: Type.STRING, description: "End client name if contact is intermediary" },
        isIntermediary: { type: Type.BOOLEAN, description: "True if contact is agency, freelancer, or broker" },
        rationale: { type: Type.STRING, description: "Detailed rationale for Entity Type score" }
      },
      required: ["entityType", "score", "entityTypeName", "isIntermediary", "rationale"]
    },

    axis2: {
      type: Type.OBJECT,
      properties: {
        payingTier: { type: Type.STRING, description: "TIER_A, TIER_B, TIER_C, or TIER_D" },
        score: { type: Type.INTEGER, description: "1, 2, 3, or 4" },
        contactCountry: { type: Type.STRING, description: "Point of contact country" },
        payingEntityCountry: { type: Type.STRING, description: "Paying entity/buyer country" },
        payingEntityRegion: { type: Type.STRING, description: "Region name, e.g. North America, Western Europe, Gulf, India" },
        mismatchNote: { type: Type.STRING, description: "Note on geography mismatch if contact location differs from paying entity" },
        rationale: { type: Type.STRING, description: "Detailed rationale for Geography & Paying Capacity score" }
      },
      required: ["payingTier", "score", "contactCountry", "payingEntityCountry", "payingEntityRegion", "rationale"]
    },

    axis3: {
      type: Type.OBJECT,
      properties: {
        readinessLevel: { type: Type.STRING, description: "L0, L1, L2, or L3" },
        score: { type: Type.INTEGER, description: "1, 2, 3, or 4" },
        readinessDescription: { type: Type.STRING, description: "Level description, e.g. L0 - Single line, no reference" },
        providedMaterialsSummary: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of items or documents provided by prospect"
        },
        rationale: { type: Type.STRING, description: "Detailed rationale for Readiness level score" }
      },
      required: ["readinessLevel", "score", "readinessDescription", "providedMaterialsSummary", "rationale"]
    },

    rawCompositeScore: { type: Type.INTEGER, description: "Sum of axis1 + axis2 + axis3 scores (3-12)" },
    finalCompositeScore: { type: Type.INTEGER, description: "Final composite score after red flags" },
    assignedTier: { type: Type.STRING, description: "PLATINUM, GOLD, SILVER, or BRONZE" },
    tierDescription: { type: Type.STRING, description: "Short description of the assigned tier" },

    hasRedFlags: { type: Type.BOOLEAN, description: "True if red flags detected" },
    redFlags: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          flag: { type: Type.STRING },
          description: { type: Type.STRING },
          severity: { type: Type.STRING, description: "CRITICAL or WARNING" },
          actionRequired: { type: Type.STRING }
        },
        required: ["flag", "description", "severity", "actionRequired"]
      }
    },
    isTierOverriddenByRedFlag: { type: Type.BOOLEAN },
    originalCalculatedTier: { type: Type.STRING },

    requiresThinInfoProtocol: { type: Type.BOOLEAN },
    thinInfoQuestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          question: { type: Type.STRING },
          context: { type: Type.STRING },
          isAnsweredInEmail: { type: Type.BOOLEAN },
          detectedAnswer: { type: Type.STRING }
        },
        required: ["id", "question", "context", "isAnsweredInEmail"]
      }
    },

    playbook: {
      type: Type.OBJECT,
      properties: {
        owner: { type: Type.STRING },
        sla: { type: Type.STRING },
        discoveryFormat: { type: Type.STRING },
        proposalModel: { type: Type.STRING }
      },
      required: ["owner", "sla", "discoveryFormat", "proposalModel"]
    },

    executiveSummary: { type: Type.STRING, description: "High-level summary of lead potential and strategic positioning" },
    keyHighlights: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    recommendedNextSteps: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },

    crmLog: {
      type: Type.OBJECT,
      properties: {
        entityType: { type: Type.STRING },
        geographyTier: { type: Type.STRING },
        readinessLevel: { type: Type.STRING },
        compositeScore: { type: Type.INTEGER },
        assignedTier: { type: Type.STRING },
        recommendedBAOwner: { type: Type.STRING },
        salesNotificationText: { type: Type.STRING }
      },
      required: ["entityType", "geographyTier", "readinessLevel", "compositeScore", "assignedTier", "recommendedBAOwner", "salesNotificationText"]
    }
  },
  required: [
    "leadTitle",
    "prospectName",
    "prospectCompany",
    "axis1",
    "axis2",
    "axis3",
    "rawCompositeScore",
    "finalCompositeScore",
    "assignedTier",
    "tierDescription",
    "hasRedFlags",
    "redFlags",
    "requiresThinInfoProtocol",
    "thinInfoQuestions",
    "playbook",
    "executiveSummary",
    "keyHighlights",
    "recommendedNextSteps",
    "crmLog"
  ]
};

// Helper for deterministic rule-engine fallback when Gemini API hits 429 quota
function generateFallbackSOPReport(body: any): any {
  const { emailSubject, senderEmail, senderName, rawText, attachments } = body;
  const textLower = (rawText || '').toLowerCase();
  const subjectLower = (emailSubject || '').toLowerCase();
  const fullText = `${subjectLower} ${textLower}`;

  // 1. Prospect & Company Extraction
  let prospectName = senderName || 'Inbound Prospect';
  let prospectCompany = 'Independent Client';
  if (senderEmail && senderEmail.includes('@')) {
    const domain = senderEmail.split('@')[1];
    if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'].includes(domain.toLowerCase())) {
      const compName = domain.split('.')[0];
      prospectCompany = compName.charAt(0).toUpperCase() + compName.slice(1);
    }
  }

  // 2. Axis 1 Evaluation (Entity Type)
  let axis1Score = 1;
  let entityType = 'IDEA_STARTUP';
  let entityTypeName = 'Idea-Stage Startup (Bootstrapped)';
  let isIntermediary = false;
  let endClientName = '';
  let axis1Rationale = 'Early-stage or unverified entity type based on initial inquiry content.';

  if (fullText.includes('agency') || fullText.includes('reseller') || fullText.includes('partner') || fullText.includes('freelance') || fullText.includes('outsource')) {
    axis1Score = 2;
    entityType = 'AGENCY_RESELLER';
    entityTypeName = 'Digital Agency / Intermediary Reseller';
    isIntermediary = true;
    endClientName = 'End Client (Pending Handoff)';
    axis1Rationale = 'Inquiry originates from an intermediary or agency representing an end client.';
  } else if (fullText.includes('enterprise') || fullText.includes('corporate') || fullText.includes('inc.') || fullText.includes('ltd') || fullText.includes('group') || fullText.includes('multinational')) {
    axis1Score = 4;
    entityType = 'ENTERPRISE';
    entityTypeName = 'Enterprise / Corporate Organization';
    axis1Rationale = 'Established corporate or enterprise buyer with corporate structure.';
  } else if (fullText.includes('funded') || fullText.includes('series a') || fullText.includes('seed') || fullText.includes('venture') || fullText.includes('sme')) {
    axis1Score = 3;
    entityType = 'FUNDED_STARTUP_SME';
    entityTypeName = 'Funded Startup / Growth SME';
    axis1Rationale = 'Growth-stage venture or established SME with active capital allocation.';
  }

  // 3. Axis 2 Evaluation (Geography & Paying Capacity)
  let axis2Score = 4;
  let payingTier = 'TIER_A';
  let contactCountry = 'United States / Tier A Market';
  let payingEntityCountry = 'United States';
  let payingEntityRegion = 'North America / Tier A';
  let mismatchNote = '';
  let axis2Rationale = 'High paying-capacity market identified (Tier A region).';

  if (senderEmail && (senderEmail.endsWith('.in') || fullText.includes('india'))) {
    if (fullText.includes('funded') || fullText.includes('us client') || fullText.includes('american')) {
      axis2Score = 4;
      payingTier = 'TIER_A';
      contactCountry = 'India';
      payingEntityCountry = 'United States (Overseas Client)';
      payingEntityRegion = 'North America';
      mismatchNote = 'Point of contact in India, but paying entity/client is based in Tier A US market.';
      axis2Rationale = 'SOP Rule: Geography score anchored to US paying entity (Tier A).';
    } else {
      axis2Score = 2;
      payingTier = 'TIER_C';
      contactCountry = 'India';
      payingEntityCountry = 'India';
      payingEntityRegion = 'South Asia (Tier C)';
      axis2Rationale = 'Domestic Indian market lead; evaluated under Tier C capacity guidelines.';
    }
  } else if (fullText.includes('uk') || fullText.includes('london') || fullText.includes('germany') || fullText.includes('dubai') || fullText.includes('uae') || fullText.includes('saudi') || fullText.includes('qatar') || fullText.includes('australia')) {
    axis2Score = 4;
    payingTier = 'TIER_A';
    contactCountry = 'UK / Western Europe / Gulf';
    payingEntityCountry = 'UK / Gulf Tier A Market';
    payingEntityRegion = 'Western Europe / Gulf';
    axis2Rationale = 'Tier A high-income geography with proven budget capacity.';
  }

  // 4. Axis 3 Evaluation (Readiness / Specs)
  let axis3Score = 1;
  let readinessLevel = 'L0';
  let readinessDescription = 'L0 - Single Line Inquiry / High-level concept without formal specs';
  let providedMaterials = ['Initial text inquiry brief'];
  let axis3Rationale = 'Inquiry contains preliminary high-level concept without attached specification documents.';

  const hasAttachments = attachments && Array.isArray(attachments) && attachments.length > 0;
  if (hasAttachments || fullText.includes('prd') || fullText.includes('figma') || fullText.includes('wireframe') || fullText.includes('specification') || fullText.includes('architecture')) {
    axis3Score = 4;
    readinessLevel = 'L3';
    readinessDescription = 'L3 - Documented PRD / Wireframes / Technical Architecture Specs';
    providedMaterials = hasAttachments ? attachments.map((a: any) => a.fileName) : ['Technical Spec / Wireframe Brief'];
    axis3Rationale = 'Comprehensive technical documentation or file attachments provided for analysis.';
  } else if (fullText.length > 500 || fullText.includes('feature list') || fullText.includes('requirements') || fullText.includes('bullet points') || fullText.includes('scope')) {
    axis3Score = 3;
    readinessLevel = 'L2';
    readinessDescription = 'L2 - Written Requirement List / Feature Summary';
    providedMaterials = ['Written feature scope list in email body'];
    axis3Rationale = 'Detailed written requirements list provided in the inquiry.';
  } else if (fullText.includes('like') || fullText.includes('similar to') || fullText.includes('reference app')) {
    axis3Score = 2;
    readinessLevel = 'L1';
    readinessDescription = 'L1 - Reference Website / App Concept Benchmark';
    providedMaterials = ['Benchmark reference link / application mention'];
    axis3Rationale = 'Reference benchmark cited without exhaustive functional breakdown.';
  }

  // 5. Composite Score & Tier
  const rawCompositeScore = axis1Score + axis2Score + axis3Score;
  let finalCompositeScore = rawCompositeScore;
  let assignedTier: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' = 'SILVER';
  let tierDescription = 'Standard Commercial Lead — Balanced opportunity requiring structured discovery.';

  if (finalCompositeScore >= 10) {
    assignedTier = 'PLATINUM';
    tierDescription = 'Strategic Priority Account — High financial capacity & structured project scope.';
  } else if (finalCompositeScore >= 7) {
    assignedTier = 'GOLD';
    tierDescription = 'High Potential Growth Opportunity — Solid capacity requiring focused BA discovery.';
  } else if (finalCompositeScore >= 4) {
    assignedTier = 'SILVER';
    tierDescription = 'Standard Lead — Real opportunity; budget or spec readiness requires development.';
  } else {
    assignedTier = 'BRONZE';
    tierDescription = 'Early Nurture Lead — Low immediate readiness or constrained budget.';
  }

  // 6. Red Flags Check
  let hasRedFlags = false;
  const redFlags: any[] = [];
  if (fullText.includes('$100') || fullText.includes('$200') || fullText.includes('$300') || fullText.includes('free demo') || fullText.includes('cheap')) {
    hasRedFlags = true;
    redFlags.push({
      flag: 'Unrealistic Budget Expectation',
      description: 'Stated budget expectation is significantly below standard HiddenBrains engineering benchmarks.',
      severity: 'WARNING',
      actionRequired: 'Clarify minimum project engagement threshold ($10,000+) during initial email response.',
    });
  }

  // 7. Thin-Info Protocol (Required for L0/L1)
  const requiresThinInfoProtocol = readinessLevel === 'L0' || readinessLevel === 'L1';
  const thinInfoQuestions = [
    { id: 1, question: "What is your anticipated total investment budget or target price range for this project?", context: "Budget Alignment", isAnsweredInEmail: fullText.includes('budget'), detectedAnswer: fullText.includes('budget') ? 'Mentioned in brief' : '' },
    { id: 2, question: "What is your target launch date or key milestone deadline?", context: "Timeline & Milestones", isAnsweredInEmail: fullText.includes('timeline') || fullText.includes('deadline'), detectedAnswer: '' },
    { id: 3, question: "Who will be evaluating proposals and making the final vendor decision?", context: "Decision Maker", isAnsweredInEmail: false, detectedAnswer: '' },
    { id: 4, question: "Do you have an existing internal engineering team, or is this a completely outsourced build?", context: "Team Setup", isAnsweredInEmail: false, detectedAnswer: '' },
    { id: 5, question: "Which existing applications or platforms serve as your primary benchmark for UX/UI?", context: "Reference Benchmarks", isAnsweredInEmail: fullText.includes('like') || fullText.includes('similar'), detectedAnswer: '' },
    { id: 6, question: "Who are your primary target users, and what is the intended monetization model?", context: "Business Model", isAnsweredInEmail: false, detectedAnswer: '' },
    { id: 7, question: "What are the 3-5 non-negotiable core MVP features required for Phase 1?", context: "MVP Scope Boundaries", isAnsweredInEmail: fullText.length > 300, detectedAnswer: '' },
  ];

  // 8. Playbook Assignment
  let playbook = {
    owner: 'Senior BA Lead & Practice Head',
    sla: '< 24 Hours',
    discoveryFormat: 'Dedicated 2-Session Interactive Discovery Workshop & Solution Architecture',
    proposalModel: 'Phased SOW with Dedicated Engineering Team / Milestone Deliverables',
  };

  if (assignedTier === 'GOLD') {
    playbook = {
      owner: 'Senior Business Analyst',
      sla: '< 48 Hours',
      discoveryFormat: 'Structured 60-90 Minute Technical Scope Discovery Call',
      proposalModel: 'Detailed Time & Materials / Phased Fixed-Price Estimate',
    };
  } else if (assignedTier === 'SILVER') {
    playbook = {
      owner: 'Mid-Level Business Analyst',
      sla: '< 3 Business Days',
      discoveryFormat: '30-45 Minute Requirement Validation Call + Questionnaire',
      proposalModel: 'Standard Fixed-Price Milestone Scope Estimate',
    };
  } else if (assignedTier === 'BRONZE') {
    playbook = {
      owner: 'Junior BA / Automated Nurture Lead',
      sla: '< 5 Business Days',
      discoveryFormat: 'Email Questionnaire & Preliminary Scope Qualification',
      proposalModel: 'Ballpark Budget Range & Standard Modular Package',
    };
  }

  const titleExtracted = emailSubject && emailSubject.trim() ? emailSubject : `Inbound Inquiry from ${prospectName}`;

  return {
    leadTitle: titleExtracted,
    prospectName,
    prospectCompany,
    axis1: {
      entityType,
      score: axis1Score,
      entityTypeName,
      endClientName,
      isIntermediary,
      rationale: axis1Rationale,
    },
    axis2: {
      payingTier,
      score: axis2Score,
      contactCountry,
      payingEntityCountry,
      payingEntityRegion,
      mismatchNote,
      rationale: axis2Rationale,
    },
    axis3: {
      readinessLevel,
      score: axis3Score,
      readinessDescription,
      providedMaterialsSummary: providedMaterials,
      rationale: axis3Rationale,
    },
    rawCompositeScore,
    finalCompositeScore,
    assignedTier,
    tierDescription,
    hasRedFlags,
    redFlags,
    isTierOverriddenByRedFlag: false,
    originalCalculatedTier: assignedTier,
    requiresThinInfoProtocol,
    thinInfoQuestions,
    playbook,
    executiveSummary: `Lead evaluated under HiddenBrains Lead Qualification SOP v1.0. Assigned to ${assignedTier} Tier with composite rating score of ${finalCompositeScore}/12 (${axis1Score}pt Entity + ${axis2Score}pt Geo + ${axis3Score}pt Readiness). ${playbook.owner} assigned for discovery.`,
    keyHighlights: [
      `Entity Classification: ${entityTypeName} (${axis1Score}/4 pts)`,
      `Geography & Paying Capacity: ${payingTier} - ${payingEntityCountry} (${axis2Score}/4 pts)`,
      `Scope Readiness: ${readinessDescription} (${axis3Score}/4 pts)`,
    ],
    recommendedNextSteps: [
      `Assign to ${playbook.owner} with target response SLA of ${playbook.sla}.`,
      requiresThinInfoProtocol ? "Send Thin-Information 7-question qualification template to prospect." : "Schedule initial discovery session according to playbook format.",
      "Log qualification scorecard in CRM and notify sales lead.",
    ],
    crmLog: {
      entityType: entityTypeName,
      geographyTier: `${payingTier} (${payingEntityCountry})`,
      readinessLevel: readinessDescription,
      compositeScore: finalCompositeScore,
      assignedTier,
      recommendedBAOwner: playbook.owner,
      salesNotificationText: `[HB INBOUND QUALIFICATION] Lead ${prospectName} (${prospectCompany}) qualified as ${assignedTier} TIER (Score ${finalCompositeScore}/12). Assigned BA: ${playbook.owner}. SLA: ${playbook.sla}.`,
    },
  };
}

// API Route for Lead Qualification
app.post("/api/qualify", async (req, res) => {
  try {
    const { emailSubject, senderEmail, senderName, rawText, attachments, baOverrideNotes } = req.body;

    if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
      return res.status(400).json({ error: "Please provide the raw email or lead content text." });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Try Gemini API models in order if API Key exists
    if (apiKey) {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const promptText = `
Analyze the following Inbound Lead for HiddenBrains according to our Lead Qualification SOP:

--- LEAD METADATA ---
Subject: ${emailSubject || "Not provided"}
Sender Email: ${senderEmail || "Not provided"}
Sender Name: ${senderName || "Not provided"}
BA Override/Context Notes: ${baOverrideNotes || "None"}

--- RAW EMAIL / INQUIRY BODY / NOTES ---
${rawText}

--- ATTACHMENT / SPEC SUMMARY ---
${
  attachments && Array.isArray(attachments) && attachments.length > 0
    ? attachments
        .map(
          (att: any, idx: number) =>
            `Attachment #${idx + 1}: ${att.fileName} (${att.fileType || "unknown"})\nContent Preview / Excerpt:\n${
              att.content ? att.content.slice(0, 3000) : "Binary or unparseable"
            }`
        )
        .join("\n\n")
    : "No attachments provided."
}

Please perform the 3-Axis analysis, composite scoring, Red Flag checks, Thin-Information Protocol, and CRM Handoff text according to the SOP guidelines.
`;

      const parts: any[] = [{ text: promptText }];

      if (attachments && Array.isArray(attachments)) {
        for (const att of attachments) {
          if (att.content && att.content.startsWith("data:") && att.fileType) {
            const base64Data = att.content.split(",")[1];
            if (base64Data) {
              parts.push({
                inlineData: {
                  mimeType: att.fileType,
                  data: base64Data,
                },
              });
            }
          }
        }
      }

      // Models to try in sequence if 429/rate-limited
      const modelsToTry = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts },
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              responseMimeType: "application/json",
              responseSchema: RESPONSE_SCHEMA,
              temperature: 0.2,
            },
          });

          if (response.text) {
            let rawJsonText = response.text.trim();
            if (rawJsonText.startsWith("```")) {
              rawJsonText = rawJsonText.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();
            }

            const resultJson = JSON.parse(rawJsonText);
            return res.json({
              success: true,
              report: {
                leadId: `HB-LEAD-${Date.now().toString(36).toUpperCase()}`,
                createdAt: new Date().toISOString(),
                ...resultJson,
              },
            });
          }
        } catch (modelErr: any) {
          console.warn(`Attempt with ${modelName} failed or rate limited:`, modelErr?.message || modelErr);
          // Continue to next model in loop
        }
      }
    }

    // Fallback: If Gemini models are quota-limited (429) or API key unavailable, use local SOP Rule-Engine
    console.log("Using local SOP Rule-Engine fallback for lead qualification.");
    const fallbackReport = generateFallbackSOPReport(req.body);

    return res.json({
      success: true,
      report: {
        leadId: `HB-LEAD-${Date.now().toString(36).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        ...fallbackReport,
      },
    });

  } catch (err: any) {
    console.error("Error qualifying lead:", err);
    return res.status(500).json({
      error: "Failed to generate lead qualification report.",
      details: err?.message || String(err),
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // If a dist folder exists from a previous build, remove it in dev mode so Vite serves live source code
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      try {
        fs.rmSync(distPath, { recursive: true, force: true });
        console.log("Cleaned stale dist directory for dev mode.");
      } catch (e) {
        console.warn("Could not remove dist directory:", e);
      }
    }

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      // Return 404 for missing static assets or API routes instead of HTML
      if (req.path.startsWith("/api") || req.path.match(/\.(js|css|json|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$/i)) {
        return res.status(404).send("Asset not found");
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HiddenBrains Lead Qualification Server running on http://localhost:${PORT}`);
  });
}

startServer();
