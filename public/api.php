<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$inputJSON = file_get_contents('php://input');
$body = json_decode($inputJSON, true) ?? [];

$rawText = $body['rawText'] ?? '';
$emailSubject = $body['emailSubject'] ?? '';
$senderEmail = $body['senderEmail'] ?? '';
$senderName = $body['senderName'] ?? '';
$attachments = $body['attachments'] ?? [];

if (empty(trim($rawText))) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Inbound lead text content is required."]);
    exit;
}

$textLower = strtolower($rawText . ' ' . $emailSubject);

// 1. Prospect & Company
$prospectName = !empty($senderName) ? $senderName : 'Inbound Prospect';
$prospectCompany = 'Independent Client';
if (!empty($senderEmail) && strpos($senderEmail, '@') !== false) {
    $domain = explode('@', $senderEmail)[1] ?? '';
    if (!in_array(strtolower($domain), ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'])) {
        $compName = explode('.', $domain)[0] ?? '';
        $prospectCompany = ucfirst($compName);
    }
}

// 2. Axis 1 - Entity Type
$axis1Score = 1;
$entityType = 'IDEA_STARTUP';
$entityTypeName = 'Idea-Stage Startup (Bootstrapped)';
$isIntermediary = false;
$endClientName = '';
$axis1Rationale = 'Early-stage or unverified entity type based on initial inquiry content.';

if (preg_match('/(agency|reseller|partner|freelance|outsource)/i', $textLower)) {
    $axis1Score = 2;
    $entityType = 'AGENCY_RESELLER';
    $entityTypeName = 'Digital Agency / Intermediary Reseller';
    $isIntermediary = true;
    $endClientName = 'End Client (Pending Handoff)';
    $axis1Rationale = 'Inquiry originates from an agency/intermediary representing an end client.';
} elseif (preg_match('/(enterprise|corporate|inc\.|ltd|group|multinational)/i', $textLower)) {
    $axis1Score = 4;
    $entityType = 'ENTERPRISE';
    $entityTypeName = 'Enterprise / Corporate Organization';
    $axis1Rationale = 'Established corporate or enterprise buyer with corporate structure.';
} elseif (preg_match('/(funded|series a|seed|venture|sme)/i', $textLower)) {
    $axis1Score = 3;
    $entityType = 'FUNDED_STARTUP_SME';
    $entityTypeName = 'Funded Startup / Growth SME';
    $axis1Rationale = 'Growth-stage venture or established SME with active capital allocation.';
}

// 3. Axis 2 - Geography
$axis2Score = 4;
$payingTier = 'TIER_A';
$contactCountry = 'United States / Tier A Market';
$payingEntityCountry = 'United States';
$payingEntityRegion = 'North America / Tier A';
$mismatchNote = '';
$axis2Rationale = 'High paying-capacity market identified (Tier A region).';

if (!empty($senderEmail) && (strpos($senderEmail, '.in') !== false || strpos($textLower, 'india') !== false)) {
    if (preg_match('/(funded|us client|american)/i', $textLower)) {
        $axis2Score = 4;
        $payingTier = 'TIER_A';
        $contactCountry = 'India';
        $payingEntityCountry = 'United States (Overseas Client)';
        $payingEntityRegion = 'North America';
        $mismatchNote = 'Point of contact in India, but paying entity is based in Tier A US market.';
        $axis2Rationale = 'SOP Rule: Geography score anchored to US paying entity (Tier A).';
    } else {
        $axis2Score = 2;
        $payingTier = 'TIER_C';
        $contactCountry = 'India';
        $payingEntityCountry = 'India';
        $payingEntityRegion = 'South Asia (Tier C)';
        $axis2Rationale = 'Domestic Indian market lead; evaluated under Tier C capacity guidelines.';
    }
} elseif (preg_match('/(uk|london|germany|dubai|uae|saudi|qatar|australia)/i', $textLower)) {
    $axis2Score = 4;
    $payingTier = 'TIER_A';
    $contactCountry = 'UK / Western Europe / Gulf';
    $payingEntityCountry = 'UK / Gulf Tier A Market';
    $payingEntityRegion = 'Western Europe / Gulf';
    $axis2Rationale = 'Tier A high-income geography with proven budget capacity.';
}

// 4. Axis 3 - Readiness
$axis3Score = 1;
$readinessLevel = 'L0';
$readinessDescription = 'L0 - Single Line Inquiry / High-level concept without formal specs';
$providedMaterials = ['Initial text inquiry brief'];
$axis3Rationale = 'Inquiry contains preliminary high-level concept without attached specification documents.';

if (!empty($attachments) || preg_match('/(prd|figma|wireframe|specification|architecture)/i', $textLower)) {
    $axis3Score = 4;
    $readinessLevel = 'L3';
    $readinessDescription = 'L3 - Documented PRD / Wireframes / Technical Architecture Specs';
    $providedMaterials = ['Technical Spec / Wireframe Brief'];
    $axis3Rationale = 'Comprehensive technical documentation or file attachments provided.';
} elseif (strlen($textLower) > 500 || preg_match('/(feature list|requirements|bullet points|scope)/i', $textLower)) {
    $axis3Score = 3;
    $readinessLevel = 'L2';
    $readinessDescription = 'L2 - Written Requirement List / Feature Summary';
    $providedMaterials = ['Written feature scope list in email body'];
    $axis3Rationale = 'Detailed written requirements list provided in the inquiry.';
} elseif (preg_match('/(like|similar to|reference app)/i', $textLower)) {
    $axis3Score = 2;
    $readinessLevel = 'L1';
    $readinessDescription = 'L1 - Reference Website / App Concept Benchmark';
    $providedMaterials = ['Benchmark reference link / application mention'];
    $axis3Rationale = 'Reference benchmark cited without exhaustive functional breakdown.';
}

// 5. Composite Rating & Tier
$finalCompositeScore = $axis1Score + $axis2Score + $axis3Score;
$assignedTier = 'SILVER';
$tierDescription = 'Standard Commercial Lead — Balanced opportunity requiring structured discovery.';

if ($finalCompositeScore >= 10) {
    $assignedTier = 'PLATINUM';
    $tierDescription = 'Strategic Priority Account — High financial capacity & structured project scope.';
} elseif ($finalCompositeScore >= 7) {
    $assignedTier = 'GOLD';
    $tierDescription = 'High Potential Growth Opportunity — Solid capacity requiring focused BA discovery.';
} elseif ($finalCompositeScore >= 4) {
    $assignedTier = 'SILVER';
    $tierDescription = 'Standard Lead — Real opportunity; budget or spec readiness requires development.';
} else {
    $assignedTier = 'BRONZE';
    $tierDescription = 'Early Nurture Lead — Low immediate readiness or constrained budget.';
}

// 6. Red Flags
$hasRedFlags = false;
$redFlags = [];
if (preg_match('/(\$100|\$200|\$300|free demo|cheap)/i', $textLower)) {
    $hasRedFlags = true;
    $redFlags[] = [
        "flag" => "Unrealistic Budget Expectation",
        "description" => "Stated budget expectation is significantly below standard engineering benchmarks.",
        "severity" => "WARNING",
        "actionRequired" => "Clarify minimum project engagement threshold ($10,000+) during initial email response."
    ];
}

// 7. Thin Info
$requiresThinInfoProtocol = ($readinessLevel === 'L0' || $readinessLevel === 'L1');
$thinInfoQuestions = [
    ["id" => 1, "question" => "What is your anticipated total investment budget or target price range?", "context" => "Budget Alignment", "isAnsweredInEmail" => strpos($textLower, 'budget') !== false, "detectedAnswer" => ""],
    ["id" => 2, "question" => "What is your target launch date or key milestone deadline?", "context" => "Timeline & Milestones", "isAnsweredInEmail" => false, "detectedAnswer" => ""],
    ["id" => 3, "question" => "Who will be evaluating proposals and making the final vendor decision?", "context" => "Decision Maker", "isAnsweredInEmail" => false, "detectedAnswer" => ""],
    ["id" => 4, "question" => "Do you have an existing internal engineering team, or is this an outsourced build?", "context" => "Team Setup", "isAnsweredInEmail" => false, "detectedAnswer" => ""],
    ["id" => 5, "question" => "Which existing applications serve as your primary benchmark for UX/UI?", "context" => "Reference Benchmarks", "isAnsweredInEmail" => false, "detectedAnswer" => ""],
    ["id" => 6, "question" => "Who are your primary target users, and what is the intended monetization model?", "context" => "Business Model", "isAnsweredInEmail" => false, "detectedAnswer" => ""],
    ["id" => 7, "question" => "What are the 3-5 non-negotiable core MVP features required for Phase 1?", "context" => "MVP Scope Boundaries", "isAnsweredInEmail" => false, "detectedAnswer" => ""]
];

// 8. Playbook
$playbook = [
    "owner" => "Senior BA Lead & Practice Head",
    "sla" => "< 24 Hours",
    "discoveryFormat" => "Dedicated Interactive Discovery Workshop & Solution Architecture",
    "proposalModel" => "Phased SOW with Dedicated Engineering Team"
];
if ($assignedTier === 'GOLD') {
    $playbook = [
        "owner" => "Senior Business Analyst",
        "sla" => "< 48 Hours",
        "discoveryFormat" => "Structured 60-90 Minute Technical Scope Discovery Call",
        "proposalModel" => "Detailed Time & Materials / Phased Fixed-Price Estimate"
    ];
} elseif ($assignedTier === 'SILVER') {
    $playbook = [
        "owner" => "Mid-Level Business Analyst",
        "sla" => "< 3 Business Days",
        "discoveryFormat" => "30-45 Minute Requirement Validation Call + Questionnaire",
        "proposalModel" => "Standard Fixed-Price Milestone Scope Estimate"
    ];
} elseif ($assignedTier === 'BRONZE') {
    $playbook = [
        "owner" => "Junior BA / Automated Nurture Lead",
        "sla" => "< 5 Business Days",
        "discoveryFormat" => "Email Questionnaire & Preliminary Scope Qualification",
        "proposalModel" => "Ballpark Budget Range & Standard Modular Package"
    ];
}

$titleExtracted = !empty(trim($emailSubject)) ? $emailSubject : "Inbound Inquiry from $prospectName";

$report = [
    "leadId" => "HB-LEAD-" . strtoupper(dechex(time())),
    "createdAt" => date('c'),
    "leadTitle" => $titleExtracted,
    "prospectName" => $prospectName,
    "prospectCompany" => $prospectCompany,
    "axis1" => [
        "entityType" => $entityType,
        "score" => $axis1Score,
        "entityTypeName" => $entityTypeName,
        "endClientName" => $endClientName,
        "isIntermediary" => $isIntermediary,
        "rationale" => $axis1Rationale
    ],
    "axis2" => [
        "payingTier" => $payingTier,
        "score" => $axis2Score,
        "contactCountry" => $contactCountry,
        "payingEntityCountry" => $payingEntityCountry,
        "payingEntityRegion" => $payingEntityRegion,
        "mismatchNote" => $mismatchNote,
        "rationale" => $axis2Rationale
    ],
    "axis3" => [
        "readinessLevel" => $readinessLevel,
        "score" => $axis3Score,
        "readinessDescription" => $readinessDescription,
        "providedMaterialsSummary" => $providedMaterials,
        "rationale" => $axis3Rationale
    ],
    "rawCompositeScore" => $finalCompositeScore,
    "finalCompositeScore" => $finalCompositeScore,
    "assignedTier" => $assignedTier,
    "tierDescription" => $tierDescription,
    "hasRedFlags" => $hasRedFlags,
    "redFlags" => $redFlags,
    "isTierOverriddenByRedFlag" => false,
    "originalCalculatedTier" => $assignedTier,
    "requiresThinInfoProtocol" => $requiresThinInfoProtocol,
    "thinInfoQuestions" => $thinInfoQuestions,
    "playbook" => $playbook,
    "executiveSummary" => "Lead evaluated under HiddenBrains Lead Qualification SOP v1.0. Assigned to $assignedTier Tier with composite rating score of $finalCompositeScore/12.",
    "keyHighlights" => [
        "Entity Classification: $entityTypeName ($axis1Score/4 pts)",
        "Geography & Paying Capacity: $payingTier - $payingEntityCountry ($axis2Score/4 pts)",
        "Scope Readiness: $readinessDescription ($axis3Score/4 pts)"
    ],
    "recommendedNextSteps" => [
        "Assign to {$playbook['owner']} with target response SLA of {$playbook['sla']}.",
        $requiresThinInfoProtocol ? "Send Thin-Information 7-question qualification template to prospect." : "Schedule initial discovery session.",
        "Log qualification scorecard in CRM and notify sales lead."
    ],
    "crmLog" => [
        "entityType" => $entityTypeName,
        "geographyTier" => "$payingTier ($payingEntityCountry)",
        "readinessLevel" => $readinessDescription,
        "compositeScore" => $finalCompositeScore,
        "assignedTier" => $assignedTier,
        "recommendedBAOwner" => $playbook['owner'],
        "salesNotificationText" => "[HB INBOUND QUALIFICATION] Lead $prospectName ($prospectCompany) qualified as $assignedTier TIER (Score $finalCompositeScore/12)."
    ]
];

echo json_encode(["success" => true, "report" => $report]);
