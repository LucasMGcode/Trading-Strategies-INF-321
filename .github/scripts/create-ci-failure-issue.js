/**
 * Cria uma issue resumindo a falha do CI.
 *
 * Esse módulo é pensado para ser executado dentro do GitHub Actions
 * via actions/github-script, que injeta { github, context, core }.
 *
 * @param {object} params
 * @param {import('@actions/github').GitHub} params.github
 * @param {typeof import('@actions/github').context} params.context
 * @param {typeof import('@actions/core')} params.core
 */
module.exports = async function createCiFailureIssue({ github, context, core }) {
    const { owner, repo } = context.repo;

    core.info(`Criando issue de falha de CI para run ${context.runId} em ${owner}/${repo}...`);

    // 1. Buscar detalhes do workflow run
    const { data: workflowRun } = await github.rest.actions.getWorkflowRun({
        owner,
        repo,
        run_id: context.runId,
    });

    // 2. Buscar jobs deste run
    const jobs = await github.paginate(
        github.rest.actions.listJobsForWorkflowRun,
        {
            owner,
            repo,
            run_id: context.runId,
            per_page: 100,
        }
    );

    const failedJobs = jobs.filter(job => job.conclusion === 'failure');
    const failedJobNames = failedJobs.map(job => job.name);

    if (failedJobNames.length === 0) {
        core.info('Nenhum job com conclusão "failure" encontrado. Não será criada issue.');
        return;
    }

    const failedNamesStr = failedJobNames.join(', ');

    const issueTitle = `[CI Falhou] Workflow "${context.workflow}" – Jobs: ${failedNamesStr}`;
    const issueBody = `O workflow de CI falhou.
                    **Detalhes da Falha**
                    - **Workflow:** \`${context.workflow}\`
                    - **Run ID:** \`${context.runId}\`
                    - **Commit:** \`${context.sha}\`
                    - **Autor do commit:** \`${workflowRun.head_commit?.author?.name ?? 'desconhecido'}\`
                    - **Mensagem do commit:** \`${workflowRun.head_commit?.message ?? 'N/A'}\`
                    - **Branch:** \`${context.ref}\`
                    - **Jobs falhos:** ${failedNamesStr}
                    [Clique aqui para ver o log completo do Workflow](${workflowRun.html_url})
                    Por favor, investigue a causa da falha e corrija o problema.`;

    // 3. Evitar issues duplicadas (mesmo título ainda aberta)
    const existingIssues = await github.paginate(
        github.rest.issues.listForRepo,
        {
            owner,
            repo,
            state: 'open',
            labels: 'Falha-no-CI',
            per_page: 100,
        }
    );

    const sameTitleOpen = existingIssues.find(i => i.title === issueTitle);
    if (sameTitleOpen) {
        core.info(`Já existe uma issue aberta com este título: "${issueTitle}". Nenhuma nova issue será criada.`);
        return;
    }

    // 4. Criar issue
    const createdIssue = await github.rest.issues.create({
        owner,
        repo,
        title: issueTitle,
        body: issueBody,
        labels: ['Bug', 'Falha-no-CI'],
    });

    core.info(`Issue criada: #${createdIssue.data.number} - ${createdIssue.data.title}`);
};
