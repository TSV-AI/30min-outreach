import { EmailVerificationStatus } from '@prisma/client'

interface ZeroBounceResponse {
  address: string
  status: string
  sub_status: string
  free_email: boolean
  did_you_mean: string | null
  account: string
  domain: string
  domain_age_days: string
  smtp_provider: string
  mx_found: string
  mx_record: string
  firstname: string
  lastname: string
  gender: string
  country: string
  region: string
  city: string
  zipcode: string
  processed_at: string
}

export class ZeroBounceService {
  private apiKey: string
  private baseUrl = 'https://api.zerobounce.net/v2'

  constructor() {
    this.apiKey = process.env.ZEROBOUNCE_API_KEY!
    if (!this.apiKey) {
      throw new Error('ZEROBOUNCE_API_KEY environment variable is required')
    }
  }

  async validateEmail(email: string): Promise<{
    status: EmailVerificationStatus
    score: number | null
    isValid: boolean
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/validate?api_key=${this.apiKey}&email=${encodeURIComponent(email)}&ip_address=`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`ZeroBounce API error: ${response.status}`)
      }

      const data: ZeroBounceResponse = await response.json()
      
      return {
        status: this.mapZeroBounceStatus(data.status),
        score: null, // ZeroBounce doesn't provide scores in the same way
        isValid: this.isEmailValid(data.status)
      }

    } catch (error) {
      console.error('Error validating email with ZeroBounce:', error)
      return {
        status: EmailVerificationStatus.UNKNOWN,
        score: null,
        isValid: false
      }
    }
  }

  async validateEmailsBulk(emails: string[]): Promise<Array<{
    email: string
    status: EmailVerificationStatus
    score: number | null
    isValid: boolean
  }>> {
    // For bulk validation, we'll use single validation for now
    // ZeroBounce bulk API requires file uploads which is more complex
    const results = []
    
    for (const email of emails) {
      const result = await this.validateEmail(email)
      results.push({
        email,
        ...result
      })
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return results
  }

  private mapZeroBounceStatus(status: string): EmailVerificationStatus {
    switch (status.toLowerCase()) {
      case 'valid':
        return EmailVerificationStatus.VALID
      case 'invalid':
        return EmailVerificationStatus.INVALID
      case 'catch-all':
        return EmailVerificationStatus.CATCH_ALL
      case 'unknown':
        return EmailVerificationStatus.UNKNOWN
      case 'spamtrap':
        return EmailVerificationStatus.SPAMTRAP
      case 'abuse':
        return EmailVerificationStatus.ABUSE
      case 'do_not_mail':
        return EmailVerificationStatus.DO_NOT_MAIL
      default:
        return EmailVerificationStatus.UNKNOWN
    }
  }

  private isEmailValid(status: string): boolean {
    return status.toLowerCase() === 'valid'
  }

  async getCredits(): Promise<number> {
    try {
      const response = await fetch(
        `${this.baseUrl}/getcredits?api_key=${this.apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`ZeroBounce API error: ${response.status}`)
      }

      const data = await response.json()
      return data.Credits || 0

    } catch (error) {
      console.error('Error getting ZeroBounce credits:', error)
      return 0
    }
  }
}

export const zeroBounce = new ZeroBounceService()