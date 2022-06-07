async function getCoinQuote(inputMint, outputMint, amount) {
  const options = {
    method: "get",
  };
  const response = await (
    await fetch(
      `https://quote-api.jup.ag/v1/quote?outputMint=${outputMint}&inputMint=${inputMint}&amount=${amount}&slippage=0.2`,
      options
    )
  ).json();

  return response;
}

async function getTransaction(route, pubkey) {
  const data = {
    route: route,
    userPublicKey: pubkey,
    // to make sure it doesnt close the sol account
    wrapUnwrapSOL: "false",
  };
  const options = {
    method: "post",
    headers: data,
  };
  const response = await (
    await fetch("https://quote-api.jup.ag/v1/swap", options)
  ).json();

  return data;
}

module.exports = { getCoinQuote, getTransaction };
