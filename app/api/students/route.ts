import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json() as { ids: string[] }
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ students: [] })
    }

    // Fetch profiles (name) and auth users (email) in parallel
    const [{ data: profiles }, { data: authUsers }] = await Promise.all([
      supabaseAdmin.from("user_profiles").select("id, name").in("id", ids),
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    ])

    const nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.name as string | null]))
    const emailMap = Object.fromEntries(
      (authUsers?.users ?? [])
        .filter((u) => ids.includes(u.id))
        .map((u) => [u.id, u.email ?? null])
    )

    const students = ids.map((id) => {
      const name = nameMap[id] || (emailMap[id] ? emailMap[id]!.split("@")[0] : null) || "Alumno"
      return { id, name }
    })

    return NextResponse.json({ students })
  } catch {
    return NextResponse.json({ students: [] }, { status: 500 })
  }
}
