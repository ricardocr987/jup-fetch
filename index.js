async function getCoinQuote(inputMint, outputMint, amount) {
  const options = {
    method: "get",
  };
  const response = await (
    await fetch(
      `https://quote-api.jup.ag/v1/quote?outputMint=${outputMint}&inputMint=${inputMint}&amount=${amount}&swapMode=ExactIn&slippage=0&feeBps=0&onlyDirectRoutes=fals`,
      options
    )
  ).json();

  return response.data[0];
}

async function getTransaction(route, pubkey) {
  return await (
    await fetch("https://quote-api.jup.ag/v1/swap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // route from /quote api
        route: route,
        // user public key to be used for the swap
        userPublicKey: pubkey,
        wrapUnwrapSOL: false,
      }),
    })
  ).json();
}

module.exports = { getCoinQuote, getTransaction };
