import { api } from "../shared/services/api";


export type Country = {
  id: string;
  code: string;
  name: string;
  active: boolean;
};

export type Currency = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  active: boolean;
};

export type Company = {
  id: string;
  code: string;
  name: string;
  legalName?: string | null;
  tradeName?: string | null;
  taxId?: string | null;
  countryId: string;
  currencyId: string;
  active: boolean;
  country?: Country;
  currency?: Currency;
};

export const catalogsService = {
  getCountries: async (): Promise<Country[]> => {
    const response = await api.get("/catalog/countries");
    return response.data;
  },

  getCurrencies: async (includeInactive = false): Promise<Currency[]> => {
    const response = await api.get("/catalog/currencies", { params: includeInactive ? { includeInactive: true } : {} });
    return response.data;
  },
  createCurrency: async (payload: Pick<Currency, 'code' | 'name' | 'symbol'>): Promise<Currency> => (await api.post('/catalog/currencies', payload)).data,
  updateCurrency: async (id: string, payload: Partial<Pick<Currency, 'code' | 'name' | 'symbol' | 'active'>>): Promise<Currency> => (await api.patch(`/catalog/currencies/${id}`, payload)).data,

  getCompanies: async (countryId?: string): Promise<Company[]> => {
    const response = await api.get("/catalog/companies", {
      params: countryId ? { countryId } : {},
    });

    const companies = response.data as Company[];
    return countryId
      ? companies.filter((company) => company.countryId === countryId)
      : companies;
  },

  getCompanyById: async (companyId: string): Promise<Company> => {
    const response = await api.get(`/catalog/companies/${companyId}`);
    return response.data;
  },
  updateCompany: async (id: string, payload: Partial<Pick<Company, 'legalName' | 'tradeName' | 'taxId' | 'active'>>): Promise<Company> => (await api.patch(`/catalog/companies/${id}`, payload)).data,
};
