import { NextRequest } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, location, limit = 30 } = body

    if (!query || !location) {
      return new Response('Query and location are required', { status: 400 })
    }

    // Set up streaming response
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        
        // Generate unique filename
        const timestamp = Date.now()
        const outputFile = `scrape_${timestamp}.jsonl`
        const scraperDir = path.join(process.cwd(), '../scraper')
        
        // Start Python scraper
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

        // Stream stdout in real-time
        pythonProcess.stdout.on('data', (data) => {
          const output = data.toString()
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', message: output.trim() })}\n\n`))
        })

        // Stream stderr 
        pythonProcess.stderr.on('data', (data) => {
          const error = data.toString()
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: error.trim() })}\n\n`))
        })

        // Handle completion
        pythonProcess.on('close', (code) => {
          if (code === 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete', outputFile })}\n\n`))
          } else {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'failed', code })}\n\n`))
          }
          controller.close()
        })

        // Handle errors
        pythonProcess.on('error', (error) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`))
          controller.close()
        })
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (error) {
    console.error('Streaming error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}