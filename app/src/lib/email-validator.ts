// Email validation and filtering utility
// Filters out problematic emails before they get imported

export interface EmailValidationResult {
  isValid: boolean
  reason?: string
  shouldImport: boolean
}

export class EmailValidator {
  // Role-based email prefixes to avoid
  private static readonly ROLE_BASED_PREFIXES = [
    'info', 'contact', 'support', 'help', 'sales', 'admin', 'administrator',
    'webmaster', 'postmaster', 'abuse', 'noreply', 'no-reply', 'donotreply',
    'marketing', 'team', 'hello', 'hi', 'general', 'office', 'reception',
    'inquiry', 'inquiries', 'service', 'services', 'customerservice', 
    'customer-service', 'billing', 'accounts', 'hr', 'humanresources',
    'jobs', 'careers', 'press', 'media', 'legal', 'compliance', 'privacy',
    'user', 'username', 'email', 'mail', 'example', 'test', 'demo'
  ]

  // Disposable/temporary email domains to avoid
  private static readonly DISPOSABLE_DOMAINS = [
    '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'tempmail.org',
    'throwaway.email', '7days-a-week.com', 'yopmail.com', 'temp-mail.org',
    'getairmail.com', 'emailondeck.com', 'fakeinbox.com'
  ]

  // Generic/suspicious patterns
  private static readonly SUSPICIOUS_PATTERNS = [
    /^test\d*@/i,
    /^demo\d*@/i,
    /^sample\d*@/i,
    /^example\d*@/i,
    /^fake\d*@/i,
    /^spam\d*@/i,
    /\+.*@/,  // Plus addressing (user+tag@domain.com)
    /^.{1,2}@/,  // Very short local parts (likely not real people)
  ]

  static validateEmail(email: string): EmailValidationResult {
    if (!email || typeof email !== 'string') {
      return {
        isValid: false,
        reason: 'Invalid email format',
        shouldImport: false
      }
    }

    const normalizedEmail = email.toLowerCase().trim()
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return {
        isValid: false,
        reason: 'Invalid email format',
        shouldImport: false
      }
    }

    const [localPart, domain] = normalizedEmail.split('@')

    // Check for role-based emails
    if (this.ROLE_BASED_PREFIXES.includes(localPart)) {
      return {
        isValid: true,
        reason: 'Role-based email (not personal)',
        shouldImport: false
      }
    }

    // Check for disposable domains
    if (this.DISPOSABLE_DOMAINS.includes(domain)) {
      return {
        isValid: true,
        reason: 'Disposable/temporary email domain',
        shouldImport: false
      }
    }

    // Check for suspicious patterns
    for (const pattern of this.SUSPICIOUS_PATTERNS) {
      if (pattern.test(normalizedEmail)) {
        return {
          isValid: true,
          reason: 'Suspicious email pattern',
          shouldImport: false
        }
      }
    }

    // Check for obvious file extensions (sometimes scrapers pick up non-emails)
    const fileExtensions = ['.jpg', '.png', '.gif', '.pdf', '.doc', '.txt', '.html', '.css', '.js']
    if (fileExtensions.some(ext => normalizedEmail.includes(ext))) {
      return {
        isValid: false,
        reason: 'Not an email address (file extension detected)',
        shouldImport: false
      }
    }

    // Passed all checks - good to import
    return {
      isValid: true,
      shouldImport: true
    }
  }

  static filterEmailList(emails: string[]): {
    validEmails: string[]
    filteredOut: Array<{ email: string; reason: string }>
  } {
    const validEmails: string[] = []
    const filteredOut: Array<{ email: string; reason: string }> = []

    for (const email of emails) {
      const validation = this.validateEmail(email)
      
      if (validation.shouldImport) {
        validEmails.push(email.toLowerCase().trim())
      } else {
        filteredOut.push({
          email: email,
          reason: validation.reason || 'Failed validation'
        })
      }
    }

    return { validEmails, filteredOut }
  }

  static getFilterStats(emails: string[]): {
    total: number
    valid: number
    filtered: number
    filterReasons: Record<string, number>
  } {
    const { validEmails, filteredOut } = this.filterEmailList(emails)
    
    const filterReasons: Record<string, number> = {}
    for (const item of filteredOut) {
      filterReasons[item.reason] = (filterReasons[item.reason] || 0) + 1
    }

    return {
      total: emails.length,
      valid: validEmails.length,
      filtered: filteredOut.length,
      filterReasons
    }
  }
}

export const emailValidator = EmailValidator