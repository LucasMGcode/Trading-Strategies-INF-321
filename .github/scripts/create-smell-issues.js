const fs = require('fs');
const path = require('path');

/**
 * Cria issues de "code smell" com base no relatório JSON do ESLint.
 *
 * Este módulo é pensado para ser executado dentro do GitHub Actions
 * via actions/github-script, que injeta os objetos { github, context, core }.
 *
 * @param {object} params
 * @param {import('@actions/github').GitHub} params.github
 * @param {typeof import('@actions/github').context} params.context
 * @param {typeof import('@actions/core')} params.core
 */
module.exports = async function createSmellIssues({ github, context, core }) {
    const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
    const reportPath = path.join(workspace, 'eslint-report.json');

    if (!fs.existsSync(reportPath)) {
        core.info('Relatório de ESLint não encontrado. Nenhuma issue será criada.');
        return;
    }

    core.info(`Lendo relatório de ESLint em: ${reportPath}`);

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const issuesToCreate = [];

    for (const file of report) {
        if (!file.messages) continue;

        for (const message of file.messages) {
            // Filtra apenas a regra de complexidade
            if (message.ruleId !== 'complexity') continue;

            // Normaliza o path para ficar relativo ao repo
            const filePath = file.filePath.replace(workspace + path.sep, '');
            const title = `[Code Smell: Complexity] ${filePath}:${message.line}`;

            const body =
                `Foi detectada uma alta complexidade ciclomática, indicando um possível Code Smell.
                **Detalhes:**
                - **Arquivo:** \`${filePath}\`
                - **Linha:** ${message.line}
                - **Coluna:** ${message.column}
                - **Mensagem do ESLint:** ${message.message}
                - **Regra:** \`${message.ruleId}\`
                Sugestão: refatore esta função/método para reduzir a complexidade e distribuir melhor as responsabilidades.`;

            issuesToCreate.push({
                title,
                body,
                labels: ['Code-smell', 'Refatorar', 'Complexidade'],
            });
        }
    }

    if (issuesToCreate.length === 0) {
        core.info('Nenhum code smell de complexidade encontrado.');
        return;
    }

    core.info(`Ocorrências de complexidade encontradas: ${issuesToCreate.length}`);

    // Evita issues duplicadas: busca issues abertas com label "Code-smell"
    const existingIssues = await github.paginate(
        github.rest.issues.listForRepo,
        {
            owner: context.repo.owner,
            repo: context.repo.repo,
            labels: 'Code-smell',
            state: 'open',
            per_page: 100,
        }
    );

    const existingTitles = new Set(existingIssues.map(i => i.title));
    const MAX_ISSUES = 20;
    let created = 0;

    for (const issue of issuesToCreate) {
        if (existingTitles.has(issue.title)) {
            core.info(`Issue já existe: ${issue.title}`);
            continue;
        }

        if (created >= MAX_ISSUES) {
            core.warning(`Limite de ${MAX_ISSUES} issues atingido neste run. Outras ocorrências serão ignoradas.`);
            break;
        }

        await github.rest.issues.create({
            owner: context.repo.owner,
            repo: context.repo.repo,
            title: issue.title,
            body: issue.body,
            labels: issue.labels,
        });

        created++;
        core.info(`Issue criada: ${issue.title}`);
    }

    core.info(`Total de issues criadas neste run: ${created}`);
};
