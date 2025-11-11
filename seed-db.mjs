import pg from 'pg';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Carrega variáveis de ambiente do arquivo .env.
dotenv.config();

/*
 * Mapeamento de constantes para os valores dos enums do banco.
 * Os valores são idênticos aos definidos em schema.ts, portanto este
 * objeto serve apenas como documentação e autopreenchimento nos dados.
 */
const proficiencyLevelMap = {
    NOVICE: 'NOVICE',
    INTERMEDIATE: 'INTERMEDIATE',
    ADVANCED: 'ADVANCED',
    EXPERT: 'EXPERT',
};

const marketOutlookMap = {
    BULLISH: 'BULLISH',
    BEARISH: 'BEARISH',
    NEUTRAL: 'NEUTRAL',
};

const volatilityViewMap = {
    HIGH: 'HIGH',
    NEUTRAL: 'NEUTRAL',
    LOW: 'LOW',
};

const riskRewardMap = {
    CAPPED: 'CAPPED',
    UNCAPPED: 'UNCAPPED',
};

const strategyTypeMap = {
    CAPITAL_GAIN: 'CAPITAL_GAIN',
    INCOME: 'INCOME',
    PROTECTION: 'PROTECTION',
};

const actionMap = {
    BUY: 'BUY',
    SELL: 'SELL',
};

const instrumentTypeMap = {
    CALL: 'CALL',
    PUT: 'PUT',
    STOCK: 'STOCK',
};

const strikeRelationMap = {
    ATM: 'ATM',
    ITM: 'ITM',
    OTM: 'OTM',
};

// Diretamente do livro "The Bible of Options Strategies"
// 27 estratégias principais do capítulo 1 a 7.
const strategiesData = [
    // Capítulo 1: The Four Basic Options Strategies
    {
        name: 'Long Call',
        summary: 'Compra de uma opção de compra. Expectativa de alta do ativo.',
        description: 'A estratégia mais básica para lucrar com um movimento de alta no preço do ativo subjacente. O risco é limitado ao prêmio pago.',
        proficiencyLevel: proficiencyLevelMap.NOVICE,
        marketOutlook: marketOutlookMap.BULLISH,
        volatilityView: volatilityViewMap.LOW,
        riskProfile: riskRewardMap.CAPPED,
        rewardProfile: riskRewardMap.UNCAPPED, // Lucro ilimitado
        strategyType: strategyTypeMap.CAPITAL_GAIN,
        legs: [
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.OTM },
        ],
    },
    {
        name: 'Long Put',
        summary: 'Compra de uma opção de venda. Expectativa de queda do ativo.',
        description: 'A estratégia mais básica para lucrar com um movimento de queda no preço do ativo subjacente. Também pode ser usada para proteção (hedge). O risco é limitado ao prêmio pago.',
        proficiencyLevel: proficiencyLevelMap.NOVICE,
        marketOutlook: marketOutlookMap.BEARISH,
        volatilityView: volatilityViewMap.LOW,
        riskProfile: riskRewardMap.CAPPED,
        rewardProfile: riskRewardMap.CAPPED,
        strategyType: strategyTypeMap.CAPITAL_GAIN,
        legs: [
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.PUT, quantityRatio: 1, strikeRelation: strikeRelationMap.OTM },
        ],
    },
    {
        name: 'Short (Naked) Call',
        summary: 'Venda a descoberto de uma opção de compra. Expectativa de queda ou estabilidade.',
        description: 'Venda de uma opção de compra sem possuir o ativo subjacente. Estratégia de alto risco com potencial de lucro limitado ao prêmio recebido.',
        proficiencyLevel: proficiencyLevelMap.ADVANCED,
        marketOutlook: marketOutlookMap.BEARISH,
        volatilityView: volatilityViewMap.HIGH,
        riskProfile: riskRewardMap.UNCAPPED,
        rewardProfile: riskRewardMap.CAPPED,
        strategyType: strategyTypeMap.INCOME,
        legs: [
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.OTM },
        ],
    },
    {
        name: 'Short (Naked) Put',
        summary: 'Venda a descoberto de uma opção de venda. Expectativa de alta ou estabilidade.',
        description: 'Venda de uma opção de venda sem ter o capital para comprar o ativo. Estratégia de alto risco com potencial de lucro limitado ao prêmio recebido.',
        proficiencyLevel: proficiencyLevelMap.ADVANCED,
        marketOutlook: marketOutlookMap.BULLISH,
        volatilityView: volatilityViewMap.HIGH,
        riskProfile: riskRewardMap.CAPPED,
        rewardProfile: riskRewardMap.CAPPED,
        strategyType: strategyTypeMap.INCOME,
        legs: [
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.PUT, quantityRatio: 1, strikeRelation: strikeRelationMap.OTM },
        ],
    },

    // Capítulo 2: Income Strategies
    {
        name: 'Covered Call',
        summary: 'Venda de uma opção de compra contra ações que você já possui.',
        description: 'Estratégia para gerar renda (prêmio) em um ativo que se espera ter movimento lateral ou leve alta. Reduz o custo base do ativo, mas limita o potencial de alta.',
        proficiencyLevel: proficiencyLevelMap.INTERMEDIATE,
        marketOutlook: marketOutlookMap.NEUTRAL,
        volatilityView: volatilityViewMap.HIGH,
        riskProfile: riskRewardMap.CAPPED,
        rewardProfile: riskRewardMap.CAPPED,
        strategyType: strategyTypeMap.INCOME,
        legs: [
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.STOCK, quantityRatio: 100, strikeRelation: strikeRelationMap.ATM }, // 100 ações por contrato
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.OTM },
        ],
    },
    {
        name: 'Cash Secured Put',
        summary: 'Venda de uma opção de venda com o capital para comprar o ativo reservado.',
        description: 'Estratégia para gerar renda (prêmio) ou adquirir um ativo a um preço mais baixo. O capital para a compra do ativo (strike) é reservado.',
        proficiencyLevel: proficiencyLevelMap.INTERMEDIATE,
        marketOutlook: marketOutlookMap.BULLISH,
        volatilityView: volatilityViewMap.HIGH,
        riskProfile: riskRewardMap.CAPPED,
        rewardProfile: riskRewardMap.CAPPED,
        strategyType: strategyTypeMap.INCOME,
        legs: [
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.PUT, quantityRatio: 1, strikeRelation: strikeRelationMap.OTM },
        ],
    },
    {
        name: 'Calendar Call',
        summary: 'Venda de uma Call de curto prazo e compra de uma Call de longo prazo com o mesmo strike.',
        description: 'Estratégia de spread de tempo (horizontal) que se beneficia da diferença na taxa de decaimento do tempo (Theta) entre as opções. Ideal para um mercado lateral ou levemente altista.',
        proficiencyLevel: proficiencyLevelMap.ADVANCED,
        marketOutlook: marketOutlookMap.NEUTRAL,
        volatilityView: volatilityViewMap.LOW,
        riskProfile: riskRewardMap.CAPPED,
        rewardProfile: riskRewardMap.CAPPED,
        strategyType: strategyTypeMap.INCOME,
        legs: [
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.ATM }, // Curto prazo
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.ATM }, // Longo prazo
        ],
    },
    {
        name: 'Diagonal Call',
        summary: 'Venda de uma Call de curto prazo e compra de uma Call de longo prazo com strikes diferentes.',
        description: 'Semelhante ao Calendar Spread, mas com strikes diferentes, o que adiciona uma dimensão direcional. Ideal para um mercado levemente altista.',
        proficiencyLevel: proficiencyLevelMap.ADVANCED,
        marketOutlook: marketOutlookMap.BULLISH,
        volatilityView: volatilityViewMap.LOW,
        riskProfile: riskRewardMap.CAPPED,
        rewardProfile: riskRewardMap.CAPPED,
        strategyType: strategyTypeMap.INCOME,
        legs: [
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.OTM },
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.ITM },
        ],
    },

    // Capítulo 3: Vertical Spreads
    {
        name: 'Bull Call Spread',
        summary: 'Compra de uma Call de strike mais baixo e venda de uma Call de strike mais alto.',
        description: 'Estratégia de débito vertical para lucrar com um movimento de alta moderado. Reduz o custo da Call longa, mas limita o lucro.',
        proficiencyLevel: proficiencyLevelMap.INTERMEDIATE,
        marketOutlook: marketOutlookMap.BULLISH,
        volatilityView: volatilityViewMap.LOW,
        riskProfile: riskRewardMap.CAPPED,
        rewardProfile: riskRewardMap.CAPPED,
        strategyType: strategyTypeMap.CAPITAL_GAIN,
        legs: [
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.ITM },
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.OTM },
        ],
    },
    {
        name: 'Bear Put Spread',
        summary: 'Compra de uma Put de strike mais alto e venda de uma Put de strike mais baixo.',
        description: 'Estratégia de débito vertical para lucrar com um movimento de queda moderado. Reduz o custo da Put longa, mas limita o lucro.',
        proficiencyLevel: proficiencyLevelMap.INTERMEDIATE,
        marketOutlook: marketOutlookMap.BEARISH,
        volatilityView: volatilityViewMap.LOW,
        riskProfile: riskRewardMap.CAPPED,
        rewardProfile: riskRewardMap.CAPPED,
        strategyType: strategyTypeMap.CAPITAL_GAIN,
        legs: [
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.PUT, quantityRatio: 1, strikeRelation: strikeRelationMap.ITM },
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.PUT, quantityRatio: 1, strikeRelation: strikeRelationMap.OTM },
        ],
    },
    {
        name: 'Bear Call Spread',
        summary: 'Venda de uma Call de strike mais baixo e compra de uma Call de strike mais alto.',
        description: 'Estratégia de crédito vertical para lucrar com um movimento de queda ou lateral. O crédito recebido é o lucro máximo, e o spread limita o risco.',
        proficiencyLevel: proficiencyLevelMap.INTERMEDIATE,
        marketOutlook: marketOutlookMap.BEARISH,
        volatilityView: volatilityViewMap.HIGH,
        riskProfile: riskRewardMap.CAPPED,
        rewardProfile: riskRewardMap.CAPPED,
        strategyType: strategyTypeMap.INCOME,
        legs: [
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.ATM },
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.OTM },
        ],
    },
    {
        name: 'Bull Put Spread',
        summary: 'Venda de uma Put de strike mais alto e compra de uma Put de strike mais baixo.',
        description: 'Estratégia de crédito vertical para lucrar com um movimento de alta ou lateral. O crédito recebido é o lucro máximo, e o spread limita o risco.',
        proficiencyLevel: proficiencyLevelMap.INTERMEDIATE,
        marketOutlook: marketOutlookMap.BULLISH,
        volatilityView: volatilityViewMap.HIGH,
        riskProfile: riskRewardMap.CAPPED,
        rewardProfile: riskRewardMap.CAPPED,
        strategyType: strategyTypeMap.INCOME,
        legs: [
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.PUT, quantityRatio: 1, strikeRelation: strikeRelationMap.ATM },
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.PUT, quantityRatio: 1, strikeRelation: strikeRelationMap.OTM },
        ],
    },

    // Capítulo 4: Volatility Strategies
    {
        name: 'Straddle (Long Straddle)',
        summary: 'Compra de uma Call e uma Put com o mesmo strike e vencimento.',
        description: 'Estratégia para lucrar com um grande movimento no preço do ativo subjacente, em qualquer direção. Ideal para eventos de alta volatilidade esperada (ex: balanços).',
        proficiencyLevel: proficiencyLevelMap.INTERMEDIATE,
        marketOutlook: marketOutlookMap.NEUTRAL,
        volatilityView: volatilityViewMap.LOW,
        riskProfile: riskRewardMap.CAPPED,
        rewardProfile: riskRewardMap.UNCAPPED,
        strategyType: strategyTypeMap.CAPITAL_GAIN,
        legs: [
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.ATM },
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.PUT, quantityRatio: 1, strikeRelation: strikeRelationMap.ATM },
        ],
    },
    {
        name: 'Strangle (Long Strangle)',
        summary: 'Compra de uma Call OTM e uma Put OTM com o mesmo vencimento.',
        description: 'Semelhante ao Straddle, mas com strikes OTM, o que a torna mais barata, mas exige um movimento de preço maior para atingir o ponto de equilíbrio.',
        proficiencyLevel: proficiencyLevelMap.INTERMEDIATE,
        marketOutlook: marketOutlookMap.NEUTRAL,
        volatilityView: volatilityViewMap.LOW,
        riskProfile: riskRewardMap.CAPPED,
        rewardProfile: riskRewardMap.UNCAPPED,
        strategyType: strategyTypeMap.CAPITAL_GAIN,
        legs: [
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.OTM },
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.PUT, quantityRatio: 1, strikeRelation: strikeRelationMap.OTM },
        ],
    },
    {
        name: 'Strip',
        summary: 'Compra de uma Call e duas Puts com o mesmo strike e vencimento.',
        description: 'Estratégia direcional de volatilidade que se beneficia de um grande movimento de preço, mas com uma inclinação para o lado de baixa (bearish).',
        proficiencyLevel: proficiencyLevelMap.ADVANCED,
        marketOutlook: marketOutlookMap.BEARISH,
        volatilityView: volatilityViewMap.LOW,
        riskProfile: riskRewardMap.CAPPED,
        rewardProfile: riskRewardMap.UNCAPPED,
        strategyType: strategyTypeMap.CAPITAL_GAIN,
        legs: [
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.ATM },
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.PUT, quantityRatio: 2, strikeRelation: strikeRelationMap.ATM },
        ],
    },
    {
        name: 'Strap',
        summary: 'Compra de duas Calls e uma Put com o mesmo strike e vencimento.',
        description: 'Estratégia direcional de volatilidade que se beneficia de um grande movimento de preço, mas com uma inclinação para o lado de alta (bullish).',
        proficiencyLevel: proficiencyLevelMap.ADVANCED,
        marketOutlook: marketOutlookMap.BULLISH,
        volatilityView: volatilityViewMap.LOW,
        riskProfile: riskRewardMap.CAPPED,
        rewardProfile: riskRewardMap.UNCAPPED,
        strategyType: strategyTypeMap.CAPITAL_GAIN,
        legs: [
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.CALL, quantityRatio: 2, strikeRelation: strikeRelationMap.ATM },
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.PUT, quantityRatio: 1, strikeRelation: strikeRelationMap.ATM },
        ],
    },
    {
        name: 'Guts (Long Guts)',
        summary: 'Compra de uma Call ITM e uma Put ITM com o mesmo vencimento.',
        description: 'Semelhante ao Straddle, mas com strikes ITM, o que a torna mais cara, mas com um ponto de equilíbrio mais próximo do preço atual.',
        proficiencyLevel: proficiencyLevelMap.ADVANCED,
        marketOutlook: marketOutlookMap.NEUTRAL,
        volatilityView: volatilityViewMap.LOW,
        riskProfile: riskRewardMap.CAPPED,
        rewardProfile: riskRewardMap.UNCAPPED,
        strategyType: strategyTypeMap.CAPITAL_GAIN,
        legs: [
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.ITM },
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.PUT, quantityRatio: 1, strikeRelation: strikeRelationMap.ITM },
        ],
    },

    // Capítulo 5: Sideways Strategies
    {
        name: 'Short Straddle',
        summary: 'Venda de uma Call e uma Put com o mesmo strike e vencimento.',
        description: 'Estratégia para lucrar com a estabilidade do preço do ativo subjacente e o decaimento do tempo (Theta). Risco ilimitado.',
        proficiencyLevel: proficiencyLevelMap.EXPERT,
        marketOutlook: marketOutlookMap.NEUTRAL,
        volatilityView: volatilityViewMap.HIGH,
        riskProfile: riskRewardMap.UNCAPPED,
        rewardProfile: riskRewardMap.CAPPED,
        strategyType: strategyTypeMap.INCOME,
        legs: [
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.ATM },
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.PUT, quantityRatio: 1, strikeRelation: strikeRelationMap.ATM },
        ],
    },
    {
        name: 'Short Strangle',
        summary: 'Venda de uma Call OTM e uma Put OTM com o mesmo vencimento.',
        description: 'Estratégia para lucrar com a estabilidade do preço do ativo subjacente e o decaimento do tempo (Theta). Risco ilimitado.',
        proficiencyLevel: proficiencyLevelMap.EXPERT,
        marketOutlook: marketOutlookMap.NEUTRAL,
        volatilityView: volatilityViewMap.HIGH,
        riskProfile: riskRewardMap.UNCAPPED,
        rewardProfile: riskRewardMap.CAPPED,
        strategyType: strategyTypeMap.INCOME,
        legs: [
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.OTM },
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.PUT, quantityRatio: 1, strikeRelation: strikeRelationMap.OTM },
        ],
    },
    {
        name: 'Long Call Butterfly',
        summary: 'Compra de uma Call de strike baixo, venda de duas Calls de strike médio e compra de uma Call de strike alto.',
        description: 'Estratégia de débito para lucrar com a estabilidade do preço do ativo subjacente. Risco e recompensa limitados.',
        proficiencyLevel: proficiencyLevelMap.ADVANCED,
        marketOutlook: marketOutlookMap.NEUTRAL,
        volatilityView: volatilityViewMap.HIGH,
        riskProfile: riskRewardMap.CAPPED,
        rewardProfile: riskRewardMap.CAPPED,
        strategyType: strategyTypeMap.INCOME,
        legs: [
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.ITM },
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.CALL, quantityRatio: 2, strikeRelation: strikeRelationMap.ATM },
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.OTM },
        ],
    },
    {
        name: 'Long Iron Condor',
        summary: 'Compra de um Bear Call Spread e um Bull Put Spread.',
        description: 'Estratégia de débito para lucrar com a estabilidade do preço do ativo subjacente. Risco e recompensa limitados.',
        proficiencyLevel: proficiencyLevelMap.ADVANCED,
        marketOutlook: marketOutlookMap.NEUTRAL,
        volatilityView: volatilityViewMap.HIGH,
        riskProfile: riskRewardMap.CAPPED,
        rewardProfile: riskRewardMap.CAPPED,
        strategyType: strategyTypeMap.INCOME,
        legs: [
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.OTM }, // Bear Call Spread (Long Leg)
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.ATM }, // Bear Call Spread (Short Leg)
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.PUT, quantityRatio: 1, strikeRelation: strikeRelationMap.OTM }, // Bull Put Spread (Long Leg)
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.PUT, quantityRatio: 1, strikeRelation: strikeRelationMap.ATM }, // Bull Put Spread (Short Leg)
        ],
    },

    // Capítulo 6: Leveraged Strategies
    {
        name: 'Call Ratio Backspread',
        summary: 'Venda de uma Call ITM e compra de duas Calls OTM.',
        description: 'Estratégia de débito ou crédito que se beneficia de um forte movimento de alta. O risco é limitado na queda, mas ilimitado na alta.',
        proficiencyLevel: proficiencyLevelMap.EXPERT,
        marketOutlook: marketOutlookMap.BULLISH,
        volatilityView: volatilityViewMap.LOW,
        riskProfile: riskRewardMap.UNCAPPED,
        rewardProfile: riskRewardMap.UNCAPPED,
        strategyType: strategyTypeMap.CAPITAL_GAIN,
        legs: [
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.ITM },
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.CALL, quantityRatio: 2, strikeRelation: strikeRelationMap.OTM },
        ],
    },
    {
        name: 'Put Ratio Backspread',
        summary: 'Venda de uma Put ITM e compra de duas Puts OTM.',
        description: 'Estratégia de débito ou crédito que se beneficia de um forte movimento de queda. O risco é limitado na alta, mas ilimitado na queda.',
        proficiencyLevel: proficiencyLevelMap.EXPERT,
        marketOutlook: marketOutlookMap.BEARISH,
        volatilityView: volatilityViewMap.LOW,
        riskProfile: riskRewardMap.UNCAPPED,
        rewardProfile: riskRewardMap.UNCAPPED,
        strategyType: strategyTypeMap.CAPITAL_GAIN,
        legs: [
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.PUT, quantityRatio: 1, strikeRelation: strikeRelationMap.ITM },
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.PUT, quantityRatio: 2, strikeRelation: strikeRelationMap.OTM },
        ],
    },
    {
        name: 'Ratio Call Spread',
        summary: 'Compra de uma Call e venda de duas Calls com strikes mais altos.',
        description: 'Estratégia de crédito ou débito que se beneficia de um movimento de alta moderado. O risco é ilimitado na alta.',
        proficiencyLevel: proficiencyLevelMap.EXPERT,
        marketOutlook: marketOutlookMap.BULLISH,
        volatilityView: volatilityViewMap.HIGH,
        riskProfile: riskRewardMap.UNCAPPED,
        rewardProfile: riskRewardMap.CAPPED,
        strategyType: strategyTypeMap.INCOME,
        legs: [
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.ATM },
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.CALL, quantityRatio: 2, strikeRelation: strikeRelationMap.OTM },
        ],
    },

    // Capítulo 7: Synthetic Strategies
    {
        name: 'Synthetic Long Stock',
        summary: 'Compra de uma Call e venda de uma Put com o mesmo strike e vencimento.',
        description: 'Cria o mesmo perfil de risco/recompensa de possuir o ativo subjacente (Long Stock) sem realmente comprá-lo.',
        proficiencyLevel: proficiencyLevelMap.ADVANCED,
        marketOutlook: marketOutlookMap.BULLISH,
        volatilityView: volatilityViewMap.NEUTRAL,
        riskProfile: riskRewardMap.UNCAPPED,
        rewardProfile: riskRewardMap.UNCAPPED,
        strategyType: strategyTypeMap.CAPITAL_GAIN,
        legs: [
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.ATM },
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.PUT, quantityRatio: 1, strikeRelation: strikeRelationMap.ATM },
        ],
    },
    {
        name: 'Synthetic Short Stock',
        summary: 'Venda de uma Call e compra de uma Put com o mesmo strike e vencimento.',
        description: 'Cria o mesmo perfil de risco/recompensa de vender o ativo subjacente a descoberto (Short Stock) sem realmente vendê-lo.',
        proficiencyLevel: proficiencyLevelMap.ADVANCED,
        marketOutlook: marketOutlookMap.BEARISH,
        volatilityView: volatilityViewMap.NEUTRAL,
        riskProfile: riskRewardMap.UNCAPPED,
        rewardProfile: riskRewardMap.UNCAPPED,
        strategyType: strategyTypeMap.CAPITAL_GAIN,
        legs: [
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.ATM },
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.PUT, quantityRatio: 1, strikeRelation: strikeRelationMap.ATM },
        ],
    },
    {
        name: 'Collar',
        summary: 'Compra do ativo, venda de uma Call OTM e compra de uma Put OTM.',
        description: 'Estratégia de proteção (hedge) que limita o risco de queda (pela Put) em troca de limitar o potencial de alta (pela Call).',
        proficiencyLevel: proficiencyLevelMap.ADVANCED,
        marketOutlook: marketOutlookMap.NEUTRAL,
        volatilityView: volatilityViewMap.HIGH,
        riskProfile: riskRewardMap.CAPPED,
        rewardProfile: riskRewardMap.CAPPED,
        strategyType: strategyTypeMap.PROTECTION,
        legs: [
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.STOCK, quantityRatio: 100, strikeRelation: strikeRelationMap.ATM },
            { action: actionMap.SELL, instrumentType: instrumentTypeMap.CALL, quantityRatio: 1, strikeRelation: strikeRelationMap.OTM },
            { action: actionMap.BUY, instrumentType: instrumentTypeMap.PUT, quantityRatio: 1, strikeRelation: strikeRelationMap.OTM },
        ],
    },
];

async function seedDatabase() {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    try {
        console.log('Iniciando a população do banco de dados...');

        // 1. Inserir Estratégias e coletar IDs
        const strategyIds = {};
        for (const strategy of strategiesData) {
            const id = uuidv4();
            strategyIds[strategy.name] = id;

            await client.query(
                `INSERT INTO strategies
         (id, name, summary, description, proficiency_level, market_outlook, volatility_view, risk_profile, reward_profile, strategy_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    id,
                    strategy.name,
                    strategy.summary,
                    strategy.description,
                    strategy.proficiencyLevel,
                    strategy.marketOutlook,
                    strategy.volatilityView,
                    strategy.riskProfile,
                    strategy.rewardProfile,
                    strategy.strategyType,
                ]
            );
        }
        console.log(`✓ ${strategiesData.length} Estratégias inseridas.`);

        // 2. Inserir Pernas de Estratégia
        let legsCount = 0;
        for (const strategy of strategiesData) {
            const strategyId = strategyIds[strategy.name];
            for (const leg of strategy.legs) {
                await client.query(
                    `INSERT INTO strategy_legs
           (strategy_id, action, instrument_type, quantity_ratio, strike_relation)
           VALUES ($1, $2, $3, $4, $5)`,
                    [
                        strategyId,
                        leg.action,
                        leg.instrumentType,
                        leg.quantityRatio,
                        leg.strikeRelation,
                    ]
                );
                legsCount++;
            }
        }
        console.log(`${legsCount} Pernas de Estratégia inseridas.`);
        console.log('Banco de dados populado com sucesso!');
    } catch (error) {
        console.error('Erro ao popular banco:', error);
        throw error;
    } finally {
        await client.end();
    }
}

seedDatabase().catch(error => {
    console.error('Falha na execução do script de seeding:', error.message);
    process.exit(1);
});
