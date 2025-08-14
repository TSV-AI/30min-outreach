"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Loader2, Wand2, Target } from "lucide-react"
import { toast } from "sonner"

interface AIGeneratedCampaign {
  name: string
  steps: {
    dayOffset: number
    subject: string
    bodyHtml: string
  }[]
}

interface AIGeneratorProps {
  onCampaignGenerated: (campaign: AIGeneratedCampaign) => void
}

export function AICampaignGenerator({ onCampaignGenerated }: AIGeneratorProps) {
  const [formData, setFormData] = useState({
    goal: "",
    emailCount: 3,
    targetAudience: "",
    businessType: "Voice AI services"
  })
  const [generating, setGenerating] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.goal.trim() || !formData.targetAudience.trim()) {
      toast.error("Please fill in your goal and target audience")
      return
    }

    setGenerating(true)
    
    try {
      const response = await fetch('/api/campaigns/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate campaign')
      }

      const generatedCampaign = await response.json()
      
      toast.success(`AI generated "${generatedCampaign.name}" with ${generatedCampaign.steps.length} emails!`)
      onCampaignGenerated(generatedCampaign)
      setShowGenerator(false)
      
      // Reset form
      setFormData({
        goal: "",
        emailCount: 3,
        targetAudience: "",
        businessType: "Voice AI services"
      })
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate campaign')
    } finally {
      setGenerating(false)
    }
  }

  if (!showGenerator) {
    return (
      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-primary/10 p-3 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">AI Campaign Generator</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Let AI create a complete email sequence tailored to your goals and audience
          </p>
          <Button 
            onClick={() => setShowGenerator(true)}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Generate with AI
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>AI Campaign Generator</CardTitle>
        </div>
        <CardDescription>
          Tell us about your campaign goals and we'll create a complete email sequence using GPT-5
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal">What are you looking to achieve? *</Label>
            <Textarea
              id="goal"
              placeholder="e.g., Convert missed after-hours calls into booked appointments for dental practices, increase lead conversion rate, generate more revenue from missed opportunities..."
              value={formData.goal}
              onChange={(e) => setFormData({...formData, goal: e.target.value})}
              className="min-h-20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience *</Label>
              <Input
                id="targetAudience"
                placeholder="e.g., Dental practices, Chiropractors, Veterinarians"
                value={formData.targetAudience}
                onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailCount">Number of Emails</Label>
              <Input
                id="emailCount"
                type="number"
                min="2"
                max="7"
                value={formData.emailCount}
                onChange={(e) => setFormData({...formData, emailCount: parseInt(e.target.value) || 3})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessType">Business Type</Label>
            <Input
              id="businessType"
              value={formData.businessType}
              onChange={(e) => setFormData({...formData, businessType: e.target.value})}
            />
          </div>

          <div className="flex items-center space-x-2 pt-4">
            <Button 
              type="submit" 
              disabled={generating}
              className="flex-1"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Campaign...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate {formData.emailCount} Email Sequence
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setShowGenerator(false)}
              disabled={generating}
            >
              Cancel
            </Button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Target className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <strong>AI will create:</strong> Campaign name, {formData.emailCount} email sequence with day scheduling, subject lines, and personalized content using Voice AI messaging focused on your goals.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}