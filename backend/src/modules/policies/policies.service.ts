import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ExpenseType,
  PolicyField,
  PolicyOperator,
  PolicyResultStatus,
  Prisma,
  RequestPriority,
  RoleName,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PolicyRuleDto, PolicyRuleFiltersDto } from './dto/policy-rule.dto';

@Injectable()
export class PoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: PolicyRuleDto) {
    const data = await this.validateAndMap(dto);
    await this.ensureUnique(dto);
    return this.prisma.policyRule.create({
      data,
      include: this.ruleInclude(),
    });
  }

  async update(id: string, dto: PolicyRuleDto) {
    await this.findExisting(id);
    const data = await this.validateAndMap(dto);
    await this.ensureUnique(dto, id);
    return this.prisma.$transaction(async (tx) => {
      await tx.policyApprovalStep.deleteMany({ where: { policyRuleId: id } });
      return tx.policyRule.update({
        where: { id },
        data,
        include: this.ruleInclude(),
      });
    });
  }

  async findAll(filters: PolicyRuleFiltersDto) {
    const now = new Date();
    const andFilters: Prisma.PolicyRuleWhereInput[] = [];
    const where: Prisma.PolicyRuleWhereInput = {
      deletedAt: null,
      companyId: filters.companyId,
      expenseType: filters.expenseType,
      active: filters.active,
      priority: filters.priority,
      field: filters.field,
      operator: filters.operator,
      action: filters.action,
    };

    if (filters.search?.trim()) {
      andFilters.push({
        OR: ['code', 'name', 'description', 'message'].map((field) => ({
          [field]: { contains: filters.search.trim(), mode: 'insensitive' },
        })),
      });
    }

    if (filters.countryId) {
      andFilters.push({
        OR: [
          { company: { countryId: filters.countryId } },
          {
            field: PolicyField.COUNTRY,
            comparisonValue: filters.countryId,
          },
        ],
      });
    }

    if (filters.validity === 'CURRENT') {
      andFilters.push(
        { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
        { OR: [{ validTo: null }, { validTo: { gte: now } }] },
      );
    } else if (filters.validity === 'UPCOMING') {
      where.validFrom = { gt: now };
    } else if (filters.validity === 'EXPIRED') {
      where.validTo = { lt: now };
    }

    if (andFilters.length) where.AND = andFilters;

    const sortBy = filters.sortBy || 'priority';
    const sortOrder = filters.sortOrder || 'asc';
    const orderBy: Prisma.PolicyRuleOrderByWithRelationInput[] = [
      { [sortBy]: sortOrder },
    ];
    if (sortBy !== 'code') orderBy.push({ code: 'asc' });

    const query = {
      where,
      include: this.ruleInclude(),
      orderBy,
      skip:
        filters.page && filters.pageSize
          ? (filters.page - 1) * filters.pageSize
          : undefined,
      take: filters.pageSize,
    } satisfies Prisma.PolicyRuleFindManyArgs;

    const rules = await this.prisma.policyRule.findMany(query);
    if (!filters.page && !filters.pageSize) return rules;

    const total = await this.prisma.policyRule.count({ where });
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;

    return {
      data: rules,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async findOne(id: string) {
    const rule = await this.prisma.policyRule.findFirst({
      where: { id, deletedAt: null },
      include: this.ruleInclude(),
    });
    if (!rule) {
      throw new NotFoundException('Política no encontrada.');
    }
    return rule;
  }

  async activate(id: string) {
    await this.findExisting(id);
    return this.prisma.policyRule.update({
      where: { id },
      data: { active: true },
      include: this.ruleInclude(),
    });
  }

  async deactivate(id: string) {
    await this.findExisting(id);
    return this.prisma.policyRule.update({
      where: { id },
      data: { active: false },
      include: this.ruleInclude(),
    });
  }

  async remove(id: string) {
    await this.findExisting(id);
    return this.prisma.policyRule.update({
      where: { id },
      data: { active: false, deletedAt: new Date() },
      include: this.ruleInclude(),
    });
  }

  private async validateAndMap(dto: PolicyRuleDto) {
    const code = dto.code.trim().toUpperCase().replace(/\s+/g, '_');
    const comparisonValue = dto.comparisonValue.trim();
    const numericFields: PolicyField[] = [PolicyField.AMOUNT, PolicyField.DAYS];
    const numericOperators: PolicyOperator[] = [
      PolicyOperator.GREATER_THAN,
      PolicyOperator.GREATER_THAN_OR_EQUAL,
      PolicyOperator.LESS_THAN,
      PolicyOperator.LESS_THAN_OR_EQUAL,
    ];

    if (dto.action === PolicyResultStatus.NOT_APPLICABLE) {
      throw new BadRequestException(
        'NOT_APPLICABLE es un resultado automático y no una acción configurable.',
      );
    }

    const approvalSteps = dto.approvalSteps || [];
    if (
      dto.action === PolicyResultStatus.APPROVAL_REQUIRED &&
      approvalSteps.length === 0
    ) {
      throw new BadRequestException(
        'Una política que requiere aprobación debe configurar al menos un paso.',
      );
    }
    if (
      dto.action !== PolicyResultStatus.APPROVAL_REQUIRED &&
      approvalSteps.length > 0
    ) {
      throw new BadRequestException(
        'Solo las políticas de aprobación pueden configurar pasos.',
      );
    }

    const orderedSteps = [...approvalSteps].sort((a, b) => a.order - b.order);
    if (
      orderedSteps.some(
        (step, index) =>
          step.order !== index + 1 ||
          (!step.approverRoleId && !step.approverUserId),
      )
    ) {
      throw new BadRequestException(
        'Los pasos deben ser consecutivos desde 1 y definir rol o usuario aprobador.',
      );
    }

    for (const step of orderedSteps) {
      const role = step.approverRoleId
        ? await this.prisma.role.findFirst({
            where: { id: step.approverRoleId, active: true },
          })
        : null;
      const user = step.approverUserId
        ? await this.prisma.user.findFirst({
            where: { id: step.approverUserId, active: true },
            include: { roles: true },
          })
        : null;
      if (step.approverRoleId && !role) {
        throw new BadRequestException('Uno de los roles aprobadores no existe o está inactivo.');
      }
      if (step.approverUserId && !user) {
        throw new BadRequestException('Uno de los usuarios aprobadores no existe o está inactivo.');
      }
      if (
        role &&
        user &&
        !user.roles.some((userRole) => userRole.roleId === role.id)
      ) {
        throw new BadRequestException(
          'El usuario aprobador específico no posee el rol configurado.',
        );
      }
    }

    if (numericFields.includes(dto.field)) {
      const numericValue = Number(comparisonValue);
      if (!numericOperators.includes(dto.operator) || !Number.isFinite(numericValue)) {
        throw new BadRequestException(
          'Monto y días requieren un operador y un valor numéricos.',
        );
      }
      if (numericValue < 0) {
        throw new BadRequestException('El valor numérico no puede ser negativo.');
      }
    } else if (numericOperators.includes(dto.operator)) {
      throw new BadRequestException(
        'El operador numérico solo puede utilizarse con monto o días.',
      );
    }

    if (dto.operator === PolicyOperator.IN) {
      const values = comparisonValue.split(',').map((value) => value.trim());
      if (values.filter(Boolean).length < 2) {
        throw new BadRequestException(
          'El operador IN requiere al menos dos valores separados por coma.',
        );
      }
    }

    if (
      dto.field === PolicyField.COMPANY &&
      dto.operator === PolicyOperator.EQUALS
    ) {
      if (!dto.companyId || comparisonValue !== dto.companyId) {
        throw new BadRequestException(
          'Una regla de empresa debe utilizar la misma empresa como alcance y valor.',
        );
      }
    }
    if (
      dto.field === PolicyField.COMPANY &&
      dto.operator !== PolicyOperator.EQUALS &&
      dto.companyId
    ) {
      throw new BadRequestException(
        'Una condición de empresa no igualitaria no debe limitarse a una sola empresa.',
      );
    }

    if (
      dto.field === PolicyField.EXPENSE_TYPE &&
      dto.operator === PolicyOperator.EQUALS
    ) {
      if (!dto.expenseType || comparisonValue !== dto.expenseType) {
        throw new BadRequestException(
          'Una regla de tipo de gasto debe utilizar el mismo tipo como alcance y valor.',
        );
      }
    }
    if (
      dto.field === PolicyField.EXPENSE_TYPE &&
      dto.operator !== PolicyOperator.EQUALS &&
      dto.expenseType
    ) {
      throw new BadRequestException(
        'Una condición de tipo no igualitaria no debe limitarse a un solo tipo.',
      );
    }

    if (dto.field === PolicyField.COMPANY) {
      const companyValues =
        dto.operator === PolicyOperator.IN
          ? comparisonValue.split(',').map((value) => value.trim())
          : [comparisonValue];
      const companies = await this.prisma.company.count({
        where: { id: { in: companyValues }, active: true },
      });
      if (companies !== companyValues.length) {
        throw new BadRequestException(
          'Una o más empresas no existen o están inactivas.',
        );
      }
    }

    const comparisonValues =
      dto.operator === PolicyOperator.IN
        ? comparisonValue.split(',').map((value) => value.trim())
        : [comparisonValue];
    if (
      dto.field === PolicyField.EXPENSE_TYPE &&
      comparisonValues.some(
        (value) => !Object.values(ExpenseType).includes(value as ExpenseType),
      )
    ) {
      throw new BadRequestException('El tipo de gasto configurado no es válido.');
    }
    if (
      dto.field === PolicyField.PRIORITY &&
      comparisonValues.some(
        (value) =>
          !Object.values(RequestPriority).includes(value as RequestPriority),
      )
    ) {
      throw new BadRequestException('La prioridad configurada no es válida.');
    }
    if (
      dto.field === PolicyField.REQUESTER_ROLE &&
      comparisonValues.some(
        (value) => !Object.values(RoleName).includes(value as RoleName),
      )
    ) {
      throw new BadRequestException('El rol configurado no es válido.');
    }
    if (dto.field === PolicyField.DOCUMENT_TYPE) {
      const valid = ['FACTURA', 'RECIBO', 'COMPROBANTE_DE_PAGO', 'NOTA_DE_CREDITO', 'NOTA_DE_DEBITO', 'OTRO'];
      if (comparisonValues.some((value) => !valid.includes(value))) throw new BadRequestException('El tipo de comprobante configurado no es válido.');
    }

    if (dto.field === PolicyField.COUNTRY) {
      const countries = await this.prisma.country.count({
        where: { id: { in: comparisonValues }, active: true },
      });
      if (countries !== comparisonValues.length) {
        throw new BadRequestException('Uno o más países no existen o están inactivos.');
      }
    }

    if (dto.field === PolicyField.CURRENCY) {
      const currencies = await this.prisma.currency.count({
        where: { code: { in: comparisonValues }, active: true },
      });
      if (currencies !== comparisonValues.length) {
        throw new BadRequestException('Una o más monedas no existen o están inactivas.');
      }
    }

    if (dto.companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: dto.companyId },
      });
      if (!company || !company.active) {
        throw new BadRequestException('La empresa no existe o está inactiva.');
      }
    }

    const validFrom = dto.validFrom ? new Date(dto.validFrom) : null;
    const validTo = dto.validTo ? new Date(dto.validTo) : null;
    if (validFrom && validTo && validFrom > validTo) {
      throw new BadRequestException(
        'La fecha inicial de vigencia no puede ser posterior a la fecha final.',
      );
    }

    return {
      code,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      field: dto.field,
      operator: dto.operator,
      comparisonValue,
      action: dto.action,
      message: dto.message.trim(),
      priority: dto.priority,
      companyId: dto.companyId || null,
      expenseType: dto.expenseType || null,
      validFrom,
      validTo,
      approvalSteps: orderedSteps.length
        ? {
            create: orderedSteps.map((step) => ({
              order: step.order,
              approverRoleId: step.approverRoleId || null,
              approverUserId: step.approverUserId || null,
              required: step.required ?? true,
            })),
          }
        : undefined,
    };
  }

  private async ensureUnique(dto: PolicyRuleDto, excludeId?: string) {
    const code = dto.code.trim().toUpperCase().replace(/\s+/g, '_');
    const duplicatedCode = await this.prisma.policyRule.findFirst({
      where: {
        id: excludeId ? { not: excludeId } : undefined,
        code,
      },
    });
    if (duplicatedCode) {
      throw new ConflictException('Ya existe una política con el mismo código.');
    }

    const duplicatedCondition = await this.prisma.policyRule.findFirst({
      where: {
        deletedAt: null,
        id: excludeId ? { not: excludeId } : undefined,
        field: dto.field,
        operator: dto.operator,
        comparisonValue: dto.comparisonValue.trim(),
        companyId: dto.companyId || null,
        expenseType: dto.expenseType || null,
      },
    });
    if (duplicatedCondition) {
      throw new ConflictException(
        'Ya existe una política con la misma condición y alcance.',
      );
    }

    const duplicatedPriority = await this.prisma.policyRule.findFirst({
      where: {
        deletedAt: null,
        active: true,
        id: excludeId ? { not: excludeId } : undefined,
        field: dto.field,
        companyId: dto.companyId || null,
        expenseType: dto.expenseType || null,
        priority: dto.priority,
      },
    });
    if (duplicatedPriority) {
      throw new ConflictException(
        'Ya existe una política activa con la misma prioridad, campo y alcance.',
      );
    }
  }

  private async findExisting(id: string) {
    const rule = await this.prisma.policyRule.findFirst({
      where: { id, deletedAt: null },
    });
    if (!rule) {
      throw new NotFoundException('Política no encontrada.');
    }
    return rule;
  }

  private ruleInclude() {
    return {
      company: true,
      approvalSteps: {
        include: { approverRole: true, approverUser: { select: { id: true, name: true, email: true, role: true, companyId: true } } },
        orderBy: { order: 'asc' as const },
      },
    };
  }
}
