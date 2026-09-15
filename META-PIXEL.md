# Integração Meta — Grupo Bilitex

O projeto usa React/Vite e funções Node na Vercel. `scoretrack@1.0.0` vem do registry público npmjs; a dependência existente `@jussimirvfx/cnpj-cascade` continua exigindo `NPM_TOKEN` com `read:packages` no GitHub Packages.

## Configuração

- Navegador: `VITE_META_PIXEL_ID=2080143396195017`.
- Servidor: `META_PIXEL_ID=2080143396195017` e `META_API_ACCESS_TOKEN`.
- Local/preview: `META_TEST_EVENT_CODE` opcional e `META_DRY_RUN=true` para não enviar conversões à Meta.
- Produção: `META_DRY_RUN=false`; código de teste omitido automaticamente. Não adicionar o token a variáveis `VITE_` ou `NEXT_PUBLIC_`.

O arquivo `.env.local` é ignorado pelo Git. Configure os valores separadamente no painel da Vercel antes do deploy. O dry-run protege a API de conversões; o Pixel no navegador continua enviando eventos. Para testes sintéticos de interface, intercepte também as requisições do Pixel.

## Comportamento

O provider do pacote inicializa o Pixel e envia PageView. O componente `MetaPixel` foi omitido porque esta versão também envia PageView, duplicando o evento do provider. O pacote exige `ACCESS_TOKEN` no cliente; usamos o marcador não secreto `server-managed`. O token real fica na rota `/api/meta/conversions`. Se a rota ficar indisponível, o fallback direto do pacote falhará com esse marcador; ele nunca recebe a credencial real.

`MetaScrollTracking` usa `trackCustomEvent` do pacote para enviar `Scroll` nos marcos 0, 25, 50, 75 e 100, com `scroll_depth` no Pixel e na CAPI. O marco 0 ocorre na inicialização; os demais seguem a distância rolável. Cada marco dispara uma vez por carregamento, inclusive em StrictMode e em saltos diretos ao rodapé.

Depois que `/api/leads` confirma a entrega, o formulário chama `trackLead`, e chama `trackLeadQualificado` somente para `scoring.qualified === true`. Pontuação, valor, cidade, estado e regras vêm da resposta existente do servidor. Falhas de tracking não desfazem a entrega do cadastro. O pacote compartilha `event_id` entre Pixel e CAPI para deduplicação.

A rota registra backup antes da chamada externa, aceita os cinco modos de dry-run pedidos, preserva hashes existentes, completa IP e user-agent no servidor, limita a espera da Meta a 8 segundos e retorna 202 em falhas com logs recuperáveis sem token. HTTP 202 significa recebido localmente, não entrega confirmada pela Meta.

## Validação local

Em 15/09/2026, o pacote CNPJ foi restaurado localmente a partir do repositório oficial `https://github.com/jussimirvfx/vfx-cnpj-cascade`, commit `eb20cdabd801a8c740b569e8fe4a65bb152bb836`, versão `0.1.1`. O código foi empacotado com `npm pack` e instalado com `--no-save --package-lock=false --ignore-scripts`, preservando a dependência de produção. Após essa instalação, passaram os 32 testes, o typecheck e o build; a página e a rejeição de CNPJ inválido foram conferidas no navegador. O build apresenta avisos de tamanho do bundle e uso de `eval` dentro de `scoretrack`.

Uma instalação limpa via GitHub Packages ainda exige `NPM_TOKEN` com `read:packages`; a recuperação local pelo código-fonte não corrige essa permissão. A consulta cadastral e a entrega real ao webhook/Meta não foram verificadas por esse teste de renderização.

```powershell
npm.cmd install --registry=https://registry.npmjs.org
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

O Vite atende a nova rota de conversões localmente. As demais funções existentes, incluindo `/api/leads`, continuam dependendo do ambiente serverless para teste integrado completo.

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/meta/conversions -ContentType application/json -Headers @{ 'X-VFX-Dry-Run' = 'true' } -Body '{"event_name":"Lead","event_id":"synthetic-smoke","custom_data":{"lead_score":100}}'
```

O gate `scripts/lp-production-observability-check.sh` citado no pedido não existe neste repositório. Executá-lo no ambiente operacional que o disponibiliza, com o projeto e domínio de produção confirmados. Sem esse gate e verificação no Gerenciador de Eventos, a publicação não está validada.
