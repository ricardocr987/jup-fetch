export type QuoteResponse = {
    data: DataQuote[],
    timeTaken: number
}

export type DataQuote = {
    inAmount: number,
    outAmount: number,
    amount: number,
    otherAmountThreshold: number,
    swapMode: number,
    priceImpactPct: number,
    marketInfos: MarketInfos[],
    fees: Fees
}

type MarketInfos = {
    id: string,
    label: string,
    inputMint: string,
    outputMint: string,
    notEnoughLiquidity: boolean,
    inAmount: number,
    outAmount: number,
    priceImpactPct: number,
    lpFee: LpFee,
    platformFee: PlatformFee
}

type LpFee = {
    amount: number,
    mint: string,
    pct: number
}

type PlatformFee = {
    amount: number,
    mint: string,
    pct: number
}

type Fees = {
    signatureFee: number,
    openOrdersDeposits: [],
    ataDeposits: [],
    totalFeeAndDeposits: number,
    minimumSOLForTransaction: number
}

export type SwapResponse = {
    setupTransaction: string,
    swapTransaction: string,
    cleanupTransaction: string
}