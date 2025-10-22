import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('API route called')
    const body = await request.json()
    console.log('Body received:', body)
    const { discoveryData } = body

   // Replace the prompt in your generate-artifacts route with this updated version
// This includes maturity level assessment for each capability

const systemPrompt = `You are an expert Salesforce Enterprise Architect analyzing discovery information.

Based on the discovery data provided, generate comprehensive Salesforce architecture artifacts.

DISCOVERY DATA:
Company: ${discoveryData.companyName}
Industry: ${discoveryData.industry}
Business Context: ${discoveryData.businessContext}
Current Challenges: ${discoveryData.currentChallenges}
Strategic Goals: ${discoveryData.strategicGoals}
Technical Landscape: ${discoveryData.technicalLandscape}
Constraints: ${discoveryData.constraints}
Timeline: ${discoveryData.timeline}
Budget: ${discoveryData.budget}

Generate a complete JSON response with these artifacts:

{
  "capabilityMap": {
    "businessDrivers": ["driver1", "driver2", "driver3"],
    "sales": [
      {
        "capability": "Lead Management",
        "description": "Brief description",
        "salesforceProducts": ["Sales Cloud", "Pardot"],
        "maturityLevel": "Defined",
        "businessImpact": "High"
      }
    ],
    "service": [...],
    "marketing": [...],
    "commerce": [...],
    "platformData": [...],
    "industrySpecific": [...]
  },
  "currentStateArchitecture": {
    "overview": "Brief summary of current state",
    "systemsOfInnovation": [
      {
        "name": "System name",
        "emergingCapability": "What it does",
        "maturityLevel": "Initial"
      }
    ],
    "systemsOfDifferentiation": [
      {
        "name": "System name",
        "businessCapability": "What it enables",
        "salesforceOpportunity": "How Salesforce could help",
        "recommendedSalesforceProducts": ["Product1", "Product2"],
        "maturityLevel": "Repeatable"
      }
    ],
    "systemsOfRecord": [
      {
        "name": "System name",
        "businessCapability": "Core function",
        "salesforceOpportunity": "How Salesforce could help",
        "recommendedSalesforceProducts": ["Product1"],
        "maturityLevel": "Managed"
      }
    ]
  },
  "futureStateArchitecture": {
    "overview": "Brief vision of future state",
    "systemsOfInnovation": [...],
    "systemsOfDifferentiation": [...],
    "systemsOfRecord": [...],
    "platformComponents": {
      "dataUnification": "Data Cloud strategy",
      "integration": "MuleSoft approach",
      "analytics": "Tableau/Einstein Analytics",
      "aiAutomation": "Einstein AI/Agentforce"
    }
  },
  "prioritizationMatrix": [
    {
      "priority": "1",
      "initiative": "Initiative name",
      "businessValue": "High",
      "effort": "Low",
      "rationale": "Why this priority"
    }
  ],
  "strategicRoadmap": [
    {
      "phase": "Phase 1: Foundation (Q1-Q2 2025)",
      "initiatives": ["Initiative 1", "Initiative 2"],
      "outcomes": ["Outcome 1", "Outcome 2"]
    }
  ]
}

MATURITY LEVEL ASSESSMENT GUIDE:
Assess each capability's current maturity based on the discovery data using this scale:

- "Initial" - Ad-hoc, inconsistent processes; heavy manual work; no standardization; often mentioned as a pain point or challenge
- "Repeatable" - Some processes documented; inconsistent execution; spreadsheet/email-based; mentioned as needing improvement
- "Defined" - Standardized processes; basic tools in place; some automation; functioning but not optimized
- "Managed" - Well-established processes; integrated tools; good data quality; metrics tracked; mentioned as working well
- "Optimizing" - Continuous improvement; AI/automation; excellent analytics; best-in-class; mentioned as a strength

BUSINESS IMPACT ASSESSMENT GUIDE:
Rate each capability's business impact based on discovery data:

- "High" - Directly tied to strategic goals; major revenue/cost impact; frequently mentioned as critical; competitive differentiator
- "Medium" - Important for operations; moderate business value; mentioned as needed improvement area
- "Low" - Supporting capability; minimal direct business impact; nice to have but not critical

Consider:
- Does this capability directly support their strategic goals?
- Is it mentioned in current challenges or pain points?
- Would improving it significantly impact revenue, cost, or customer satisfaction?
- Is it a competitive differentiator in their industry?

IMPORTANT RULES:
1. Base maturity assessments on clues in the discovery data (challenges = lower maturity, strengths = higher maturity)
2. If current challenges mention manual processes, fragmented systems, or lack of visibility → assign Initial or Repeatable
3. If technical landscape shows established tools but mentions improvement needs → assign Defined
4. If discovery indicates strong processes and good tooling → assign Managed
5. Only assign Optimizing if discovery explicitly mentions best-in-class capabilities or continuous optimization
6. For capabilities, include 3-4 items per category
7. For current state, focus on what exists today and opportunities for Salesforce
8. For future state, show the Salesforce-powered vision
9. Create exactly 3 phases in the roadmap
10. Prioritization matrix should have 6-8 initiatives with varied value/effort combinations
11. Return ONLY valid JSON, no markdown formatting or explanatory text`;

// Use this prompt in your API call
    // TEMPORARY DEBUG
  console.log('=== ENV DEBUG ===');
  console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
  console.log('API Key first 10 chars:', process.env.ANTHROPIC_API_KEY?.substring(0, 10));
  console.log('API Key length:', process.env.ANTHROPIC_API_KEY?.length);
  console.log('================');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        //'x-api-key':'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',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content: systemPrompt }],
      }),
    })

        console.log('API Response status:', response.status)

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Anthropic API Error:', errorBody);
        throw new Error(`API request failed: ${response.status} - ${errorBody}`);
    }

    const data = await response.json()
    const text = data.content[0].text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(text)

    return NextResponse.json({ artifacts: parsed })
} catch (error) {
  console.error('Generation error:', error);
  const errorMessage = error instanceof Error ? error.message : 'Failed to generate artifacts';
  return NextResponse.json(
    { error: errorMessage },
    { status: 500 }
  );
}
}