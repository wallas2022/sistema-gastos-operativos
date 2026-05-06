import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCountryDto, UpdateCountryDto } from "./dto/country.dto";
import { CreateCurrencyDto, UpdateCurrencyDto } from "./dto/currency.dto";
import { CreateCompanyDto, UpdateCompanyDto } from "./dto/company.dto";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Countries ───────────────────────────────────────────────────────────────

  async findCountries() {
    return this.prisma.country.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
  }

  async findCountryById(id: string) {
    const country = await this.prisma.country.findUnique({ where: { id } });
    if (!country) throw new NotFoundException(`País con id ${id} no encontrado`);
    return country;
  }

  async createCountry(dto: CreateCountryDto) {
    const exists = await this.prisma.country.findUnique({
      where: { code: dto.code },
    });
    if (exists)
      throw new ConflictException(`El código de país '${dto.code}' ya existe`);

    return this.prisma.country.create({ data: dto });
  }

  async updateCountry(id: string, dto: UpdateCountryDto) {
    await this.findCountryById(id);

    if (dto.code) {
      const conflict = await this.prisma.country.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (conflict)
        throw new ConflictException(`El código de país '${dto.code}' ya existe`);
    }

    return this.prisma.country.update({ where: { id }, data: dto });
  }

  async removeCountry(id: string) {
    await this.findCountryById(id);
    return this.prisma.country.update({
      where: { id },
      data: { active: false },
    });
  }

  // ─── Currencies ──────────────────────────────────────────────────────────────

  async findCurrencies() {
    return this.prisma.currency.findMany({
      where: { active: true },
      orderBy: { code: "asc" },
    });
  }

  async findCurrencyById(id: string) {
    const currency = await this.prisma.currency.findUnique({ where: { id } });
    if (!currency)
      throw new NotFoundException(`Moneda con id ${id} no encontrada`);
    return currency;
  }

  async createCurrency(dto: CreateCurrencyDto) {
    const exists = await this.prisma.currency.findUnique({
      where: { code: dto.code },
    });
    if (exists)
      throw new ConflictException(`El código de moneda '${dto.code}' ya existe`);

    return this.prisma.currency.create({ data: dto });
  }

  async updateCurrency(id: string, dto: UpdateCurrencyDto) {
    await this.findCurrencyById(id);

    if (dto.code) {
      const conflict = await this.prisma.currency.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (conflict)
        throw new ConflictException(
          `El código de moneda '${dto.code}' ya existe`,
        );
    }

    return this.prisma.currency.update({ where: { id }, data: dto });
  }

  async removeCurrency(id: string) {
    await this.findCurrencyById(id);
    return this.prisma.currency.update({
      where: { id },
      data: { active: false },
    });
  }

  // ─── Companies ───────────────────────────────────────────────────────────────

  async findCompanies() {
    return this.prisma.company.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: { country: true, currency: true },
    });
  }

  async findCompanyById(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: { country: true, currency: true },
    });
    if (!company)
      throw new NotFoundException(`Empresa con id ${id} no encontrada`);
    return company;
  }

  async createCompany(dto: CreateCompanyDto) {
    const exists = await this.prisma.company.findUnique({
      where: { code: dto.code },
    });
    if (exists)
      throw new ConflictException(
        `El código de empresa '${dto.code}' ya existe`,
      );

    await this.findCountryById(dto.countryId);
    await this.findCurrencyById(dto.currencyId);

    return this.prisma.company.create({
      data: dto,
      include: { country: true, currency: true },
    });
  }

  async updateCompany(id: string, dto: UpdateCompanyDto) {
    await this.findCompanyById(id);

    if (dto.code) {
      const conflict = await this.prisma.company.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (conflict)
        throw new ConflictException(
          `El código de empresa '${dto.code}' ya existe`,
        );
    }

    if (dto.countryId) await this.findCountryById(dto.countryId);
    if (dto.currencyId) await this.findCurrencyById(dto.currencyId);

    return this.prisma.company.update({
      where: { id },
      data: dto,
      include: { country: true, currency: true },
    });
  }

  async removeCompany(id: string) {
    await this.findCompanyById(id);
    return this.prisma.company.update({
      where: { id },
      data: { active: false },
    });
  }
}
