import { api } from '../shared/services/api';

export const bankingApi = {
  banks: async () => (await api.get('/banking/banks')).data,
  allBanks: async () => (await api.get('/banking/banks', { params: { all: true } })).data,
  createBank: async (values: any) => (await api.post('/banking/banks', values)).data,
  updateBank: async (id: string, values: any) => (await api.patch(`/banking/banks/${id}`, values)).data,
  accounts: async () => (await api.get('/banking/accounts/me')).data,
  userAccounts: async (userId: string, currencyId: string) => (await api.get(`/banking/accounts/user/${userId}`, { params: { currencyId } })).data,
  create: async (values: any) => (await api.post('/banking/accounts', values)).data,
  update: async (id: string, values: any) => (await api.patch(`/banking/accounts/${id}`, values)).data,
  remove: async (id: string) => (await api.delete(`/banking/accounts/${id}`)).data,
};
