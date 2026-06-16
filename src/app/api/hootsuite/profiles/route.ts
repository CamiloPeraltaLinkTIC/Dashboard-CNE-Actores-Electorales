import { NextResponse } from "next/server";
import { getServerAccess } from "@/lib/auth/access";
import { getSocialProfiles, mapNetworkName, NETWORK_COLORS } from "@/lib/hootsuite";

export const runtime = "nodejs";

/** Seguidores por red social (en vivo desde Hootsuite) para la cuenta indicada. */
export async function GET(request: Request) {
  const access = await getServerAccess();
  if (!access) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const account = new URL(request.url).searchParams.get("account") || "cne";

  try {
    const profiles = await getSocialProfiles(account);

    const groups: Record<string, number> = {};
    let total = 0;
    for (const p of profiles as Array<{ type: string; followerCount?: number; stats?: { followers?: number } }>) {
      const name = mapNetworkName(p.type);
      const followers = p.followerCount || p.stats?.followers || 0;
      groups[name] = (groups[name] || 0) + followers;
      total += followers;
    }

    const networks = Object.entries(groups)
      .map(([name, followers]) => ({ name, followers, fill: NETWORK_COLORS[name] || "#22d3ee" }))
      .sort((a, b) => b.followers - a.followers);

    return NextResponse.json({
      ok: true,
      account,
      total,
      networks,
      profileCount: Array.isArray(profiles) ? profiles.length : 0,
      // DEBUG temporal: estructura cruda para ver qué campos trae Hootsuite.
      _debug: {
        sampleKeys: Array.isArray(profiles) && profiles[0] ? Object.keys(profiles[0]) : [],
        sample: Array.isArray(profiles) ? profiles.slice(0, 3) : [],
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
