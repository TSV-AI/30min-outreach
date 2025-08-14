export async function GET() {
  console.log('Health check endpoint hit');
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}