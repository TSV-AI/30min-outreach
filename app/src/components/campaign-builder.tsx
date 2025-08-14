"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2, Calendar, Mail, Save, Eye, ArrowDown } from "lucide-react"
import { toast } from "sonner"
import { AICampaignGenerator } from "./ai-campaign-generator"

interface EmailStep {
  id: string
  dayOffset: number
  subject: string
  bodyHtml: string
}

interface CampaignFormData {
  name: string
  niche: string
  city: string
  state: string
  steps: EmailStep[]
}

export function CampaignBuilder() {
  const [formData, setFormData] = useState<CampaignFormData>({
    name: "",
    niche: "",
    city: "",
    state: "",
    steps: [
      {
        id: "1",
        dayOffset: 0,
        subject: "",
        bodyHtml: ""
      }
    ]
  })
  const [busy, setBusy] = useState(false)
  const [previewStep, setPreviewStep] = useState<string | null>(null)

  const handleAIGenerated = (aiCampaign: { name: string, steps: { dayOffset: number, subject: string, bodyHtml: string }[] }) => {
    setFormData({
      ...formData,
      name: aiCampaign.name,
      steps: aiCampaign.steps.map((step, index) => ({
        id: (Date.now() + index).toString(),
        dayOffset: step.dayOffset,
        subject: step.subject,
        bodyHtml: step.bodyHtml
      }))
    })
    toast.success(`AI campaign loaded! Review and submit when ready.`)
  }

  const addStep = () => {
    const lastStep = formData.steps[formData.steps.length - 1]
    const newStep: EmailStep = {
      id: Date.now().toString(),
      dayOffset: lastStep ? lastStep.dayOffset + 2 : 0,
      subject: "",
      bodyHtml: ""
    }
    setFormData({
      ...formData,
      steps: [...formData.steps, newStep]
    })
  }

  const removeStep = (stepId: string) => {
    if (formData.steps.length <= 1) {
      toast.error("Campaign must have at least one email step")
      return
    }
    setFormData({
      ...formData,
      steps: formData.steps.filter(step => step.id !== stepId)
    })
  }

  const updateStep = (stepId: string, field: keyof EmailStep, value: string | number) => {
    setFormData({
      ...formData,
      steps: formData.steps.map(step => 
        step.id === stepId ? { ...step, [field]: value } : step
      )
    })
  }

  const insertTemplate = (stepId: string, template: 'followup' | 'reminder' | 'final') => {
    const templates = {
      followup: {
        subject: "Following up on {{company}}'s Voice AI setup",
        bodyHtml: `Hi {{firstname}},<br/><br/>Wanted to circle back on the Voice AI demo for {{company}}. Many practices see 20-30% more appointments just from better after-hours coverage.<br/><br/>Are you available for a quick 10-minute call this week?<br/><br/>Best,<br/>{{sender}}<br/><small><a href="{{unsub}}">Unsubscribe</a></small>`
      },
      reminder: {
        subject: "Quick reminder about {{company}}'s missed calls",
        bodyHtml: `{{firstname}},<br/><br/>Quick reminder about our Voice AI that converts after-hours calls to appointments. We can set up a pilot for {{company}} this week at no cost.<br/><br/>Would Friday or Monday work better for you?<br/><br/>{{sender}}<br/><small><a href="{{unsub}}">Unsubscribe</a></small>`
      },
      final: {
        subject: "Last email about Voice AI for {{company}}",
        bodyHtml: `Hi {{firstname}},<br/><br/>This will be my last email about the Voice AI opportunity for {{company}}.<br/><br/>If you're interested in turning missed calls into booked appointments, please let me know. Otherwise, I'll remove you from this sequence.<br/><br/>Thanks for your time,<br/>{{sender}}<br/><small><a href="{{unsub}}">Unsubscribe</a></small>`
      }
    }

    const template_data = templates[template]
    updateStep(stepId, 'subject', template_data.subject)
    updateStep(stepId, 'bodyHtml', template_data.bodyHtml)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Campaign name is required")
      return
    }
    
    if (formData.steps.some(step => !step.subject.trim() || !step.bodyHtml.trim())) {
      toast.error("All email steps must have a subject and content")
      return
    }

    setBusy(true)
    
    try {
      const response = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create campaign')
      }

      toast.success(`Campaign "${formData.name}" created successfully with ${formData.steps.length} email steps!`)
      
      // Reset form
      setFormData({
        name: "",
        niche: "",
        city: "",
        state: "",
        steps: [{ id: "1", dayOffset: 0, subject: "", bodyHtml: "" }]
      })
      
      // Reload page to show new campaign
      setTimeout(() => location.reload(), 1000)
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create campaign')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div data-campaign-builder className="space-y-6">
      <AICampaignGenerator onCampaignGenerated={handleAIGenerated} />
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or create manually</span>
        </div>
      </div>

    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>
            Set up your campaign information and targeting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Dental Practice Outreach Q1"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="niche">Target Niche</Label>
              <Input
                id="niche"
                placeholder="e.g., Dental Practices"
                value={formData.niche}
                onChange={(e) => setFormData({...formData, niche: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Target City</Label>
              <Input
                id="city"
                placeholder="e.g., San Diego"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Target State</Label>
              <Input
                id="state"
                placeholder="e.g., CA"
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Sequence</CardTitle>
              <CardDescription>
                Create your follow-up email sequence. Day 0 = initial email.
              </CardDescription>
            </div>
            <Button type="button" onClick={addStep} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Email
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.steps.map((step, index) => (
            <div key={step.id}>
              <Card className="relative">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {index === 0 ? "Initial Email" : `Follow-up ${index}`}
                      </Badge>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Day {step.dayOffset}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewStep(previewStep === step.id ? null : step.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {formData.steps.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStep(step.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Send After (Days)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={step.dayOffset}
                        onChange={(e) => updateStep(step.id, 'dayOffset', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Email Subject *</Label>
                      <Input
                        placeholder="Enter email subject..."
                        value={step.subject}
                        onChange={(e) => updateStep(step.id, 'subject', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Email Content *</Label>
                      <div className="space-x-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertTemplate(step.id, 'followup')}
                        >
                          Follow-up
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertTemplate(step.id, 'reminder')}
                        >
                          Reminder
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertTemplate(step.id, 'final')}
                        >
                          Final
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      className="min-h-32"
                      placeholder="Enter email content (HTML supported)..."
                      value={step.bodyHtml}
                      onChange={(e) => updateStep(step.id, 'bodyHtml', e.target.value)}
                      required
                    />
                  </div>

                  {previewStep === step.id && (
                    <Alert>
                      <Eye className="h-4 w-4" />
                      <AlertDescription>
                        <div className="mt-2 p-3 bg-background border rounded">
                          <div className="font-medium mb-2">Subject: {step.subject || "No subject"}</div>
                          <div 
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ 
                              __html: step.bodyHtml.replace(/\{\{(\w+)\}\}/g, '<span class="bg-yellow-100 px-1 rounded text-sm">$1</span>') || "No content" 
                            }} 
                          />
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
              
              {index < formData.steps.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Alert>
        <Mail className="h-4 w-4" />
        <AlertDescription>
          <strong>Available variables:</strong> {`{{firstname}}, {{company}}, {{website}}, {{sender}}, {{unsub}}, {{scheduler}}`}
        </AlertDescription>
      </Alert>

      <Button type="submit" disabled={busy} className="w-full" size="lg">
        {busy ? (
          <>
            <Save className="mr-2 h-4 w-4 animate-pulse" />
            Creating Campaign...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Create Campaign with {formData.steps.length} Email{formData.steps.length > 1 ? 's' : ''}
          </>
        )}
      </Button>
    </form>
    </div>
  )
}