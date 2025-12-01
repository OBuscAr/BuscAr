# BuscAr 🌱

Sistema web para análise das linhas de ônibus de São Paulo em relação à emissão de poluentes, usando a API Olho Vivo (SPTrans).  

## 🚀 Objetivo
- Avaliar as rotas de ônibus de São Paulo com base em suas emissões de poluentes e velocidade média.
- Conscientizar cidadãos e ativistas sobre a qualidade do ar.
- Apoiar urbanistas e tomadores de decisão no planejamento sustentável.

## 👥 Equipe
- Ana Lívia Rüegger Saldanha  (arquitetura)
- Be Zilberman (arquitetura)
- Diego Hurtado de Mendoza  (backend)
- Giovanna Hirata (frontend)
- Gustavo Mota Bastos (frontend)
- Naili Marques (backend)

## 📌 Tecnologias
- **Frontend:** a definir  
- **Backend:** Python 3.11
- **Banco de Dados:** PostgreSQL  
- **API:** SPTrans Olho Vivo + MyClimate API
- **Gestão do Projeto:** Scrum + ClickUp + GitHub Issues  

## 📂 Organização do Repositório
- `/frontend` → códido do frontend 
- `/backend` → código do backend
- `/docs` → documentação do projeto (mapas de empatia, backlog, relatórios)  

## Banco de Dados (PostgreSQL)
1. Instale PostgreSQL
2. Crie o usuário e o banco:
   - user: buscar_user
   - senha: buscar123
   - banco: buscar_db
3. No backend/app/core/database.py, atualize DATABASE_URL se necessário:
   postgresql://buscar_user:buscar123@localhost:5432/buscar_db


## 🛠️ Como rodar o projeto (quando implementado)

### Backend
1. Entre na pasta de backend.
```bash
    cd backend
```

2. Instale Python 3.11. Pode utilizar [pyenv](https://github.com/pyenv/pyenv) para escolher a versão 3.11 de Python.

3. Crie um ambiente virtual e ative-o.
```bash
    python -m venv .venv
    source .venv/bin/activate
```

4. Instale as dependências do repositório.
```bash
    make init
```

5. Instale [PostgreSQL](https://www.postgresql.org/download/).

6. Crie um usuário em Postgres. Exemplo:
- Username: buscar_user
- Password: buscar123

```bash
    sudo -u postgres createuser -P -d buscar_user
```

7. Crie a base de dados `buscar_db`.
```bash
    sudo -u postgres createdb -h localhost -p 5432 -U buscar_user buscar_db
```

8. Preencha o arquivo `.env`. Os valores que faltarem podem ser solicitados a um membro do grupo. Para a variável `DATABASE_URL`, lembre-se de usar os dados do usuário e o nome do banco de dados que você criou nas duas etapas anteriores.

9. Crie as tabelas no banco de dados.
```bash
    make create-database-tables
```

10. Popule o banco de dados.
```bash
    make populate-database
```

11. Para levantar o servidor backend, você pode usar este comando:
```bash
    make run
```
 
12. Para preencher os dados de emissões de carbono diárias de cada linha, em um terminal separado execute o seguinte comando (e deixe-o rodando indefinidamente para que atualize os dados em tempo real):
```bash
    make update-daily-line-statistics
```
