import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

  let body: { email?: string; role?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Corps de requête invalide.' }, 400)
  }

  const email = body.email?.trim()
  const role = body.role === 'owner' ? 'owner' : 'member'

  if (!email) {
    return jsonResponse({ error: 'Email requis.' }, 400)
  }

  // Client scopé à l'appelant : sert uniquement à vérifier son identité et
  // son rôle via RLS, jamais à effectuer l'invitation elle-même.
  const callerClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const {
    data: { user },
  } = await callerClient.auth.getUser()

  if (!user) {
    return jsonResponse({ error: 'Utilisateur non authentifié.' }, 401)
  }

  const { data: callerProfile, error: profileError } = await callerClient
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (profileError || !callerProfile) {
    return jsonResponse({ error: 'Profil introuvable.' }, 403)
  }

  if (callerProfile.role !== 'owner') {
    return jsonResponse(
      { error: "Seul le propriétaire de l'entreprise peut inviter des membres." },
      403,
    )
  }

  // Client admin (clé service_role, injectée automatiquement par Supabase) :
  // seul moyen d'envoyer une invitation par email et de poser les métadonnées
  // que join_invited_organization() lira ensuite pour rattacher le nouvel
  // utilisateur à la bonne organisation.
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: {
      invited_org_id: callerProfile.organization_id,
      invited_role: role,
    },
  })

  if (inviteError) {
    return jsonResponse({ error: inviteError.message }, 400)
  }

  return jsonResponse({ success: true }, 200)
})
