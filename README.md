# Minha Gameteca - Arquitetura de Microsserviços

Este projeto consiste em uma plataforma distribuída de coleção de jogos desenvolvida como atividade prática para demonstrar a transição de um sistema monolítico para uma arquitetura de microsserviços resiliente e escalável. 

O sistema foi construído utilizando Node.js, Express, TypeScript, bancos de dados PostgreSQL isolados em containers (Docker) e uma interface de gerenciamento moderna em React.

---

## Como Executar o Projeto Localmente

Certifique-se de ter o **Node.js** e o **Docker / Docker Compose** instalados em sua máquina de desenvolvimento.

### 1. Subindo a Infraestrutura de Banco de Dados
Na pasta raiz do projeto (`minha-gameteca`), execute o comando abaixo para iniciar os 3 bancos de dados PostgreSQL de forma totalmente isolada em segundo plano:
docker-compose up -d

### 2. Inicializando os Microsserviços do Backend
Abra 3 terminais distintos. Em cada um deles, navegue até a pasta correspondente ao microsserviço, instale as dependências e inicie o servidor em modo de desenvolvimento:

Terminal 1 (catalogo-service - Porta 3001):
```
cd catalogo-service
npm install
npm run dev
```
Terminal 2 (usuarios-service - Porta 3002):
```
cd usuarios-service
npm install
npm run dev
```
Terminal 3 (biblioteca-service - Porta 3000):
```
cd biblioteca-service
npm install
npm run dev
```
### 3. Inicializando o Cliente Frontend (Bônus 5)
Abra um 4º terminal, navegue até a pasta do frontend, instale os pacotes necessários e starte o servidor de desenvolvimento do Vite:
```
cd frontend
npm install
npm run dev
```
Após inicializar, acesse o painel pelo endereço informado no terminal (geralmente http://localhost:5173).

Exemplos de Chamadas da API (Endpoints)
Catálogo Service (Porta 3001)
GET /jogos: Retorna a lista de jogos cadastrados no banco.

GET /jogos/:id: Busca detalhes de um jogo por ID.

POST /jogos: Cadastra um novo jogo no catálogo.

Body JSON: { "titulo": "Celeste", "plataforma": "PC", "genero": "Plataforma" }

DELETE /jogos/:id: Remove um jogo por ID.

Usuários Service (Porta 3002)
GET /usuarios: Retorna a listagem de usuários do sistema.

GET /usuarios/:id: Busca dados de um usuário específico.

POST /usuarios: Cadastra um novo usuário.

Body JSON: { "nome": "Gabriel", "email": "gabriel@email.com" }

Biblioteca Service (Porta 3000)
POST /biblioteca: Vincula um jogo existente à conta de um usuário.

Body JSON: { "usuarioId": 1, "jogoId": 3 }

GET /biblioteca/:usuarioId: Compoem a resposta final agregando dados de múltiplos microsserviços via chamadas HTTP concorrentes.

Reflexão Teórica Obrigatória
1. Resiliência do Sistema (Queda de Serviços)
O biblioteca-service funciona como um agregador de dados e não possui acesso direto aos bancos de dados de catálogo ou de usuários. Ele depende estritamente de requisições HTTP síncronas (service-to-service) para compor a resposta final ao cliente. Caso o catalogo-service ou o usuarios-service fiquem indisponíveis, a requisição interna falhará com um erro de conexão (ECONNREFUSED). Para mitigar esse comportamento nocivo, implementamos o Bônus 1: o sistema captura a falha de comunicação de forma defensiva e retorna imediatamente um status HTTP 503 (Service Unavailable) com uma mensagem explicativa transparente, evitando o travamento (crash) do serviço agregador.

2. Vantagens da Separação em Microsserviços
A grande vantagem em detrimento a uma aplicação monolítica reside no desacoplamento lógico e estrutural. Cada microsserviço gerencia seu próprio domínio, possui seu ciclo de vida independente e escala de forma isolada (podemos alocar mais recursos de hardware apenas para o catálogo caso haja picos de acessos a jogos, sem afetar o serviço de usuários). Além disso, aplicamos com rigor o padrão Database per Service (Bônus 4): cada microsserviço interage puramente com sua respectiva base de dados PostgreSQL. Isso garante o isolamento de falhas, impossibilitando que um erro crítico ou corrupção na base de usuários impacte as tabelas do catálogo de jogos.

3. Novos Desafios da Arquitetura Distribuída
Em contrapartida, a arquitetura introduz uma complexidade operacional considerável. Problemas inexistentes em monolitos passam a ser rotina, tais como: latência de rede introduzida por requisições internas em cascata, necessidade de tratamento rigoroso de falhas parciais (falta de resiliência), e a perda da capacidade de realizar operações simples de banco de dados, como um JOIN SQL clássico entre tabelas de bancos distintos. A consistência de dados eventual e o rastreamento (tracing) de requisições distribuídas demandam maior maturidade técnica da equipe e infraestrutura de observabilidade robusta.