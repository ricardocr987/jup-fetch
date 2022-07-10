import { Connection, Keypair, Transaction } from "@solana/web3.js";
import promiseRetry from "promise-retry";
import dotenv from "dotenv";
import bs58 from "bs58";
import { NodeWallet } from "nodewallet";

console.log({ dotenv });
dotenv.config();

const connection = new Connection(
  "https://solana--mainnet.datahub.figment.io/apikey/8868c4e6c98ea7b4b88ece5bf96ff7d5"
);

const wallet = new NodeWallet(
  Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY || ""))
);

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL_MINT = "So11111111111111111111111111111111111111112";
const initial = 50_000_000;
const minimal_output = initial * 1.0005
const profit_wanted = minimal_output / 1000000;
//const indexedRoute = await getIndexedRoutes()


/*async function getIndexedRoutes(){
  const options = {
    method: "get",
  };
  return await (
    await fetch(
      "https://quote-api.jup.ag/v1/indexed-route-map?onlyDirectRoutes=true", 
      options
    )
  ).json();
}

let i = 0;
for (const route in indexedRoute.mintKeys[i]) {
  console.log(route + ": " + i)
  i++;
}
*/
async function getQuotes(){
  const options = {
    method: "get",
  };
  const usdcToSol = await (
    await fetch(
      `https://quote-api.jup.ag/v1/quote?outputMint=${SOL_MINT}&inputMint=${USDC_MINT}&amount=${initial}&slippage=0.2&onlyDirectRoutes=true`,
      options
    )
  ).json();

  const solToUsdc = await (
    await fetch(
      `https://quote-api.jup.ag/v1/quote?outputMint=${USDC_MINT}&inputMint=${SOL_MINT}&amount=${usdcToSol.data[0].outAmount}&slippage=0.2&onlyDirectRoutes=true`,
      options
    )
  ).json();

  console.log("Output: " + solToUsdc.data[0].outAmount/1000000 + " | Wanted: " + profit_wanted + " | Market: " + solToUsdc.data[0].marketInfos[0].label + " | Time taken: " + solToUsdc.timeTaken);

  return [ usdcToSol.data[0], solToUsdc.data[0] ];
}

async function getTransaction(route){
  return await (
    await fetch("https://quote-api.jup.ag/v1/swap", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: route,
        userPublicKey: "7SZM2pvDUfonYmdPqxwaw8bp93JvUXWiWWyRSHfga2Q7",
        wrapUnwrapSOL: false,
      }),
    })
  ).json();
}

const getConfirmTransaction = async (txid) => {
  const res = await promiseRetry(
    async () => {
      let txResult = await connection.getTransaction(txid, {
        commitment: "confirmed",
      });
      return txResult;
    },
    {
      retries: 40,
      minTimeout: 500,
      maxTimeout: 1000,
    }
  );
  if (res.meta.err) {
    throw new Error("Transaction failed");
  }
  return txid;
};

while (true) {
  const [ usdcToSol, solToUsdc ] = await getQuotes()
  if (solToUsdc.outAmount > minimal_output) {
    console.log("Opportunity found");
    await Promise.all(
      [usdcToSol, solToUsdc].map(async (route) => {
        const tx = await getTransaction(route);
        console.log(tx);
        console.log("1:"+ tx.setupTransaction, "2:"+ tx.swapTransaction, "3:"+ tx.cleanupTransaction)
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