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

  getCurrencies: async (): Promise<Currency[]> => {
    const response = await api.get("/catalog/currencies");
    return response.data;
  },

  getCompanies: async (countryId?: string): Promise<Company[]> => {
    const response = await api.get("/catalog/companies", {
      params: countryId ? { countryId } : {},
    });

    return response.data;
  },

  getCompanyById: async (companyId: string): Promise<Company> => {
    const response = await api.get(`/catalog/companies/${companyId}`);
    return response.data;
  },
};