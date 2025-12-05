# Notafacil Installer — Setup & Testing Guide

## ✅ Instalador Gerado

O instalador cliente `Notafacil Setup 0.1.0.exe` foi gerado e está pronto para distribuição e testes.

- **Tamanho**: ~157 MB
- **Localização**: `dist/Notafacil Setup 0.1.0.exe`
- **Tipo**: NSIS (Windows Installer)
- **Conteúdo**: Frontend React + Electron + dependências (sem backend local)

## 🚀 Como instalar

1. Execute o arquivo `Notafacil Setup 0.1.0.exe` em um PDV.
2. Siga o assistente de instalação (choose install location, accept, etc.).
3. O app será instalado em `C:\Program Files` ou local similar.
4. Um atalho será criado no Desktop/Menu.

## ⚙️ Configuração pré-testes

Antes de testar, você precisa:

### 1. Servidor Central
- Garantir que o backend está rodando (Docker Compose ou `node backend/server.js`).
- Backend deve estar acessível na porta `4001`.
- Verificar saúde: `curl http://localhost:4001/` deve retornar `{ "ok": true }`.

### 2. PDV (Cliente)
- Instalar o `Notafacil Setup 0.1.0.exe`.
- Conectar ao servidor via Radmin (ou VPN).
- Obter o **IP/hostname do servidor** que é alcançável pela conexão Radmin.

### 3. Ajustar URL do servidor (IMPORTANTE)
Por padrão, o app tenta conectar a `http://localhost:4001`. Em um PDV remoto, você precisa:

**Opção A**: Usar Radmin com port forwarding (recomendado)
- Abrir Radmin Session e adicionar local port forward: `127.0.0.1:4001 -> <SERVER_IP>:4001`.
- O app conectará automaticamente a `localhost:4001` e será roteado via Radmin.

**Opção B**: Editar `.env.production` no código
- Se você quiser que o app aponte a um IP específico (e.g., `http://192.168.1.100:4001`), edite `.env.production`:
```
VITE_API_URL=http://<SERVER_IP>:4001
```
- Reconstruir o instalador: `npm run dist`.

**Opção C**: Adicionar um campo de configuração no app (futura melhoria)
- Permitir que o usuário configure a URL do servidor na primeira execução (recomendado para produção).

## 🧪 Teste de Funcionalidade

### Teste 1: Conectividade básica
1. Instale e execute o app no PDV.
2. Faça login com credenciais de admin (`admin` / `admin123` ou conforme seu seed).
3. Se login funciona, conectividade está OK.

### Teste 2: Criar nota (online)
1. Na UI, vá para "Novas Notas".
2. Preencha dados (cliente, produtos, etc.) e salve.
3. Verificar que a nota foi salva no servidor: vá para "Notas" e a nota deve aparecer.
4. Verificar que a auditoria foi registrada: vá para "Auditoria" e deve haver um registro de criação de nota.

### Teste 3: Modo offline → online
1. No servidor, **pause o backend** (CTRL+C) ou bloqueie a porta 4001 no firewall.
2. No PDV, crie 5-10 notas. A UI deve:
   - Indicar "Offline" (se houver UI indicator).
   - Mostrar contador de pendências (recomendado: "5 pendentes").
   - As notas devem ser armazenadas no IndexedDB.
3. **Restaure o servidor** (reinicie backend).
4. O SyncService deve detectar a disponibilidade (30s retry interval) e:
   - Enviar todas as notas pendentes.
   - Atualizar o status para "Online".
   - Limpar o contador de pendências.
5. No servidor, verificar:
   - `GET /notes` deve incluir as notas do teste.
   - `GET /audit` deve registrar criação de cada nota com timestamp.

### Teste 4: Múltiplos PDVs
1. Instale o app em 2-3 PDVs.
2. Cada um cria notas online/offline.
3. Verificar que cada PDV sincroniza corretamente e não há conflitos.
4. Verificar que `audit_log` no servidor registra com IP/usuário correto.

## 📋 Checklist de Validação

- [ ] App instala sem erros.
- [ ] App abre e renderiza a UI (login).
- [ ] Login funciona (conectividade com backend).
- [ ] Criar nota online: salva em servidor + auditoria registrada.
- [ ] Modo offline: notas armazenadas em IndexedDB.
- [ ] Transição offline → online: notas sincronizadas, auditoria atualizada.
- [ ] Múltiplos PDVs: sem conflitos, sincronização correta.
- [ ] Timestamps e IP/usuário na auditoria estão corretos.

## 🔧 Troubleshooting

### App não conecta ao servidor
- Verificar se backend está rodando: `curl http://localhost:4001/`.
- Confirmar firewall/Radmin forwarding.
- Verificar URL no `.env.production` ou código do app.

### IndexedDB vazio ou notas não sincronizam
- Abrir DevTools (F12) → Application → IndexedDB.
- Procurar banco `notafacil_offline_db` e store `pending_notes`.
- Se vazio, app conectou ao servidor bem-sucedido (notas foram enviadas).
- Se cheio, SyncService pode estar bloqueado — verificar console logs.

### Problemas com Radmin port forwarding
- Verificar que Radmin session está ativa.
- Testar `Test-NetConnection -ComputerName <SERVER_IP> -Port 4001` no PDV.
- Considerar alternativa: Tailscale/WireGuard para NAT traversal automático.

## 📝 Próximos Passos

1. **Distribuir** o instalador para PDVs teste.
2. **Executar** a série de testes acima.
3. **Coletar logs** (console do app, backend logs) para diagnóstico.
4. **Refinar** URL do servidor (Opção C: field de config na primeira execução).
5. **Documentar** resultados e issues.
6. **Migrar** para Tailscale/WireGuard se Radmin mostrar problemas.

---

Guia preparado automaticamente. Para dúvidas ou ajustes, entre em contato com o time de desenvolvimento.