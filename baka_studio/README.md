# baka_studio

A new Flutter project.

## Sincronização entre dispositivos (opcional)

O app funciona 100% localmente sem nenhuma configuração — persistência via
Drift/SQLite, sem depender de rede. Para ativar a sincronização com
Supabase, rode (ou compile) passando as duas variáveis do seu projeto
Supabase (Project Settings > API no painel do supabase.com):

```
flutter run \
  --dart-define=SUPABASE_URL=https://SEU_PROJETO.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=SUA_CHAVE_ANON
```

Sem essas variáveis (ou com uma URL inválida), o app segue funcionando
normalmente em modo local-only — nunca trava por causa de configuração
ausente ou incorreta. Nunca use a `service_role key` aqui — só a `anon`/
`publishable` key, que é segura para embutir no cliente porque o acesso real
é controlado por Row Level Security no banco (ver `supabase/schema.sql`).

## Rodando na web

O banco local (Drift/SQLite) usa WebAssembly no navegador — por isso
`web/sqlite3.wasm` e `web/drift_worker.js` fazem parte do repositório (são
artefatos compilados, não código-fonte; se precisar regenerá-los, veja o
pacote `drift` — `web/drift_worker.dart` compilado com `dart compile js`,
e `sqlite3.wasm` distribuído junto com o pacote `drift`/`sqlite3`).

`web/flutter_bootstrap.js` aponta o CanvasKit para a cópia local já
empacotada em `build/web/canvaskit/` em vez do CDN da Google — evita uma
dependência de terceiro em tempo de execução, seguindo a recomendação do
próprio time do Flutter para reduzir flakiness.
