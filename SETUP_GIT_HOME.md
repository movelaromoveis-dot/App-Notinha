# 🚀 Guia de Setup Git - Trabalho Simultâneo (Casa ↔ Loja)

**Status:** ✅ Repositório já inicializado e configurado na loja. Agora configure seu PC em casa.

---

## 📋 Pré-requisitos no seu PC em casa

- Git instalado: https://git-scm.com/download/win (durante instalação, selecione OpenSSH)
- Node.js v18+: https://nodejs.org/
- Docker Desktop (se quiser rodar com containers): https://www.docker.com/products/docker-desktop/

---

## 1️⃣ Gerar e adicionar SSH Key ao GitHub

### Passo 1: Gerar chave SSH

Abra PowerShell e execute:

```powershell
ssh-keygen -t ed25519 -C "seu-email@example.com"
```

Quando solicitado:
- **File location:** pressione ENTER para usar padrão (`~/.ssh/id_ed25519`)
- **Passphrase:** (opcional) deixe em branco ou crie uma senha para a chave

Isso gera 2 arquivos:
- `~/.ssh/id_ed25519` (PRIVADA - nunca compartilhe)
- `~/.ssh/id_ed25519.pub` (PÚBLICA - vamos adicionar ao GitHub)

### Passo 2: Copiar chave pública

```powershell
Get-Content ~/.ssh/id_ed25519.pub | Set-Clipboard
```

A chave foi copiada para a área de transferência.

### Passo 3: Adicionar chave ao GitHub

1. Acesse: https://github.com/settings/keys
2. Clique em "New SSH key"
3. **Title:** coloque algo como "PC Casa - Notafacil"
4. **Key type:** selecione "Authentication Key"
5. **Key:** Cole a chave copiada (Ctrl+V)
6. Clique em "Add SSH key"

✅ Pronto! Sua chave foi adicionada.

---

## 2️⃣ Configurar Git Globalmente

```powershell
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@example.com"
```

Exemplo:
```powershell
git config --global user.name "João Dev"
git config --global user.email "joao@movelaromoveis.com"
```

---

## 3️⃣ Clonar o repositório em casa

Escolha um local onde deseja guardar o projeto (exemplo: `C:\Dev\`):

```powershell
cd C:\Dev
git clone git@github.com:movelaromoveis-dot/App-Notinha.git
cd App-Notinha
```

✅ Repositório clonado com sucesso!

---

## 4️⃣ Instalar dependências

### Frontend + Backend

```powershell
# Instalar dependências do frontend/root
npm install

# Instalar dependências do backend
cd backend
npm install
cd ..
```

### Banco de dados (Docker Compose)

Se você tem Docker Desktop instalado, rode:

```powershell
docker-compose up -d
```

Isso inicia:
- PostgreSQL na porta 5555
- Backend Node.js na porta 4001
- Frontend Vite na porta 5173

Se preferir rodar sem Docker, configure um PostgreSQL localmente e atualize `backend/.env` com as credenciais.

---

## 5️⃣ Configurar variáveis de ambiente

### Backend

```powershell
cd backend
cp .env.example .env
```

Edite `backend/.env` com suas credenciais locais (ou use os padrões do Docker Compose):

```
PORT=4000
DB_HOST=localhost  # ou "db" se usar Docker
DB_PORT=5432       # ou 5555 se usar Docker
DB_USER=postgres
DB_PASS=MovelaroApp
DB_NAME=notafacil
JWT_SECRET=sua_chave_super_secreta
JWT_EXPIRES=8h
```

---

## 6️⃣ Executar o projeto

### Opção A: Com Docker Compose (recomendado)

```powershell
docker-compose up -d
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4001
- Banco: localhost:5555

### Opção B: Executar localmente

Terminal 1 - Backend:
```powershell
cd backend
npm start
```

Terminal 2 - Frontend:
```powershell
npm run dev:web
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

---

## 7️⃣ Workflow diário: sincronizar com a loja

### Para trazer atualizações da loja para casa:

```powershell
git pull origin main
npm install  # se novas dependências foram adicionadas
```

### Para enviar suas mudanças da casa para a loja:

#### 1. Criar branch para sua feature

```powershell
git checkout -b feat/nome-da-feature
# Exemplo:
git checkout -b feat/melhorar-auditoria
```

#### 2. Fazer mudanças e commitar

```powershell
# Ver status
git status

# Adicionar arquivos específicos ou todos
git add .

# Commitar com mensagem descritiva
git commit -m "feat: descrição do que foi feito"
# Exemplo:
git commit -m "feat: add filters to audit page"
```

#### 3. Fazer push do branch

```powershell
git push -u origin feat/nome-da-feature
```

#### 4. Abrir Pull Request no GitHub (opcional mas recomendado)

1. Acesse: https://github.com/movelaromoveis-dot/App-Notinha
2. Você verá um botão "Compare & pull request" com seu branch
3. Clique, revise as mudanças e crie o PR
4. Você (ou alguém) revisa e faz merge em `main`

#### 5. Na loja: trazer as mudanças

```powershell
git pull origin main
```

---

## 8️⃣ Boas práticas

### ✅ Faça:

- **Commitar frequentemente** com mensagens claras:
  - `feat: add new feature` (nova funcionalidade)
  - `fix: resolve bug in auth` (correção)
  - `docs: update README` (documentação)
  - `refactor: improve code` (refatoração)

- **Criar branches** para cada feature/fix:
  ```
  git checkout -b feat/sua-feature
  git checkout -b fix/seu-bug
  ```

- **Fazer pull antes de trabalhar** para não perder atualizações da loja:
  ```powershell
  git pull origin main
  ```

- **Proteger dados sensíveis:**
  - Nunca commite `.env` (já está no `.gitignore`)
  - Use `.env.example` como referência

### ❌ Não faça:

- ❌ Não commite `node_modules/` (está no `.gitignore`)
- ❌ Não commite `db_data/` ou arquivos de banco (está no `.gitignore`)
- ❌ Não faça push direto em `main` sem PR (combine com merge local se tiver pressa)
- ❌ Não use `git push -f` (força) sem ter certeza

---

## 🐛 Troubleshooting

### Erro: "Permission denied (publickey)"

**Causa:** Git não está encontrando sua SSH key.

**Solução:**

```powershell
# Iniciar SSH agent
Start-Service ssh-agent

# Adicionar sua chave ao agent
ssh-add ~/.ssh/id_ed25519

# Testar conexão
ssh -T git@github.com
```

Você deve ver: `Hi movelaromoveis-dot! You've successfully authenticated...`

### Erro: "origin already exists"

**Causa:** Remote `origin` já foi configurado.

**Solução:**

```powershell
git remote -v  # listar remotes
git remote remove origin  # remover
git remote add origin git@github.com:movelaromoveis-dot/App-Notinha.git  # readicionar
```

### Merge conflicts

Se você e o PC da loja editarem o mesmo arquivo:

```powershell
git pull origin main  # traz conflitos
# Edite os arquivos com marcadores <<<, ===, >>>
git add .
git commit -m "resolve merge conflicts"
git push
```

---

## 📞 Referências rápidas

| Comando | O que faz |
|---------|-----------|
| `git status` | Ver status do repositório |
| `git log --oneline -5` | Ver últimos 5 commits |
| `git diff` | Ver mudanças não staged |
| `git add .` | Preparar todos os arquivos para commit |
| `git commit -m "msg"` | Commitar com mensagem |
| `git push` | Enviar commits para GitHub |
| `git pull` | Trazer commits do GitHub |
| `git checkout -b nome` | Criar novo branch |
| `git checkout main` | Mudar para branch main |
| `git branch` | Listar branches locais |
| `git merge nome-branch` | Fazer merge de um branch |

---

## ✅ Checklist Final

- [ ] SSH key gerada e adicionada ao GitHub
- [ ] Git configurado com seu nome/email
- [ ] Repositório clonado em casa
- [ ] `npm install` executado (frontend + backend)
- [ ] Docker Compose rodando (ou DB local configurado)
- [ ] Frontend acessível em http://localhost:5173
- [ ] Backend respondendo em http://localhost:4001
- [ ] Login funcionando com admin/admin123
- [ ] Primeira mudança feita em um branch: `git push -u origin feat/test`

---

## 🎉 Agora você pode trabalhar sincronizado!

Qualquer dúvida, consulte este guia ou execute:
```powershell
git --help  # documentação geral
git <comando> --help  # ajuda para comando específico
```

Boa sorte! 🚀
