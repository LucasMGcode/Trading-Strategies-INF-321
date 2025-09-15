# Sistema de Estratégias de Opções

## Proposta do Projeto

Este projeto visa desenvolver um sistema web abrangente para **análise, simulação e aprendizado de estratégias de opções financeiras**, com base nos princípios e estratégias detalhadas no livro "The Bible of Options Strategies" de Guy Cohen.

Nosso objetivo é criar uma ferramenta intuitiva e poderosa que capacite tanto investidores iniciantes quanto experientes a explorar, entender e simular o desempenho de diversas estratégias de opções em diferentes cenários de mercado.

## Ideia Central

A ideia central é democratizar o acesso ao conhecimento sobre opções, transformando conceitos complexos em funcionalidades práticas e visuais. O software permitirá aos usuários:

1.  **Explorar um Catálogo de Estratégias:** Filtrar e pesquisar estratégias de opções por nível de experiência, perspectiva de mercado (alta, baixa, neutra) e perfil de risco/retorno.
2.  **Simular Desempenho:** Testar o resultado de estratégias com dados históricos de ativos, visualizando o lucro/prejuízo potencial e métricas de performance.
3.  **Visualizar Perfis de Risco:** Entender graficamente o perfil de risco e retorno de cada estratégia, incluindo pontos de equilíbrio e impacto dos "Greeks" (Delta, Gamma, Theta, Vega, Rho).

## 🛠️ Stack Tecnológica (MVP)

-   **Backend:** Node.js (Nest.js, TypeScript)
-   **Frontend:** React (TypeScript, Material-UI)
-   **Banco de Dados:** PostgreSQL
-   **Dados de Mercado:** Integração com APIs de dados históricos (ex: Yahoo Finance)

## 📈 Funcionalidades do MVP

-   Autenticação e gerenciamento de usuários.
-   Catálogo de estratégias com filtros avançados.
-   Simulador básico de estratégias com dados históricos.
-   Visualização de resultados de simulação.
-   Dashboard pessoal para acompanhar simulações.

Este projeto não apenas serve como uma ferramenta educacional e analítica, mas também demonstra a aplicação de tecnologias web modernas e boas práticas de desenvolvimento de software.

## Diagrama de Casos de Uso (MVP)

Para representar as principais interações do usuário com o sistema, elaboramos o seguinte **diagrama de casos de uso**.  
Ele mostra as funcionalidades disponíveis para **usuários autenticados** e **não autenticados**, bem como a relação entre os diferentes módulos do sistema (autenticação, perfil, catálogo de estratégias, dashboard e simulações):

```mermaid
graph TD
    actor_unauth[Usuário Não Autenticado]
    actor_auth[Usuário Autenticado]

    subgraph Autenticação
        uc_view_landing_page(Visualizar Página Inicial)
        uc_register(Registrar Conta)
        uc_login(Fazer Login)
        uc_logout(Fazer Logout)
    end

    subgraph GerenciamentoDePerfil
        uc_view_profile(Visualizar Perfil)
        uc_edit_profile(Editar Perfil)
    end

    subgraph Dashboard
        uc_view_dashboard(Visualizar Dashboard)
    end

    subgraph CatálogoDeEstrategias
        uc_view_strategies(Visualizar Estratégias)
        uc_filter_strategies(Filtrar Estratégias)
        uc_search_strategies(Pesquisar Estratégias)
        uc_view_strategy_details(Ver Detalhes da Estratégia)
    end

    subgraph Simulações
        uc_view_simulations(Visualizar Simulações)
        uc_create_simulation(Criar Nova Simulação)
        uc_view_simulation_details(Ver Detalhes da Simulação)
        uc_delete_simulation(Excluir Simulação)
    end

    actor_unauth --> uc_view_landing_page
    actor_unauth --> uc_register
    actor_unauth --> uc_login

    uc_login --> uc_view_dashboard

    actor_auth --> uc_logout
    actor_auth --> uc_view_dashboard
    actor_auth --> uc_view_profile
    actor_auth --> uc_edit_profile
    actor_auth --> uc_view_strategies
    actor_auth --> uc_view_simulations
    actor_auth --> uc_create_simulation

    uc_view_strategies --> uc_filter_strategies
    uc_view_strategies --> uc_search_strategies
    uc_view_strategies --> uc_view_strategy_details

    uc_view_simulations --> uc_view_simulation_details
    uc_view_simulations --> uc_delete_simulation

    uc_view_strategy_details --> uc_create_simulation
    uc_view_dashboard --> uc_create_simulation
```

## Diagrama de Classes (Versão Inicial - MVP)

Este diagrama representa as entidades principais do sistema (MVP), mantendo apenas as classes essenciais para autenticação, catálogo de estratégias e simulação básica.

```mermaid
classDiagram
  class User {
    +UUID id
    +string username
    +string email
    +string passwordHash
    +ENUM experienceLevel
    +Date createdAt
  }

  class Strategy {
    +UUID id
    +string name
    +ENUM proficiencyLevel
    +ENUM marketOutlook
    +ENUM strategyType
  }

  class StrategyLeg {
    +UUID id
    +UUID strategyId
    +ENUM action
    +ENUM instrumentType
    +int  quantityRatio
    +ENUM strikeRelation
    +int  orderSequence
  }

  class Asset {
    +UUID id
    +string symbol
    +string name
    +ENUM assetType
  }

  class Simulation {
    +UUID id
    +UUID userId
    +UUID strategyId
    +UUID assetId
    +string simulationName
    +Date startDate
    +Date endDate
    +number totalInvestment
    +number totalReturn
    +number returnPercentage
    +ENUM status
    +Date createdAt
  }

  class SimulationLeg {
    +UUID id
    +UUID simulationId
    +ENUM action
    +ENUM instrumentType
    +int quantity
    +number strikePrice
    +number entryPrice
    +number exitPrice
    +number profitLoss
  }

  %% Relacionamentos
  User "1" --> "0..*" Simulation
  Strategy "1" --> "1..*" StrategyLeg
  Strategy "1" --> "0..*" Simulation
  Asset "1" --> "0..*" Simulation
  Simulation "1" --> "0..*" SimulationLeg
```

### Detalhamento das Entidades (MVP)

- **User**: Representa os usuários do sistema. Cada usuário pode autenticar-se, acessar o catálogo de estratégias e criar simulações.  
- **Strategy**: Conjunto de regras pré-definidas de operações de opções financeiras (ex: Long Call, Covered Call).  
- **StrategyLeg**: Define cada perna da estratégia (compra/venda de CALL, PUT ou ação) e sua proporção.  
- **Asset**: Ativo subjacente usado nas simulações (ações, ETFs, índices, etc.).  
- **Simulation**: Execução de uma estratégia aplicada a um ativo em um período histórico, contendo os resultados (lucro/prejuízo).  
- **SimulationLeg**: Detalha cada operação concreta da simulação (preço de entrada, saída, quantidade, P&L).

## DER do Banco de Dados (MVP)

O diagrama abaixo representa o modelo lógico do banco para o MVP, alinhado às entidades do sistema (User, Strategy, StrategyLeg, Asset, Simulation e SimulationLeg) e seus relacionamentos.

```mermaid
erDiagram
    USER ||--o{ SIMULATION : "tem"
    STRATEGY ||--|{ STRATEGY_LEG : "composta por"
    STRATEGY ||--o{ SIMULATION : "aplicada em"
    ASSET ||--o{ SIMULATION : "usada por"
    SIMULATION ||--o{ SIMULATION_LEG : "contém"

    USER {
      uuid id PK
      string username
      string email
      string passwordHash
      string experienceLevel
      date   createdAt
    }

    STRATEGY {
      uuid id PK
      string name
      string proficiencyLevel
      string marketOutlook
      string strategyType
      date createdAt
      date updatedAt
    }

    STRATEGY_LEG {
      uuid id PK
      uuid strategyId FK
      string action
      string instrumentType
      int    quantityRatio
      string strikeRelation
      int    orderSequence
    }

    ASSET {
      uuid id PK
      string symbol
      string name
      string assetType
      date createdAt
      date updatedAt
    }

    SIMULATION {
      uuid id PK
      uuid userId FK
      uuid strategyId FK
      uuid assetId FK
      string simulationName
      date   startDate
      date   endDate
      float  totalInvestment
      float  totalReturn
      float  returnPercentage
      string status
      date   createdAt
      date   updatedAt
    }

    SIMULATION_LEG {
      uuid id PK
      uuid simulationId FK
      string action
      string instrumentType
      int    quantity
      float  strikePrice
      float  entryPrice
      float  exitPrice
      float  profitLoss
      date   entryDate
      date   exitDate
    }
```

## Protótipo das Telas (Figma)

[![Abrir Protótipo no Figma](https://img.shields.io/badge/🔗%20Abrir%20Protótipo%20no%20Figma-8A2BE2?style=for-the-badge&logo=figma&logoColor=white)](https://www.figma.com/design/bZWHJs6Akea4WNptNEv2lW/Trading-Strategies-INF-321?node-id=0-1&m=dev&t=1fuT0vCOUKdeZrdt-1)

O protótipo de interface foi desenvolvido no **Figma**, contemplando as principais telas do sistema.

### Pré-visualização

| Página Inicial | Dashboard | Catálogo de Estratégias |
|---|---|---|
| ![Página Inicial](docs/prototipo/pagina_inicial.png) | ![Dashboard](docs/prototipo/dashboard.png) | ![Catálogo de Estratégias](docs/prototipo/estrategias.png) |

| Simulações | Perfil do Usuário |
|---|---|
| ![Simulações](docs/prototipo/simulacoes.png) | ![Perfil do Usuário](docs/prototipo/perfil_usuario.png) |
