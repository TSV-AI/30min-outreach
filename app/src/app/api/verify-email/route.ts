import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { zeroBounce } from '@/lib/zerobounce'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadId, email } = body

    if (!leadId && !email) {
      return NextResponse.json(
        { error: 'Either leadId or email is required' },
        { status: 400 }
      )
    }

    // Verify the email with ZeroBounce
    const verificationResult = await zeroBounce.validateEmail(email)

    // If leadId is provided, update the lead in the database
    if (leadId) {
      const updatedLead = await prisma.lead.update({
        where: { id: leadId },
        data: {
          emailStatus: verificationResult.status,
          emailScore: verificationResult.score
        },
        include: {
          company: true
        }
      })

      return NextResponse.json({
        success: true,
        lead: updatedLead,
        verification: verificationResult
      })
    }

    // If no leadId, just return the verification result
    return NextResponse.json({
      success: true,
      verification: verificationResult
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get ZeroBounce credits
    const credits = await zeroBounce.getCredits()
    
    return NextResponse.json({
      success: true,
      credits
    })

  } catch (error) {
    console.error('Error getting credits:', error)
    return NextResponse.json(
      { error: 'Failed to get credits' },
      { status: 500 }
    )
  }
}