import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";
import { Plus, Users, Mail, Calendar, CheckCircle } from "lucide-react";

export default async function EnrollmentsPage() {
  const [leads, campaigns] = await Promise.all([
    prisma.lead.findMany({ include: { company: true } }),
    prisma.campaign.findMany({ include: { steps: true } })
  ]);

  async function enroll(formData: FormData) {
    "use server";
    const leadIds = formData.getAll("leadId");
    const campaignId = String(formData.get("campaignId")||"");
    
    const res = await fetch(`${process.env.BASE_URL}/api/enroll`, { 
      method: "POST", 
      body: JSON.stringify({ leadIds, campaignId }), 
      headers: {"Content-Type":"application/json"} 
    });
    
    if (res.ok) {
      redirect("/enrollments");
    }
  }

  async function tick() {
    "use server";
    await fetch(`${process.env.BASE_URL}/api/send/tick`, { method: "POST" });
    redirect("/enrollments");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enrollments</h1>
          <p className="text-muted-foreground">
            Enroll leads in campaigns and manage email sequences
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Bulk Enroll
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
            <p className="text-xs text-muted-foreground">
              Ready to enroll
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              Available for enrollment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Steps</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((acc, campaign) => acc + campaign.steps.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Sequence steps ready
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.7%</div>
            <p className="text-xs text-muted-foreground">
              Average open rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enrollment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Enroll Leads in Campaign</CardTitle>
          <CardDescription>
            Select leads and a campaign to start automated outreach sequences
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No campaigns available</h3>
              <p className="text-muted-foreground mb-4">
                Create a campaign first to enroll leads
              </p>
              <Button>Create Campaign</Button>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No leads available</h3>
              <p className="text-muted-foreground mb-4">
                Import leads first to start enrolling
              </p>
              <Button>Import Leads</Button>
            </div>
          ) : (
            <form action={enroll} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Campaign</label>
                <select 
                  name="campaignId" 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Choose a campaign...</option>
                  {campaigns.map(campaign => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name} ({campaign.steps.length} steps)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Leads</label>
                <div className="max-h-64 overflow-auto border border-input rounded-md p-4 space-y-2">
                  {leads.map(lead => (
                    <label key={lead.id} className="flex items-center space-x-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="leadId" 
                        value={lead.id}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{lead.company.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {lead.status}
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Enroll Selected Leads
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Send Tick Section */}
      <Card>
        <CardHeader>
          <CardTitle>Process Sequence Queue</CardTitle>
          <CardDescription>
            Manually trigger processing of due sequence steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={tick} className="flex items-center space-x-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Process all enrollments and queue emails that are due to be sent based on sequence timing.
              </p>
            </div>
            <Button type="submit" variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Process Queue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}