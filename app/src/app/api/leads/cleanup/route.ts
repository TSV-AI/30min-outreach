import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EmailVerificationStatus } from '@prisma/client';

export async function DELETE() {
  try {
    // Find leads with INVALID or DO_NOT_MAIL email status
    const leadsToDelete = await prisma.lead.findMany({
      where: {
        emailStatus: {
          in: [EmailVerificationStatus.INVALID, EmailVerificationStatus.DO_NOT_MAIL]
        }
      },
      include: {
        company: true
      }
    });

    console.log(`🗑️ Found ${leadsToDelete.length} leads to delete (INVALID or DO_NOT_MAIL)`);

    if (leadsToDelete.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No invalid or do-not-mail leads found to delete",
        deleted: 0
      });
    }

    // Delete the leads
    const deleteResult = await prisma.lead.deleteMany({
      where: {
        emailStatus: {
          in: [EmailVerificationStatus.INVALID, EmailVerificationStatus.DO_NOT_MAIL]
        }
      }
    });

    console.log(`✅ Deleted ${deleteResult.count} invalid/do-not-mail leads`);

    // Also clean up any companies that no longer have leads
    const companiesWithoutLeads = await prisma.company.findMany({
      where: {
        leads: {
          none: {}
        }
      }
    });

    if (companiesWithoutLeads.length > 0) {
      await prisma.company.deleteMany({
        where: {
          leads: {
            none: {}
          }
        }
      });
      console.log(`🏢 Deleted ${companiesWithoutLeads.length} companies with no remaining leads`);
    }

    return NextResponse.json({
      ok: true,
      message: `Successfully deleted ${deleteResult.count} invalid/do-not-mail leads`,
      deleted: deleteResult.count,
      companiesDeleted: companiesWithoutLeads.length,
      deletedLeads: leadsToDelete.map(lead => ({
        email: lead.email,
        company: lead.company.name,
        status: lead.emailStatus
      }))
    });

  } catch (error) {
    console.error('Error deleting invalid leads:', error);
    return NextResponse.json(
      { error: 'Failed to delete invalid leads' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get count of leads that would be deleted
    const invalidCount = await prisma.lead.count({
      where: {
        emailStatus: EmailVerificationStatus.INVALID
      }
    });

    const doNotMailCount = await prisma.lead.count({
      where: {
        emailStatus: EmailVerificationStatus.DO_NOT_MAIL
      }
    });

    const totalToDelete = invalidCount + doNotMailCount;

    return NextResponse.json({
      ok: true,
      preview: {
        invalid: invalidCount,
        doNotMail: doNotMailCount,
        total: totalToDelete
      }
    });

  } catch (error) {
    console.error('Error getting cleanup preview:', error);
    return NextResponse.json(
      { error: 'Failed to get cleanup preview' },
      { status: 500 }
    );
  }
}