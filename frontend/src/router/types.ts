import 'vue-router'

interface CustomRouteMeta {
  requiresAuth?: boolean;
  requiresGuest?: boolean;
  roles?: string[];
}

declare module 'vue-router' {
  interface RouteMeta extends CustomRouteMeta {}
}