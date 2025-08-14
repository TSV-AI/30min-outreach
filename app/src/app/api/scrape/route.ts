import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, location, limit = 30 } = body

    if (!query || !location) {
      return NextResponse.json(
        { error: 'Query and location are required' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const outputFile = `scrape_${timestamp}.jsonl`
    const scraperDir = path.join(process.cwd(), '../../scraper')
    const outputPath = path.join(scraperDir, outputFile)

    // Run the Python scraper with virtual environment
    const venvPython = path.join(scraperDir, 'venv', 'bin', 'python')
    const pythonProcess = spawn(venvPython, [
      'scrape_practices.py',
      '--query', query,
      '--location', location,
      '--limit', limit.toString(),
      '--out', outputFile
    ], {
      cwd: scraperDir,
      env: { 
        ...process.env,
        SERPAPI_KEY: process.env.SERPAPI_KEY
      }
    })

    let stdout = ''
    let stderr = ''

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    // Wait for scraper to complete
    const exitCode = await new Promise((resolve) => {
      pythonProcess.on('close', resolve)
    })

    if (exitCode !== 0) {
      console.error('Scraper failed:', stderr)
      return NextResponse.json(
        { error: 'Scraping failed', details: stderr },
        { status: 500 }
      )
    }

    // Read and process the results
    const results = []
    try {
      const fileContent = await fs.readFile(outputPath, 'utf-8')
      const lines = fileContent.trim().split('\n').filter(line => line.trim())
      
      for (const line of lines) {
        const leadData = JSON.parse(line)
        
        // Create or find company
        const company = await prisma.company.upsert({
          where: { name: leadData.company },
          update: {
            website: leadData.website,
            phone: leadData.phone,
            address: leadData.address
          },
          create: {
            name: leadData.company,
            website: leadData.website,
            phone: leadData.phone,
            address: leadData.address,
            industry: query // Use the search query as industry
          }
        })

        // Create lead
        const lead = await prisma.lead.create({
          data: {
            email: leadData.email,
            companyId: company.id,
            status: 'NEW',
            source: 'SCRAPER',
            contactName: leadData.contactName || null
          }
        })

        results.push({
          id: lead.id,
          email: lead.email,
          company: company.name,
          website: company.website
        })
      }

      // Clean up temp file
      await fs.unlink(outputPath)

    } catch (error) {
      console.error('Error processing results:', error)
      return NextResponse.json(
        { error: 'Failed to process scraper results' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully scraped and imported ${results.length} leads`,
      leads: results,
      query,
      location
    })

  } catch (error) {
    console.error('Scraping error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}