import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { JwtAuthGuard } from "../modules/auth/jwt-auth.guard";
import { CatalogService } from "./catalog.service";
import { CreateCountryDto, UpdateCountryDto } from "./dto/country.dto";
import { CreateCurrencyDto, UpdateCurrencyDto } from "./dto/currency.dto";
import { CreateCompanyDto, UpdateCompanyDto } from "./dto/company.dto";

@Controller("catalog")
@UseGuards(JwtAuthGuard, RolesGuard)
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
  @Roles("ADMIN", "FINANZAS")
  createCountry(@Body() dto: CreateCountryDto) {
    return this.catalogService.createCountry(dto);
  }

  @Patch("countries/:id")
  @Roles("ADMIN", "FINANZAS")
  updateCountry(@Param("id") id: string, @Body() dto: UpdateCountryDto) {
    return this.catalogService.updateCountry(id, dto);
  }

  @Delete("countries/:id")
  @Roles("ADMIN", "FINANZAS")
  removeCountry(@Param("id") id: string) {
    return this.catalogService.removeCountry(id);
  }

  // ─── Currencies ──────────────────────────────────────────────────────────────

  @Get("currencies")
  findCurrencies(@Query("includeInactive") includeInactive?: string) {
    return this.catalogService.findCurrencies(includeInactive === "true");
  }

  @Get("currencies/:id")
  findCurrencyById(@Param("id") id: string) {
    return this.catalogService.findCurrencyById(id);
  }

  @Post("currencies")
  @Roles("ADMIN", "FINANZAS")
  createCurrency(@Body() dto: CreateCurrencyDto) {
    return this.catalogService.createCurrency(dto);
  }

  @Patch("currencies/:id")
  @Roles("ADMIN", "FINANZAS")
  updateCurrency(@Param("id") id: string, @Body() dto: UpdateCurrencyDto) {
    return this.catalogService.updateCurrency(id, dto);
  }

  @Delete("currencies/:id")
  @Roles("ADMIN", "FINANZAS")
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
  @Roles("ADMIN", "FINANZAS")
  createCompany(@Body() dto: CreateCompanyDto) {
    return this.catalogService.createCompany(dto);
  }

  @Patch("companies/:id")
  @Roles("ADMIN", "FINANZAS")
  updateCompany(@Param("id") id: string, @Body() dto: UpdateCompanyDto) {
    return this.catalogService.updateCompany(id, dto);
  }

  @Delete("companies/:id")
  @Roles("ADMIN", "FINANZAS")
  removeCompany(@Param("id") id: string) {
    return this.catalogService.removeCompany(id);
  }
}
