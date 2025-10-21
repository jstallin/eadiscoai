import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('API route called')
    const body = await request.json()
    console.log('Body received:', body)
    const { discoveryData } = body

    const prompt = `You are a Salesforce Enterprise Architect creating artifacts for ${discoveryData.companyName} in the ${discoveryData.industry} industry.

Business Context: ${discoveryData.businessContext}
Current Challenges: ${discoveryData.currentChallenges}
Strategic Goals: ${discoveryData.strategicGoals}
Technical Landscape: ${discoveryData.technicalLandscape}

Generate ONLY valid JSON (no markdown, no explanation) with this EXACT structure:
{
  "capabilityMap": {
    "businessDrivers": ["driver1", "driver2", "driver3"],
    "sales": [{"capability": "Lead Management", "description": "desc", "salesforceProducts": ["Sales Cloud"]}],
    "service": [{"capability": "Case Management", "description": "desc", "salesforceProducts": ["Service Cloud"]}],
    "marketing": [{"capability": "Campaign Management", "description": "desc", "salesforceProducts": ["Marketing Cloud"]}],
    "commerce": [{"capability": "Order Management", "description": "desc", "salesforceProducts": ["Commerce Cloud"]}],
    "platformData": [{"capability": "Data Integration", "description": "desc", "salesforceProducts": ["Data Cloud", "MuleSoft"]}],
    "industrySpecific": [{"capability": "Industry Solution", "description": "desc", "salesforceProducts": ["Financial Services Cloud"]}]
  },
  "currentStateArchitecture": {
    "overview": "Current state summary",
    "systemsOfRecord": [{"name": "CRM System", "businessCapability": "Customer Management", "salesforceOpportunity": "Replace with Sales Cloud", "recommendedSalesforceProducts": ["Sales Cloud"]}],
    "systemsOfDifferentiation": [{"name": "Portal", "businessCapability": "Customer Portal", "salesforceOpportunity": "Enhance with Experience Cloud", "recommendedSalesforceProducts": ["Experience Cloud"]}],
    "systemsOfInnovation": [{"name": "AI Bot", "emergingCapability": "Chatbot", "salesforceOpportunity": "Implement Agentforce", "recommendedSalesforceProducts": ["Agentforce"]}]
  },
  "futureStateArchitecture": {
    "overview": "Future vision with Salesforce",
    "platformComponents": {
      "dataUnification": "Data Cloud strategy",
      "integration": "MuleSoft approach",
      "analytics": "Tableau strategy",
      "aiAutomation": "Einstein AI opportunities"
    },
    "systemsOfRecord": [{"name": "Sales Cloud", "futureVision": "Unified CRM", "salesforceProducts": ["Sales Cloud"], "timeline": "Q1 2026", "benefits": ["Benefit 1", "Benefit 2"]}],
    "systemsOfDifferentiation": [],
    "systemsOfInnovation": []
  },
  "prioritizationMatrix": [
    {"initiative": "Sales Cloud Implementation", "businessValue": "High", "effort": "Medium", "roi": "High", "priority": 1, "description": "Deploy Sales Cloud"}
  ],
  "strategicRoadmap": [
    {"phase": "Phase 1: Foundation", "initiatives": ["Deploy Sales Cloud", "Integrate Data"], "outcomes": ["Unified CRM", "Clean data"]}
  ]
}

Return ONLY the JSON object, nothing else.`
    console.log('About to call Anthropic API')
    console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

        console.log('API Response status:', response.status)

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
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