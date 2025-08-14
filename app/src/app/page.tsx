import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Users, Mail, TrendingUp, Target, Plus } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const stats = [
    {
      title: "Total Campaigns",
      value: "12",
      change: "+2.5%",
      icon: Target,
      description: "Active outreach campaigns"
    },
    {
      title: "Total Leads",
      value: "2,847",
      change: "+12.3%",
      icon: Users,
      description: "Qualified prospects"
    },
    {
      title: "Emails Sent",
      value: "8,294",
      change: "+5.1%",
      icon: Mail,
      description: "This month"
    },
    {
      title: "Open Rate",
      value: "24.7%",
      change: "+1.2%",
      icon: TrendingUp,
      description: "Campaign average"
    }
  ]

  const recentCampaigns = [
    { name: "Dental Practice Q4", status: "Active", leads: 342, opened: "18.5%" },
    { name: "Orthodontist Outreach", status: "Paused", leads: 128, opened: "22.1%" },
    { name: "Emergency Dental", status: "Active", leads: 89, opened: "31.2%" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your VoiceAI outreach campaigns
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/campaigns">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seasalt-600">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-powder_blue-400 font-medium">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Campaigns */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
            <CardDescription>
              Your latest outreach campaigns and their performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCampaigns.map((campaign) => (
                <div key={campaign.name} className="flex items-center justify-between p-4 border border-slate_gray-300 rounded-lg hover:border-powder_blue-400 hover:bg-slate_gray-300/50 transition-all duration-200">
                  <div className="space-y-1">
                    <p className="font-medium text-seasalt-600">{campaign.name}</p>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={campaign.status === "Active" ? "default" : "secondary"}
                        className={campaign.status === "Active" ? "bg-powder_blue-400 text-slate_gray-100" : ""}
                      >
                        {campaign.status}
                      </Badge>
                      <span className="text-sm text-silver-300">
                        {campaign.leads} leads
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-powder_blue-400">{campaign.opened}</p>
                    <p className="text-xs text-muted-foreground">Open rate</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/campaigns">
                <Button variant="outline" className="w-full">
                  View All Campaigns
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with common tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/campaigns" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Target className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </Link>
            <Link href="/leads" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Import Leads
              </Button>
            </Link>
            <Link href="/enrollments" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Enroll Leads
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}