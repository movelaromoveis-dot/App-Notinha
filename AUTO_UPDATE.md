# Auto-Update System — Notafacil

## Overview

O Notafacil agora possui um sistema de **auto-atualização automática** baseado em `electron-updater` e GitHub Releases.

### Como funciona

1. **Ao iniciar o app**, `electron-updater` verifica se há uma nova versão no GitHub Releases.
2. **Se disponível**, a nova versão é baixada em background (delta updates — só as mudanças).
3. **Quando pronta**, o app notifica o usuário com um popup no canto superior direito.
4. **O usuário clica "Instalar Agora"**, a app reinicia e a nova versão é instalada.

## Versionamento e Release

### Versão atual: 0.2.0

Para **liberar uma nova versão**:

### Passo 1: Atualizar versão no `package.json`
```bash
# Edite package.json e mude "version" para a versão desejada
# Exemplo: "0.3.0"
```

### Passo 2: Fazer commit e tag no Git
```bash
cd c:\Users\user\Desktop\Notafacil\notafacil-app
git add package.json (e outros arquivos alterados)
git commit -m "feat: add new feature X (v0.3.0)"
git tag -a v0.3.0 -m "Release v0.3.0"
git push origin main
git push origin v0.3.0
```

### Passo 3: Build o instalador
```bash
npm run build:web
npx electron-builder --win --publish=never
```

Isso gera:
- `dist/Notafacil Setup 0.3.0.exe` (instalador)
- `dist/Notafacil Setup 0.3.0.exe.blockmap` (diff para updates)

### Passo 4: Publicar release no GitHub
1. Vá para https://github.com/movelaromoveis-dot/App-Notinha/releases
2. Clique em "Create a new release"
3. Preencha:
   - **Tag version**: `v0.3.0` (deve corresponder ao `package.json`)
   - **Release title**: "Notafacil v0.3.0"
   - **Description**: Listar mudanças (ex: "Fixed offline sync, added update feature")
   - **Attach binaries**: Faça upload dos arquivos:
     - `dist/Notafacil Setup 0.3.0.exe`
     - `dist/Notafacil Setup 0.3.0.exe.blockmap`
4. Clique em "Publish release"

### Passo 5: Clientes veem a atualização
- PDVs com v0.2.0 abrirão o app e verão notificação de atualização.
- Baixarão apenas os arquivos diferentes (~10-50 MB em vez de 157 MB).
- Ao clicar "Instalar Agora", o app reinicia com v0.3.0.

## Configuração Técnica

### electron-updater

A configuração no `package.json` aponta para GitHub Releases:
```json
"publish": [
  {
    "provider": "github",
    "owner": "movelaromoveis-dot",
    "repo": "App-Notinha"
  }
]
```

O `electron-updater` automaticamente:
- Verifica releases em `https://github.com/movelaromoveis-dot/App-Notinha/releases`
- Compara versão do app com a versão mais recente.
- Se houver `.blockmap`, usa delta updates (rápido).

### Arquivos críticos para update

- `electron/main.js`: IPC handlers para update (install-update, event listeners)
- `src/components/UpdateNotifier.jsx`: UI que notifica o usuário
- `package.json`: versão e config de publish

## Testes

### Teste local (dev mode)
```bash
npm run dev:electron
# Isso não verificará updates (electron-updater só funciona em packaged apps)
```

### Teste packaged
1. Gere v0.1.0 (já feito): `npm run dist`
2. Instale `dist/Notafacil Setup 0.1.0.exe` em uma VM/máquina teste.
3. Atualize `package.json` para v0.2.0.
4. Gere novo instalador: `npm run dist`
5. Publique release v0.2.0 no GitHub com os binários.
6. Na máquina com v0.1.0, abra o app — deve ver notificação de atualização.
7. Clique "Instalar Agora" e verifique que é instalado v0.2.0.

## Troubleshooting

### Update não aparece
- Verificar se GitHub release foi publicado com tag correta (`v0.X.X`).
- Verificar se `.blockmap` foi uploadado (necessário para delta updates).
- Ver console do app (DevTools) para erros de electron-updater.

### Install fica preso
- Verificar se o instalador NSIS é válido: `Notafacil Setup X.X.X.exe`.
- Testar executar o `.exe` manualmente.

### Mudar release channel
Se quiser testes beta (pré-release):
1. Use tag diferente (ex: `v0.2.0-beta.1`)
2. Marque a release no GitHub como "Pre-release"
3. electron-updater respeitará isso (só recomenda final releases)

## Futura melhoria (roadmap)

- [ ] Permitir download/install de updates sem reiniciar app (hot updates da UI).
- [ ] Mostrar mudanças/release notes antes de instalar.
- [ ] Adicionar retry automático se install falhar.
- [ ] Suporte a rollback (desinstalar update anterior se novo falhar).

---

Documentação gerada automaticamente. Para dúvidas ou ajustes, consulte o time de desenvolvimento.