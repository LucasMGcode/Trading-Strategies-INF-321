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
-   **Banco de Dados:** SQL Server
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