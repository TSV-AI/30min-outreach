import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { ImportLeadsForm } from "@/components/forms";
import { ScrapeForm } from "@/components/scrape-form";
import { LeadsTable } from "@/components/leads-table";
import { Plus, Users, Building, Mail, TrendingUp, Download, Upload } from "lucide-react";

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({ 
    include: { company: true },
    orderBy: { createdAt: 'desc' }
  });

  const statusCounts = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            Manage your prospect database and lead information
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
            <p className="text-xs text-muted-foreground">
              In database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.NEW || 0}</div>
            <p className="text-xs text-muted-foreground">
              Ready to contact
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacted</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.CONTACTED || 0}</div>
            <p className="text-xs text-muted-foreground">
              In sequences
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Replied</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.REPLIED || 0}</div>
            <p className="text-xs text-muted-foreground">
              Engaged prospects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(leads.map(lead => lead.companyId)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique companies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Automated Scraping Section */}
      <ScrapeForm />

      {/* Manual Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Manual Import
          </CardTitle>
          <CardDescription>
            Import leads from existing JSONL files or manual entry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImportLeadsForm />
        </CardContent>
      </Card>

      {/* Professional Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Database</CardTitle>
          <CardDescription>
            All leads in your prospect database ({leads.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No leads yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Import leads from your scraper or add them manually to get started
              </p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Import Your First Leads
              </Button>
            </div>
          ) : (
            <LeadsTable data={leads} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}