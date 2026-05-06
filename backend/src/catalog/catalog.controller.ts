import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { CreateCountryDto, UpdateCountryDto } from "./dto/country.dto";
import { CreateCurrencyDto, UpdateCurrencyDto } from "./dto/currency.dto";
import { CreateCompanyDto, UpdateCompanyDto } from "./dto/company.dto";

@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ─── Countries ───────────────────────────────────────────────────────────────

  @Get("countries")
  findCountries() {
    return this.catalogService.findCountries();
  }

  @Get("countries/:id")
  findCountryById(@Param("id") id: string) {
    return this.catalogService.findCountryById(id);
  }

  @Post("countries")
  createCountry(@Body() dto: CreateCountryDto) {
    return this.catalogService.createCountry(dto);
  }

  @Patch("countries/:id")
  updateCountry(@Param("id") id: string, @Body() dto: UpdateCountryDto) {
    return this.catalogService.updateCountry(id, dto);
  }

  @Delete("countries/:id")
  removeCountry(@Param("id") id: string) {
    return this.catalogService.removeCountry(id);
  }

  // ─── Currencies ──────────────────────────────────────────────────────────────

  @Get("currencies")
  findCurrencies() {
    return this.catalogService.findCurrencies();
  }

  @Get("currencies/:id")
  findCurrencyById(@Param("id") id: string) {
    return this.catalogService.findCurrencyById(id);
  }

  @Post("currencies")
  createCurrency(@Body() dto: CreateCurrencyDto) {
    return this.catalogService.createCurrency(dto);
  }

  @Patch("currencies/:id")
  updateCurrency(@Param("id") id: string, @Body() dto: UpdateCurrencyDto) {
    return this.catalogService.updateCurrency(id, dto);
  }

  @Delete("currencies/:id")
  removeCurrency(@Param("id") id: string) {
    return this.catalogService.removeCurrency(id);
  }

  // ─── Companies ───────────────────────────────────────────────────────────────

  @Get("companies")
  findCompanies() {
    return this.catalogService.findCompanies();
  }

  @Get("companies/:id")
  findCompanyById(@Param("id") id: string) {
    return this.catalogService.findCompanyById(id);
  }

  @Post("companies")
  createCompany(@Body() dto: CreateCompanyDto) {
    return this.catalogService.createCompany(dto);
  }

  @Patch("companies/:id")
  updateCompany(@Param("id") id: string, @Body() dto: UpdateCompanyDto) {
    return this.catalogService.updateCompany(id, dto);
  }

  @Delete("companies/:id")
  removeCompany(@Param("id") id: string) {
    return this.catalogService.removeCompany(id);
  }
}
