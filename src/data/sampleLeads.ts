export interface SampleLeadPreset {
  id: string;
  name: string;
  badge: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  rawText: string;
  baOverrideNotes?: string;
}

export const SAMPLE_LEADS: SampleLeadPreset[] = [
  {
    id: "sample-1",
    name: "US Healthcare Enterprise Portal (L3 Spec)",
    badge: "Platinum Candidate",
    subject: "RFP: Custom Telehealth & Patient Portal Integration - Apex Health Group",
    senderName: "David Sterling",
    senderEmail: "d.sterling@apexhealthgroup.com",
    rawText: `Dear HiddenBrains Team,

My name is David Sterling, Director of Digital Innovation at Apex Health Group (based in Chicago, IL, USA). 

We are looking for an experienced digital engineering partner to co-develop our next-generation HIPAA-compliant Patient Telehealth Portal & Mobile App (iOS & Android).

Attached is our initial PRD document (24 pages) including:
- HL7 / FHIR EHR API integration requirements
- Real-time video consultation engine specifications
- SSO authentication architecture & compliance specs
- Figma wireframe links for patient and doctor dashboards

Our projected timeline is Q3 kickoff with a phased rollout by Q1 next year. We have an allocated budget range of $180,000 – $250,000 for Phase 1. 

Please let us know your team's availability for a discovery workshop next week.

Best regards,
David Sterling
Director of Digital Innovation
Apex Health Group, USA`,
    baOverrideNotes: "Verified company domain and LinkedIn presence. Direct US enterprise buyer with allocated budget and PRD."
  },
  {
    id: "sample-2",
    name: "Indian Contact representing US Buyer (Geo Mismatch)",
    badge: "Geo Mismatch Test",
    subject: "Inquiry for Logistics SaaS Platform - White-label Project",
    senderName: "Rajesh Sharma",
    senderEmail: "rajesh@techconsult-in.com",
    rawText: `Hi Team,

I am Rajesh based in Pune, India. I operate a technical consulting agency representing our primary client, FreightFlow LLC, which is a funded Series-A logistics company headquartered in Austin, Texas, USA.

FreightFlow is replacing their legacy dispatch portal with a modern web dashboard and mobile driver app. They have allocated $90,000 for this project and have provided a detailed 6-page feature list and workflow diagram.

The paying entity is FreightFlow LLC (USA), and payments will be wired directly from their US bank account in USD. We (TechConsult India) will act as local project coordinators.

Please review and advise on your approach and availability for a call with FreightFlow's US VP of Product.

Regards,
Rajesh Sharma`,
    baOverrideNotes: "Important: Contact is based in India, but paying entity is FreightFlow LLC (Austin, TX, USA). SOP Axis 2 MUST score as Tier A (US Paying Entity)."
  },
  {
    id: "sample-3",
    name: "UK Digital Agency Reseller for European Client",
    badge: "Agency Intermediary",
    subject: "Outsourcing Partner Request - E-commerce Mobile App for UK/EU Brand",
    senderName: "Gemma Watson",
    senderEmail: "gemma@vividcreative.co.uk",
    rawText: `Hello HiddenBrains team,

We are Vivid Creative, a full-service design agency in Manchester, UK. We are pitching for a custom mobile app build for an established UK luxury apparel retailer (end client: Regal Threads Ltd).

Regal Threads wants an iOS & Android app with AR virtual try-on and Shopify Plus backend integration. They have an estimated budget of £45k - £60k (~$75,000 USD) and want to launch in 5 months.

We have drafted the user flows and feature brief. We need an experienced offshore development team to handle full-stack execution while we handle UI design.

Looking forward to your proposal.

Gemma Watson
Head of Delivery | Vivid Creative UK`,
    baOverrideNotes: "Intermediary agency in UK reselling to an established UK SME retailer. Axis 1 should evaluate end client (established SME - 3 pts) and Axis 2 Tier A (UK)."
  },
  {
    id: "sample-4",
    name: "Thin One-Liner Inquiry (L0 - Protocol Test)",
    badge: "L0 Thin Info",
    subject: "Need app like Uber for food delivery",
    senderName: "Kofi Mensah",
    senderEmail: "kofi.m@gmail.com",
    rawText: `Hi, 

I want to build an app like Uber Eats or DoorDash for my local city. 

How much will it cost and how fast can you build it? Send me price list.

Thanks,
Kofi`,
    baOverrideNotes: "Thin lead (L0). Should trigger Section 7 Thin-Information Questionnaire before deep scoring."
  },
  {
    id: "sample-5",
    name: "Red Flag Lead (Incompatible Scope vs Budget)",
    badge: "Red Flag Trigger",
    subject: "Urgent: Build AI SaaS Platform + Mobile Apps + Custom Blockchain",
    senderName: "Anonymous User",
    senderEmail: "crypto_builder99@tempmail.com",
    rawText: `I need a complete AI video generation platform with custom LLM training, iOS/Android apps, payment gateway, and custom Solana blockchain smart contract integration.

My budget is $400 maximum. I need full source code delivered in 3 days. Do not call me, just send complete system architecture and source code preview. If you do it well I will give you 50% equity in my startup.`,
    baOverrideNotes: "Clear Red Flags: Budget ($400) incompatible with AI+Blockchain scope, temp email, demanding free architecture/code."
  }
];
