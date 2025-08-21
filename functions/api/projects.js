export async function onRequestGet(context) {
  console.log("Fetching Vercel projects...", context);
  
  const vercelToken = context.env.VERCEL_TOKEN;
  if (!vercelToken) {
    return new Response(JSON.stringify({ error: 'Vercel token not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const vercelResponse = await fetch("https://api.vercel.com/v9/projects?limit=50", {
    headers: { Authorization: `Bearer ${vercelToken}` },
  });

  if (!vercelResponse.ok) {
    const errorData = await vercelResponse.json().catch(() => ({}));
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch projects',
      details: errorData.error?.message || vercelResponse.statusText,
    }), {
      status: vercelResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await vercelResponse.json();
  const projectsArray = result.projects || [];

  const projects = projectsArray.map(p => ({
    id: p.id,
    name: p.name,
    framework: p.framework,
    productionUrl: p.targets?.production?.alias?.[0]
      ? `https://${p.targets.production.alias[0]}`
      : 'No production URL',
  }));

  return new Response(JSON.stringify({ success: true, projects }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
