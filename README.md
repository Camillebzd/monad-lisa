# Monad Lisa

Monad Lisa is an NFT collection viewer tool allowing you to retrieve information about collections on Monad.

The rarity system implemented is using the rarity score formula: `[Rarity Score for a Trait Value] = 1 / ([Number of Items with that Trait Value] / [Total Number of Items in Collection])`.

It is using Alchemy to retrieve NFT's information.

## Setup & run locally

First, install the dependencies:
```bash
npm i
```

Then, create a `.env` file and add an Alchemy API key:
```
NEXT_PUBLIC_ALCHEMY_API_KEY=<your-alchemy-key>
```
Note: remember to enable Monad Testnet network and the NFT API when you create it on the dashboard.

You can run it with:
```
npm run dev
```