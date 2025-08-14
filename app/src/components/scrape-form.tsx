"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Loader2, CheckCircle, AlertCircle, Building } from "lucide-react"

interface ScrapeResult {
  id: string
  email: string
  company: string
  website: string
}

const businessTypes = [
  "dentist", "orthodontist", "chiropractor", "veterinarian", 
  "personal injury lawyer", "auto repair shop", "restaurant", 
  "coffee shop", "hair salon", "nail salon", "massage therapist",
  "physical therapist", "optometrist", "dermatologist", "pediatrician",
  "real estate agent", "insurance agent", "accountant", "lawyer",
  "plumber", "electrician", "contractor", "landscaper", "architect",
  "interior designer", "photographer", "wedding planner", "caterer",
  "bakery", "florist", "gym", "yoga studio", "martial arts", "dance studio",
  "music teacher", "tutoring service", "daycare", "preschool", "driving school",
  "auto mechanic", "tire shop", "car dealership", "moving company",
  "cleaning service", "home inspector", "HVAC", "roofing contractor",
  "painting contractor", "flooring contractor", "handyman service",
  "pool service", "pest control", "security service", "locksmith",
  "appliance repair", "computer repair", "cell phone repair",
  "jewelry store", "watch repair", "alterations", "dry cleaner"
]

export function ScrapeForm() {
  const [query, setQuery] = useState("")
  const [location, setLocation] = useState("")
  const [limit, setLimit] = useState(30)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<ScrapeResult[]>([])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [progress, setProgress] = useState<string[]>([])
  const [currentProgress, setCurrentProgress] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")
    setResults([])
    setProgress([])
    setCurrentProgress("")

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          location,
          limit
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Scraping failed')
      }

      setResults(data.leads || [])
      setSuccess(data.message)
      
      // Reset form
      setQuery("")
      setLocation("")
      setLimit(30)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="mr-2 h-5 w-5" />
            Automated Lead Scraping
          </CardTitle>
          <CardDescription>
            Search for businesses and automatically import leads into your database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 relative">
                <Label htmlFor="query">Business Type</Label>
                <Input
                  id="query"
                  placeholder="e.g., dentist, orthodontist, chiropractor"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  required
                />
                {showSuggestions && (
                  <div className="absolute z-10 w-full bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {businessTypes
                      .filter(type => query === "" || type.toLowerCase().includes(query.toLowerCase()))
                      .slice(0, 20)
                      .map((type) => (
                        <div
                          key={type}
                          className="px-4 py-3 hover:bg-muted cursor-pointer text-sm border-b border-border last:border-b-0 transition-colors flex items-center space-x-2"
                          onClick={() => {
                            setQuery(type)
                            setShowSuggestions(false)
                          }}
                        >
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{type}</span>
                        </div>
                      ))}
                    {businessTypes.filter(type => type.toLowerCase().includes(query.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-sm text-muted-foreground">
                        No matches found. You can still use "{query}" as your search term.
                      </div>
                    )}
                    {query && !businessTypes.includes(query.toLowerCase()) && (
                      <div className="px-4 py-2 border-t border-border bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-1">Custom search term:</div>
                        <div className="flex items-center space-x-2 text-sm font-medium">
                          <Search className="h-4 w-4" />
                          <span>"{query}"</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., San Diego, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="limit">Number of Businesses</Label>
              <Input
                id="limit"
                type="text"
                placeholder="30"
                value={limit === 0 ? '' : limit}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  if (value === '') {
                    setLimit(0)
                  } else {
                    const num = parseInt(value)
                    if (num >= 1 && num <= 100) {
                      setLimit(num)
                    }
                  }
                }}
                onBlur={(e) => {
                  if (limit === 0 || !limit) {
                    setLimit(30)
                  }
                }}
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {currentProgress || "Starting scraper..."}
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Start Scraping
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {progress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scraping Progress</CardTitle>
            <CardDescription>
              Live updates from the scraper
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate_gray-100 p-4 rounded-md max-h-60 overflow-y-auto">
              <div className="space-y-1 font-mono text-sm">
                {progress.map((line, index) => (
                  <div key={index} className="text-seasalt-600">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scraping Results</CardTitle>
            <CardDescription>
              Successfully imported {results.length} leads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.slice(0, 10).map((result) => (
                <div 
                  key={result.id} 
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center space-x-3">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{result.company}</p>
                      <p className="text-sm text-muted-foreground">{result.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline">Imported</Badge>
                </div>
              ))}
              
              {results.length > 10 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  ... and {results.length - 10} more leads
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}