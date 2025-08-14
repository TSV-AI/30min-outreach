import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { zeroBounce } from '@/lib/zerobounce'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadIds } = body

    if (!leadIds || !Array.isArray(leadIds)) {
      return NextResponse.json(
        { error: 'leadIds array is required' },
        { status: 400 }
      )
    }

    // Get the leads to verify
    const leads = await prisma.lead.findMany({
      where: {
        id: { in: leadIds },
        emailStatus: 'UNVERIFIED' // Only verify unverified emails
      },
      include: {
        company: true
      }
    })

    if (leads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unverified leads found',
        results: []
      })
    }

    console.log(`🔍 Starting bulk verification for ${leads.length} leads`)

    // Extract emails for bulk verification
    const emails = leads.map(lead => lead.email)
    
    // Verify emails with ZeroBounce
    const verificationResults = await zeroBounce.validateEmailsBulk(emails)

    // Update leads in database
    const updatedLeads = []
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i]
      const verification = verificationResults[i]

      if (verification) {
        const updatedLead = await prisma.lead.update({
          where: { id: lead.id },
          data: {
            emailStatus: verification.status,
            emailScore: verification.score
          },
          include: {
            company: true
          }
        })

        updatedLeads.push({
          lead: updatedLead,
          verification
        })

        console.log(`✅ Verified: ${lead.email} → ${verification.status}`)
      }
    }

    console.log(`🎉 Bulk verification completed: ${updatedLeads.length} leads processed`)

    return NextResponse.json({
      success: true,
      message: `Successfully verified ${updatedLeads.length} leads`,
      results: updatedLeads
    })

  } catch (error) {
    console.error('Bulk email verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify emails' },
      { status: 500 }
    )
  }
}