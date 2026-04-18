import axios from 'axios';

const API = axios.create({
  baseURL: '/api/v1',
});

export const getTrialBalance = () => API.get('/trial-balance');
export const getBalanceSheet = () => API.get('/balance-sheet');
export const getAccountLedger = (code) => API.get(`/accounts/${code}/ledger`);
export const getTransactions = () => API.get('/transactions');
export const postTransaction = (data) => API.post('/transactions', data);
export const postAccount = (data) => API.post('/accounts', data);
