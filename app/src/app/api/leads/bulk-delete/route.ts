import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const { leadIds } = await request.json()

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: 'leadIds array is required' },
        { status: 400 }
      )
    }

    // Delete the leads
    const result = await prisma.lead.deleteMany({
      where: {
        id: {
          in: leadIds
        }
      }
    })

    return NextResponse.json({
      message: `Successfully deleted ${result.count} leads`,
      deletedCount: result.count
    })

  } catch (error) {
    console.error('Error deleting leads:', error)
    return NextResponse.json(
      { error: 'Failed to delete leads' },
      { status: 500 }
    )
  }
}