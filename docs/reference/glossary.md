# Glossary

| Term | Meaning |
|------|---------|
| VNode | A discriminated-union object representing a widget instance in the render tree. |
| Widget | A constructor that produces a VNode (via `ui.*` helpers or direct objects). |
| Drawlist (ZRDL) | Binary command stream produced by Rezi and executed by the Zireael engine. |
| Event batch (ZREV) | Binary event stream produced by the engine and parsed by Rezi into structured events. |
| `id` | User-facing identity used for focus and routed events. Must be stable and unique among interactive widgets. |
| `key` | Reconciliation hint for stable identity in lists; used to reduce churn across renders. |

