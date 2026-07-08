# Roteiro manual de teste multi-dispositivo — Fase 4 (Sincronização)

Este roteiro cobre os cenários que só fazem sentido validar com dois
dispositivos reais (ou duas instalações do app) e um projeto Supabase real
configurado — não são automatizáveis nesta sandbox. Rode `flutter run`
passando `--dart-define=SUPABASE_URL=...` e `--dart-define=SUPABASE_ANON_KEY=...`
(ver `README.md`) em cada dispositivo/emulador.

Convenção: **Dispositivo A** e **Dispositivo B** são duas instalações
separadas do app (dois emuladores, ou um físico + um emulador), logadas na
**mesma conta**.

---

## A — Sincronização básica entre dois dispositivos

1. No Dispositivo A: criar conta, criar um canal novo ("Teste A").
2. Em Ajustes > Sincronização, tocar "Sincronizar agora" e confirmar que o
   status muda para "Sincronizado".
3. No Dispositivo B: entrar com a mesma conta.
4. Esperado: o diálogo "Dados encontrados neste dispositivo" só aparece se
   B já tinha dados locais próprios antes do login — num B recém-instalado,
   não deve aparecer.
5. Tocar "Sincronizar agora" em B (ou aguardar a sincronização automática
   pós-login).
6. **Esperado**: o canal "Teste A" aparece em B, com o mesmo `id`.

## B — Offline, depois reconectar

1. Desligar a rede do Dispositivo A (modo avião).
2. Criar um canal, uma produção e uma tarefa em A.
3. Esperado: tudo continua funcionando normalmente; Ajustes > Sincronização
   mostra "N alterações pendentes".
4. Religar a rede e tocar "Sincronizar agora" (ou aguardar sincronização
   automática).
5. **Esperado**: status volta a "Sincronizado"; os itens criados offline
   aparecem no Dispositivo B após uma sincronização lá.

## C — Edição concorrente do mesmo item (conflito)

1. Em A e B, deixar ambos sincronizados (mesmo estado).
2. Desligar a rede dos dois dispositivos.
3. Em A: renomear o canal "Teste A" para "Editado em A".
4. Em B: renomear o mesmo canal para "Editado em B".
5. Religar a rede de A primeiro, sincronizar — o servidor recebe a versão de A.
6. Religar a rede de B, sincronizar.
7. **Esperado**: o nome final é o que tiver o `updated_at` mais recente
   (o dispositivo que editou por último) — last-write-wins. O outro
   dispositivo não trava nem mostra erro.
8. Verificação de diagnóstico (não há UI dedicada nesta fase): a tabela
   local `sync_conflicts` deve ter uma linha registrando os dois payloads
   (local e remoto) para esse canal — pode ser inspecionada via um
   debugger de banco (ex. abrindo o `.sqlite` com uma ferramenta externa).

## D — Exclusão offline não pode ressuscitar

1. Em A e B sincronizados, com uma tarefa "Tarefa X" visível nos dois.
2. Desligar a rede de B.
3. Em A (online): apagar "Tarefa X", sincronizar — o servidor marca `deleted`.
4. Em B (ainda offline): editar "Tarefa X" (ex. mudar o título).
5. Religar a rede de B e sincronizar.
6. **Esperado**: "Tarefa X" **não reaparece** em nenhum dos dois
   dispositivos — a edição de B em cima de um item já tombstonado no
   servidor não deve trazê-lo de volta à lista (o pull aplica o tombstone
   remoto; o push de B, se ainda pendente, é apenas mais uma atualização
   sobre uma linha que o servidor já marcou `deleted`).

## E — Criar offline, depois conectar pela primeira vez

1. Instalar o app do zero em um dispositivo novo, **sem** fazer login.
2. Criar alguns canais/projetos/produções localmente (ou deixar o seed
   "Rede Baka" popular sozinho).
3. Criar conta (ou entrar numa conta já existente que **nunca logou** neste
   dispositivo antes).
4. **Esperado**: aparece o diálogo "Dados encontrados neste dispositivo"
   com a contagem de cada tipo de entidade.
5. Escolher "Vincular à minha conta".
6. **Esperado**: nenhuma linha é perdida; após a sincronização, todo o
   conteúdo criado antes do login aparece também nos outros dispositivos
   da mesma conta.
7. Repetir o passo 3 escolhendo "Manter apenas local por enquanto" em vez
   de vincular (em uma instalação separada/nova).
8. **Esperado**: os dados locais continuam existindo e editáveis
   normalmente; nada é enviado ao servidor; o diálogo deve voltar a
   aparecer numa próxima sessão autenticada enquanto a vinculação não for
   confirmada.

---

## RLS — isolamento entre contas

Já validado nesta fase com Postgres real (duas contas fake, mesmo
`baka_test`): usuário B não consegue `SELECT` nem `UPDATE` linhas de A em
nenhuma tabela `baka_*`. Para revalidar com um projeto Supabase real:

1. Criar duas contas reais (conta 1 e conta 2), cada uma com seu próprio
   workspace (bootstrap automático via trigger).
2. Pelo painel do Supabase (SQL Editor, autenticado como `service_role` só
   para inspeção) ou por uma chamada direta à API REST autenticada com o
   token da conta 2, tentar ler/alterar uma linha que pertence ao workspace
   da conta 1.
3. **Esperado**: nenhuma linha retornada/alterada — RLS bloqueia mesmo uma
   tentativa direta, fora do app.
