import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ANTHROPIC_MODEL = 'claude-sonnet-5'

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header.' }, 401)
  }

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicKey) {
    return jsonResponse({ error: "Clé Anthropic non configurée côté serveur." }, 500)
  }

  // Client scopé à l'utilisateur appelant : RLS s'applique exactement comme côté
  // frontend, donc cette requête ne peut jamais voir les produits d'une autre
  // organisation, même si l'appelant essayait de le forcer.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return jsonResponse({ error: 'Utilisateur non authentifié.' }, 401)
  }

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('name, reference, quantity, alert_threshold, price, category')
    .order('name', { ascending: true })

  if (productsError) {
    return jsonResponse({ error: productsError.message }, 500)
  }

  if (!products || products.length === 0) {
    return jsonResponse({ error: "Aucun produit à analyser. Ajoute des produits d'abord." }, 400)
  }

  const systemPrompt = `Tu es un assistant d'analyse de stock générique, utilisable par n'importe
quel type d'entreprise (commerce, restauration, santé, industrie, etc.). Tu reçois un
instantané des produits actuels d'une seule entreprise (nom, référence, quantité,
seuil d'alerte, prix, catégorie). Tu n'as PAS d'historique de mouvements de stock :
ne fabrique jamais de tendance temporelle que ces données ne permettent pas de
déduire. Si l'information est insuffisante pour un point demandé, dis-le clairement
plutôt que d'inventer. Réponds en français, en clair et sans jargon, avec ces trois
sections en Markdown :
## Produits à réapprovisionner en priorité
## Observations sur les données actuelles
## Recommandations générales`

  const userPrompt = `Voici l'instantané des produits :\n\n${JSON.stringify(products, null, 2)}`

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!anthropicRes.ok) {
    const detail = await anthropicRes.text()
    console.error('Anthropic API error', anthropicRes.status, detail)
    return jsonResponse({ error: "L'analyse IA a échoué. Réessaie dans un instant." }, 502)
  }

  const anthropicData = await anthropicRes.json()
  type ContentBlock = { type: string; text?: string }
  const textBlock = (anthropicData.content as ContentBlock[] | undefined)?.find(
    (block) => block.type === 'text',
  )
  const analysis = textBlock?.text ?? ''

  return jsonResponse({ analysis }, 200)
})
