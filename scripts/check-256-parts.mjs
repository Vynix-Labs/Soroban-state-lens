import { xdr } from '@stellar/stellar-sdk'
console.log(
  'Keys of xdr:',
  Object.keys(xdr).filter((k) => k.toLowerCase().includes('256')),
)
