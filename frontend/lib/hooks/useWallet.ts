'use client';
import { useState } from 'react';
import { RpcProvider, Account } from 'starknet';
import { connect as kitConnect } from 'starknetkit';

export function useWallet(rpcUrl: string) {
  const [provider] = useState(() => new RpcProvider({ nodeUrl: rpcUrl }));
  const [account, setAccount] = useState<Account | null>(null);
  const [address, setAddress] = useState<string>('');
  const [status, setStatus] = useState<string>('Desconectado');

  async function connect() {
    setStatus('Conectando wallet…');
    const { wallet } = await kitConnect({
      modalMode: 'alwaysAsk',
      dappName: 'StableBTC',
    });
    if (!wallet) { setStatus('Conexión cancelada'); return; }
    const acc = wallet.account as Account;
    const chainId = await acc.getChainId();
    if (chainId !== 'SN_SEPOLIA') {
      setStatus('Cambiá a Starknet Sepolia en tu wallet.');
      return;
    }
    setAccount(acc);
    setAddress(acc.address);
    setStatus('Conectado');
  }

  return { provider, account, address, status, connect };
}
