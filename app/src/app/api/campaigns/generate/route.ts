import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface GenerateRequest {
  goal: string
  emailCount: number
  targetAudience: string
  businessType: string
}

export async function POST(request: NextRequest) {
  try {
    const { goal, emailCount, targetAudience, businessType }: GenerateRequest = await request.json()

    if (!goal || !emailCount || !targetAudience) {
      return NextResponse.json(
        { error: 'Goal, email count, and target audience are required' },
        { status: 400 }
      )
    }

    const prompt = `Create ${emailCount} cold email sequences for a Voice AI outreach campaign targeting ${targetAudience}.

Business type: ${businessType || 'Voice AI services'}
Campaign goal: ${goal}

Requirements:
- ${emailCount} emails total (initial + follow-ups)
- Day offsets: Start with day 0, then space out follow-ups (2-3 days apart)
- Professional tone focused on Voice AI benefits
- Include variables: {{firstname}}, {{company}}, {{website}}, {{sender}}, {{unsub}}
- Each email should be concise and action-oriented
- Focus on converting after-hours calls to appointments
- Reference missed call opportunities and booking automation

Return ONLY valid JSON in this exact format:
{
  "name": "Campaign Name",
  "steps": [
    {
      "dayOffset": 0,
      "subject": "Email subject with variables",
      "bodyHtml": "HTML email body with <br/> tags and variables"
    }
  ]
}`

    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert cold email copywriter specializing in Voice AI outreach campaigns. Create high-converting email sequences that focus on converting missed calls to appointments."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    const campaignData = JSON.parse(response)

    return NextResponse.json(campaignData)

  } catch (error) {
    console.error('Error generating campaign:', error)
    
    if (error instanceof Error && error.message.includes('JSON')) {
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate campaign' },
      { status: 500 }
    )
  }
}