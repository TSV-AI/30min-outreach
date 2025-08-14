import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import slugify from 'slugify'

interface EmailStep {
  id: string
  dayOffset: number
  subject: string
  bodyHtml: string
}

interface CampaignData {
  name: string
  niche?: string
  city?: string
  state?: string
  steps: EmailStep[]
}

export async function POST(request: NextRequest) {
  try {
    const body: CampaignData = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Campaign name is required' },
        { status: 400 }
      )
    }

    if (!body.steps || body.steps.length === 0) {
      return NextResponse.json(
        { error: 'At least one email step is required' },
        { status: 400 }
      )
    }

    // Validate steps
    for (const step of body.steps) {
      if (!step.subject?.trim()) {
        return NextResponse.json(
          { error: 'All email steps must have a subject' },
          { status: 400 }
        )
      }
      if (!step.bodyHtml?.trim()) {
        return NextResponse.json(
          { error: 'All email steps must have content' },
          { status: 400 }
        )
      }
    }

    const slug = slugify(body.name, { lower: true, strict: true })

    // Check if slug already exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { slug }
    })

    if (existingCampaign) {
      return NextResponse.json(
        { error: 'A campaign with this name already exists' },
        { status: 409 }
      )
    }

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: body.name.trim(),
        slug,
        niche: body.niche?.trim() || null,
        city: body.city?.trim() || null,
        state: body.state?.trim() || null
      }
    })

    // Create sequence steps
    for (const step of body.steps) {
      await prisma.sequenceStep.create({
        data: {
          campaignId: campaign.id,
          dayOffset: step.dayOffset,
          subject: step.subject.trim(),
          bodyHtml: step.bodyHtml.trim()
        }
      })
    }

    // Return campaign with steps
    const createdCampaign = await prisma.campaign.findUnique({
      where: { id: campaign.id },
      include: { 
        steps: {
          orderBy: { dayOffset: 'asc' }
        }
      }
    })

    return NextResponse.json({
      message: `Campaign "${body.name}" created successfully`,
      campaign: createdCampaign
    })

  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}