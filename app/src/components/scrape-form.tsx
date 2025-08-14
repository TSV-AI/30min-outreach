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

export function ScrapeForm() {
  const [query, setQuery] = useState("")
  const [location, setLocation] = useState("")
  const [limit, setLimit] = useState(30)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<ScrapeResult[]>([])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")
    setResults([])

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
              <div className="space-y-2">
                <Label htmlFor="query">Business Type</Label>
                <Input
                  id="query"
                  placeholder="e.g., dentist, orthodontist, chiropractor"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  required
                />
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
                type="number"
                min="1"
                max="100"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 30)}
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
                  Scraping... (this may take a few minutes)
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