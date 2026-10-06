import { api } from '../shared/services/api';

export const disbursementsApi = {
  pending: async () => (await api.get('/expense-request-payments/pending')).data,
  register: async (values: Record<string, string>, file: File) => {
    const data = new FormData();
    Object.entries(values).forEach(([key, value]) => data.append(key, value));
    data.append('file', file);
    return (await api.post('/expense-request-payments', data)).data;
  },
};
