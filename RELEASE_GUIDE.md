# Release Publishing Guide

## Visão Geral

O script `publish-release.ps1` automatiza o processo completo de publicação de uma nova versão do Notafacil:

1. ✅ Verifica git status (sem commits pendentes)
2. 📝 Atualiza `package.json` com nova versão
3. 🏗️  Compila frontend (Vite)
4. 📦 Gera instalador Windows (electron-builder)
5. 🏷️  Cria git tag
6. 🚀 Faz push para GitHub
7. 📋 Instruções para criar release no GitHub

## Pré-requisitos

- PowerShell 5.0+ (Windows)
- Git instalado e configurado
- Node.js com npm
- GitHub CLI (opcional, mas recomendado para automação completa)

## Como usar

### Opção 1: Uso básico

```powershell
cd c:\Users\user\Desktop\Notafacil\notafacil-app
.\publish-release.ps1 -Version "0.3.0"
```

### Opção 2: Com notas de release customizadas

```powershell
.\publish-release.ps1 -Version "0.3.0" -ReleaseNotes "Fixed offline sync, improved UI"
```

### Opção 3: Com GitHub CLI (totalmente automatizado)

```powershell
.\publish-release.ps1 -Version "0.3.0" -UseGithubCli
```

## Fluxo Detalhado

### Fase 1: Preparação
1. Script verifica se há mudanças não commitadas.
2. Se houver, pede para fazer commit primeiro.

### Fase 2: Build
1. Atualiza versão em `package.json`.
2. Faz commit (`chore: bump version to X.X.X`).
3. Compila frontend com Vite.
4. Gera instalador NSIS com electron-builder.

### Fase 3: Git & GitHub
1. Cria tag `vX.X.X`.
2. Faz push para `main` e para a tag.
3. Exibe instruções para criar release no GitHub (ou cria automaticamente se usar `-UseGithubCli`).

### Fase 4: Resultado
- Novo instalador pronto: `dist/Notafacil Setup X.X.X.exe`
- Blockmap para delta updates: `dist/Notafacil Setup X.X.X.exe.blockmap`
- Tag no GitHub: `vX.X.X`
- Código pusheado para `main`

## Exemplo Prático

```powershell
# 1. Faz mudanças no código
# ... edita arquivos, testa localmente ...

# 2. Commit local
git add .
git commit -m "feat: add new feature X and fix bug Y"

# 3. Publica nova versão
.\publish-release.ps1 -Version "0.3.0" -ReleaseNotes "Added feature X, fixed bug Y"

# 4. Script faz todo o trabalho. Quando terminar:
#    - Vai para https://github.com/movelaromoveis-dot/App-Notinha/releases
#    - Clica "Create a new release"
#    - Seleciona v0.3.0 (já está pushado)
#    - Preenche título/descrição/attach files
#    - Clica "Publish"

# 5. PDVs com v0.2.0 abrirão o app e verão notificação de atualização!
```

## Troubleshooting

### Erro: "Uncommitted changes found"
- Solução: `git add . && git commit -m "seu-mensagem"`

### Erro: "Tag already exists"
- Solução: A tag `vX.X.X` já foi criada antes. Delete a tag local:
```powershell
git tag -d vX.X.X
git push origin --delete vX.X.X
# Então tente novamente
```

### Erro: "Frontend build failed"
- Solução: Verifique se há erros TypeScript/JSX:
```powershell
npm run build:web
# Corrija os erros e tente novamente
```

### Erro: "Installer not found"
- Solução: electron-builder falhou. Verifique:
```powershell
npx electron-builder --win --config.npmRebuild=false
# Procure por erros na saída
```

### Erro: "Git push failed"
- Solução: Pode ser permissão SSH/HTTPS. Teste:
```powershell
git push origin main
# Se usar HTTPS, pode precisar de Personal Access Token
```

## Usando GitHub CLI para Automação Completa

Se quiser que o script também crie a release automaticamente, instale GitHub CLI:

```powershell
# Instalar
winget install --id=GitHub.cli

# Autenticar
gh auth login

# Usar script com -UseGithubCli
.\publish-release.ps1 -Version "0.3.0" -UseGithubCli
```

## Próximos Passos

1. Faça mudanças no código.
2. Commit e teste localmente.
3. Execute `.\publish-release.ps1 -Version "X.X.X"`.
4. Crie release no GitHub (ou use CLI).
5. PDVs recebem notificação de atualização automaticamente!

## Dicas

- **Versionamento**: Siga [Semantic Versioning](https://semver.org) (MAJOR.MINOR.PATCH)
- **Notas de Release**: Sempre descreva mudanças importantes (features, fixes, breaking changes)
- **Delta Updates**: electron-updater automaticamente usa `.blockmap` para baixar apenas mudanças (muito mais rápido)
- **Rollback**: Se uma versão tiver bugs, você pode sempre liberar uma nova versão fix (e.g., 0.3.1)

---

Documentação gerada automaticamente. Para ajustes ou dúvidas, consulte o time de desenvolvimento.