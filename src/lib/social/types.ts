/** Métricas vivas de una cuenta (null = el proveedor no las entrega). */
export interface AccountMetrics {
  followers: number | null;
  posts: number | null;
  views?: number | null;
}

/** Cuenta con sus métricas y variaciones (deltas vs el día anterior). */
export interface MetricsAccount {
  id: string; // id del perfil en Hootsuite
  network: string; // nombre visual (YouTube, Facebook…)
  rawType: string; // tipo crudo de Hootsuite
  username: string;
  avatarUrl: string;
  socialNetworkId: string;
  fill: string;
  followers: number | null;
  posts: number | null;
  views: number | null;
  newFollowers: number | null;
  newPosts: number | null;
  available: boolean; // hay credencial/proveedor para esta red
}
