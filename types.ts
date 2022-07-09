export type QuoteResponse = {
    data: DataQuote[],
    timeTaken: number
}

type DataQuote = {
    inAmount: number,
    outAmount: number,
    amount: number,
    otherAmountThreshold: number,
    swapMode: number,
    priceImpactPct: number,
    marketInfos: MarketInfos,
    fees: Fees
}

type MarketInfos = {
    id: String,
    label: String,
    inputMint: String,
    outputMint: String,
    notEnoughLiquidity: boolean,
    inAmount: number,
    outAmount: number,
    priceImpactPct: number,
    lpFee: LpFee,
    platformFee: PlatformFee
}

type LpFee = {
    amount: number,
    mint: String,
    pct: number
}

type PlatformFee = {
    amount: number,
    mint: String,
    pct: number
}

type Fees = {
    signatureFee: number,
    openOrdersDeposits: [],
    ataDeposits: [],
    totalFeeAndDeposits: number,
    minimumSOLForTransaction: number
}