const { Wallet, ContractFactory, Contract } = require("ethers");
const { AlchemyProvider } = require("@ethersproject/providers");
const { keccak256, getCreate2Address} = require("ethers/lib/utils");
require('dotenv').config()

const provider = new AlchemyProvider("rinkeby"); //works also on localhost
const signer   = new Wallet(process.env.PRIVATE_KEY, provider);
const META     = require("./artifacts/contracts/Meta.sol/Meta.json")
const FACTORY  = require("./artifacts/contracts/Factory.sol/Factory.json")
const META_NEW = require("./artifacts/contracts/MetaNew.sol/MetaNew.json");

/**
 * @salt - Modifiable factor that will enable to deploy contract at partially defined address
 * @init - sighash of function(ROOT4146650865();) that will initialize Meta.sol.
 *
 * @addrFirstChars - First arbitrary characters of the address.
 * Note: This is optional, you can also deploy Meta at fully random address.
 *
 * For 4x addr. characters, salt should be computed in <10s.
 * To be able to compute more characters (7-12) in ~0-7 days check: https://github.com/johguse/ERADICATE2
 * After setup, you can run it for example with:
 * ERADICATE2 -A 0xAddrFactory -I 5860208158601c335a63000000008752fa158151803b80938091923cf3 --leading 0
 *
 * or if you have multiple GPUs & fastest one is at index 1:
 * ERADICATE2 -A 0xAddrFactory -I 5860208158601c335a63000000008752fa158151803b80938091923cf3 --leading 0 -s 1
 *
 * Bonus: You can also generate partially defined address of
 *        public key & contract address deployed with traditional method
 *        with: https://github.com/johguse/profanity
 */
let salt
const init           = '0x00000000' //call ROOT4146650865() to initialize contract
const addrFirstChars = 'd3f1' //hex format (0-9 & Aa-Ff), address wil be 0xd3f1...
let addrMeta         = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' //will be setup in getMetaAddrAndSalt()

async function start() {
  try{

    const factory = await deployFactory()
    await getMetaAddrAndSalt(factory.address, addrFirstChars)
    const meta    = await deployMeta(factory)
    await deleteMeta(meta)
    await deployNewMeta(factory)

  } catch (e) {
    console.error('Error: ', e)
  }

  return
}

const deployFactory = async () => {
  console.log("\nDeploying Factory...")

  const Factory = new ContractFactory(FACTORY.abi, FACTORY.bytecode, signer);
  const factory = await Factory.deploy(signer.address);
  await factory.deployTransaction.wait()
  console.log('Success, Factory deployed at:', factory.address);
  return factory
}

const getMetaAddrAndSalt = async (addrFactory, addrFirstChars) => {
  console.log(`\nSearching for "Salt" that will allow "Factory" to deploy "Meta": 0x${addrFirstChars}...`)
  const initHash = keccak256("0x5860208158601c335a63000000008752fa158151803b80938091923cf3")
  let i = 0

  while(addrMeta.substring(2, addrFirstChars.length+2)!=addrFirstChars){
    salt = keccak256(i)
    addrMeta = getCreate2Address(addrFactory, salt, initHash)
    i++
  }

  console.log(`Success.\nSalt: ${salt}\nMeta addr: ${addrMeta}.`)
  return
}

const deployMeta = async factory => {
  console.log('\nDeploying 1st Meta...')
  tx = await factory.deploy(salt, META.bytecode, init); await tx.wait();

  const meta = new Contract(addrMeta, META.abi, signer);
  if(await meta.owner()==signer.address){
    console.log('Success, Meta deployed at:', addrMeta)
  }

  return meta
}

const deleteMeta = async meta => {
  console.log('\nDeleting Meta in order to deploy new version...')
  tx = await meta.kill(); await tx.wait();

  try{
    await meta.owner()
    console.log('Error, Meta not deleted.')
  } catch (e){
    console.error('Success, Meta deleted.')
  }

  return
}

const deployNewMeta = async factory => {
  console.log('\nDeploying new Meta at the same address...')
  tx = await factory.deploy(salt, META_NEW.bytecode, init); await tx.wait();

  //same address, new abi with: isContractUpdated();
  const metaNew = new Contract(addrMeta, META_NEW.abi, signer);
  if(await metaNew.isContractUpdated()==true){
    console.log('Success, new Meta has been deployed, again at:', addrMeta)
  }

  return
}

start()