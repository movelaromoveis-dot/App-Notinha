# Radmin Quickstart for Notafacil

Este guia rápido descreve como usar o Radmin para conectar PDVs ao servidor Notafacil durante a fase de testes/homologação.

IMPORTANTE: Radmin é aceitável para testes rápidos se sua equipe já o utiliza, mas para produção recomendo migrar para Tailscale/WireGuard.

## Objetivo
- Permitir que PDVs acessem o backend que está rodando na máquina central via Radmin.
- Testar o fluxo offline → online (IndexedDB + SyncService) enquanto a conexão é intermitente.

## Pré-requisitos (servidor central)
- Máquina Windows com backend rodando (Docker Compose ou `node backend/server.js`).
- Radmin Server ou Radmin Viewer configurado conforme a política da empresa.
- Porta do backend (padrão `4001`) liberada no firewall local, ou encaminhada corretamente pelo Radmin.

## Passos — Servidor central
1. Verifique que o backend está rodando localmente:
```powershell
# no servidor
curl http://localhost:4001/
```
Deverá retornar algo como `{ "ok": true, "msg": "API Notafacil rodando" }`.

2. Confirme que a porta 4001 está aberta no Firewall do Windows:
```powershell
# no servidor
Test-NetConnection -ComputerName localhost -Port 4001
```

3. Caso use Radmin Server, certifique-se de que o host aparece e que você consegue encaminhar tráfego para a porta 4001 através da sessão remota.

## Passos — PDV (cliente)
1. Instale o Radmin Viewer/Client e conecte-se ao servidor central (ou ao host que permita encaminhar tráfego).
2. Obtenha o IP/endpoint que o Radmin fornece para o servidor (ou use o IP local do servidor se a rede permitir).
3. No PDV, teste conectividade ao backend:
```powershell
curl http://<SERVER_IP>:4001/
Test-NetConnection -ComputerName <SERVER_IP> -Port 4001
```
4. Execute o app (por enquanto em modo dev ou com o instalador quando disponível). Crie algumas notas e verifique o comportamento:
- Com backend disponível: notas devem ser enviadas imediatamente.
- Sem backend (ou com conexão interrompida): notas devem ficar pendentes no IndexedDB e o contador na UI deve aumentar.

## Simulação de perda e restauração
1. No servidor: pare o backend (`CTRL+C` se rodando em terminal) ou bloqueie a porta 4001 temporariamente.
2. No PDV: crie 5–10 notas; verifique no DevTools (Application → IndexedDB) que existem registros pendentes.
3. Restaure o backend / reconecte via Radmin. O SyncService no cliente deve detectar a disponibilidade e enviar as notas.
4. No servidor: verificar `GET /audit` e `GET /notes` para confirmar gravações e auditoria.

## Comandos úteis
```powershell
# testar saúde
curl http://<SERVER_IP>:4001/
# testar porta
Test-NetConnection -ComputerName <SERVER_IP> -Port 4001
# ver IndexedDB no console do app (DevTools)
indexedDB.databases().then(dbs => console.log(dbs))
```

## Riscos e recomendações
- Radmin pode expor portas e depende de agentes; use contas e ACLs restritas.
- Para produção, priorize Tailscale (mais fácil) ou WireGuard (self-hosted) para maior confiabilidade e menos manutenção.

---
Guia gerado automaticamente pelo time de desenvolvimento. Se desejar, eu posso complementar com screenshots ou um roteiro passo-a-passo para um PDV específico.