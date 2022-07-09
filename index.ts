import { Connection, Keypair, Transaction } from "@solana/web3.js";
import { NodeWallet } from "./nodewallet";
import promiseRetry from "promise-retry";
import dotenv from "dotenv";
import bs58 from "bs58";
import { QuoteResponse } from "types"

console.log({ dotenv });
dotenv.config();

async function getCoinQuote(inputMint, outputMint, amount) : Promise<QuoteResponse> {
  const options = {
    method: "get",
  };

  return await (
    await fetch(
      `https://quote-api.jup.ag/v1/quote?outputMint=${outputMint}&inputMint=${inputMint}&amount=${amount}&swapMode=ExactIn&slippage=0&feeBps=0&onlyDirectRoutes=false`,
      options
    )
  ).json();
}

async function getTransaction(route, pubkey) {
  return await (
    await fetch("https://quote-api.jup.ag/v1/swap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: route,
        userPublicKey: pubkey,
        wrapUnwrapSOL: false,
      }),
    })
  ).json();
}

const connection = new Connection(
  "https://solana--mainnet.datahub.figment.io/apikey/8868c4e6c98ea7b4b88ece5bf96ff7d5"
);
const wallet = new NodeWallet(
  Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY || ""))
);

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL_MINT = "7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx";

const getConfirmTransaction = async (txid) => {
  const res = await promiseRetry(
      await connection.getTransaction(txid, {
        commitment: "confirmed",
      })
  );
  if (res.meta.err) {
    throw new Error("Transaction failed");
  }
  return txid;
};

//await createWSolAccount();

// 20 USDC for quote
const initial = 10_000_000;
const pubKey = "7SZM2pvDUfonYmdPqxwaw8bp93JvUXWiWWyRSHfga2Q7";

while (true) {
  const usdcToSol: QuoteResponse = await getCoinQuote(USDC_MINT, SOL_MINT, initial);
  const solToUsdc: QuoteResponse = await getCoinQuote(
    SOL_MINT,
    USDC_MINT,
    usdcToSol.data[0].outAmount
  );
  console.log(usdcToSol.timeTaken, solToUsdc.timeTaken);

  // when outAmount more than initial
  if (solToUsdc.data[0].outAmount > initial) {
    await Promise.all(
      [usdcToSol, solToUsdc].map(async (route) => {
        const tx = await getTransaction(route, pubKey);
        await Promise.all(
          [tx.setupTransaction, tx.swapTransaction, tx.cleanupTransaction]
            .filter(Boolean)
            .map(async (serializedTransaction) => {
              // get transaction object from serialized transaction
              const transaction = Transaction.from(
                Buffer.from(serializedTransaction, "base64")
              );
              // perform the swap
              // Transaction might failed or dropped
              const txid = await connection.sendTransaction(
                transaction,
                [wallet.payer],
                {
                  skipPreflight: true,
                }
              );
              try {
                await getConfirmTransaction(txid);
                console.log(`Success: https://solscan.io/tx/${txid}`);
              } catch (e) {
                console.log(`Failed: https://solscan.io/tx/${txid}`);
              }
            })
        );
      })
    );
  }
}

// retrieve indexed routed map
/*const indexedRouteMap = await (
  await fetch("https://quote-api.jup.ag/v1/indexed-route-map")
).json();
const getMint = (index) => indexedRouteMap["mintKeys"][index];
const getIndex = (mint) => indexedRouteMap["mintKeys"].indexOf(mint);

// generate route map by replacing indexes with mint addresses
var generatedRouteMap = {};
Object.keys(indexedRouteMap["indexedRouteMap"]).forEach((key, index) => {
  generatedRouteMap[getMint(key)] = indexedRouteMap["indexedRouteMap"][key].map(
    (index) => getMint(index)
  );
});

// list all possible input tokens by mint Address
const allInputMints = Object.keys(generatedRouteMap);

// list tokens can swap by mint addressfor SOL
const swappableOutputForSol =
  generatedRouteMap["So11111111111111111111111111111111111111112"];
console.log({ allInputMints, swappableOutputForSol });*/

// wsol account
/*const createWSolAccount = async () => {
  const wsolAddress = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    new PublicKey(SOL_MINT),
    wallet.publicKey
  );

  const wsolAccount = await connection.getAccountInfo(wsolAddress);

  if (!wsolAccount) {
    const transaction = new Transaction({
      feePayer: wallet.publicKey,
    });
    const instructions = [];

    instructions.push(
      await Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        new PublicKey(SOL_MINT),
        wsolAddress,
        wallet.publicKey,
        wallet.publicKey
      )
    );

    // fund 1 sol to the account
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: wsolAddress,
        lamports: 100_000_000, // 0.1 sol
      })
    );

    instructions.push(
      // This is not exposed by the types, but indeed it exists
      Token.createSyncNativeInstruction(TOKEN_PROGRAM_ID, wsolAddress)
    );

    transaction.add(...instructions);
    transaction.recentBlockhash = await (
      await connection.getLatestBlockhash()
    ).blockhash;
    transaction.partialSign(wallet.payer);
    const result = await connection.sendTransaction(transaction, [
      wallet.payer,
    ]);
    console.log({ result });
  }

  return wsolAccount;
};*/
