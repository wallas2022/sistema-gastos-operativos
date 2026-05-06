import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { CreateExpenseRequestDto } from "./dto/create-expense-request.dto";

@Injectable()
export class ExpenseRequestsService {
  constructor(private readonly prisma: PrismaService) {}

 async create(dto: CreateExpenseRequestDto, requesterId: string) {
  try {
    console.log("DTO recibido:", dto);
    console.log("requesterId recibido:", requesterId);

    const company = await this.prisma.company.findFirst({
      where: {
        OR: [{ id: dto.companyId }, { code: dto.companyId }],
      },
      include: {
        country: true,
        currency: true,
      },
    });

    console.log("Empresa encontrada:", company);

    if (!company) {
      throw new BadRequestException("La empresa seleccionada no existe.");
    }

    const code = await this.generateExpenseRequestCode(company.id);
    console.log("Código generado:", code);

    const items = dto.items ?? [];

    const totalAmount = items.reduce((acc, item) => {
      return acc + Number(item.quantity) * Number(item.unitAmount);
    }, 0);

    console.log("Total calculado:", totalAmount);

   const request = await this.prisma.expenseRequest.create({
  data: {
    code,
    type: dto.type,
    priority: dto.priority ?? "NORMAL",

    requesterId,
    requesterName: dto.requesterName,
    requesterRole: dto.requesterRole,

    company: {
      connect: {
        id: company.id,
      },
    },
    currencyRef: {
      connect: {
        id: company.currencyId,
      },
    },

    companyName: company.name,
    currency: company.currency.code,

   // businessUnit: dto.businessUnit,
    costCenter: dto.costCenter,
    budgetAccount: dto.budgetAccount,

    concept: dto.concept,
   // description: dto.description,
    justification: dto.justification,

    destination: dto.destination,
    days: dto.days,

    estimatedDate: dto.estimatedDate
      ? new Date(dto.estimatedDate)
      : undefined,

    estimatedAmount: new Prisma.Decimal(totalAmount),

    items: {
      create: items.map((item) => ({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitAmount: new Prisma.Decimal(item.unitAmount),
        totalAmount: new Prisma.Decimal(
          Number(item.quantity) * Number(item.unitAmount)
        ),
        policyStatus: "PENDIENTE",
      })),
    },

    validations: {
      create: [
        {
          type: "POLITICA",
          status: "PENDIENTE",
          message:
            "Validación pendiente de integración con políticas externas.",
        },
        {
          type: "PRESUPUESTO",
          status: "PENDIENTE",
          message: "Validación presupuestaria pendiente de ejecución.",
        },
      ],
    },

    traces: {
      create: [
        {
          event: "SOLICITUD_CREADA",
          description: `Solicitud ${code} creada como borrador.`,
          userName: dto.requesterName,
          toStatus: "BORRADOR",
        },
      ],
    },
  },
  include: {
    items: true,
    validations: true,
    traces: true,
    company: {
      include: {
        country: true,
        currency: true,
      },
    },
    currencyRef: true,
  },
});
    return this.formatExpenseRequest(request);
  } catch (error) {
    console.error("ERROR REAL AL CREAR SOLICITUD:", error);
    throw error;
  }
}
  async findAll(user: any) {
    const whereByPermission = this.buildExpenseRequestWhereByPermissions(user);

    const requests = await this.prisma.expenseRequest.findMany({
      where: whereByPermission,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: true,
        validations: true,
        traces: {
          orderBy: {
            createdAt: "desc",
          },
          take: 3,
        },
      },
    });

    return requests.map((request) => this.formatExpenseRequest(request));
  }

  async findOne(id: string, user: any) {
    const whereByPermission = this.buildExpenseRequestWhereByPermissions(user);
    const request = await this.prisma.expenseRequest.findUnique({
      where: { id,...whereByPermission, },
      include: {
        items: true,
        validations: true,
        traces: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException("Solicitud de gasto no encontrada");
    }

    return this.formatExpenseRequest(request);
  }

 async submit(id: string, userName: string) {
  const request = await this.prisma.expenseRequest.findUnique({
    where: { id },
  });

  if (!request) {
    throw new NotFoundException("Solicitud de gasto no encontrada");
  }

  if (request.status !== "BORRADOR") {
    throw new BadRequestException(
      "Solo las solicitudes en borrador pueden enviarse a aprobación."
    );
  }

  const updated = await this.prisma.expenseRequest.update({
    where: { id },
    data: {
      status: "PENDIENTE_APROBACION",
      traces: {
        create: {
          event: "SOLICITUD_ENVIADA_APROBACION",
          description: `La solicitud ${request.code} fue enviada al flujo de autorización.`,
          userName,
          fromStatus: request.status,
          toStatus: "PENDIENTE_APROBACION",
        },
      },
    },
    include: {
      items: true,
      validations: true,
      traces: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return this.formatExpenseRequest(updated);
}
  private async generateCode() {
    const count = await this.prisma.expenseRequest.count();
    return `SOL-${String(count + 1).padStart(4, "0")}`;
  }

  private formatExpenseRequest(request: any) {
    return {
      ...request,
      estimatedAmount: Number(request.estimatedAmount),
      items: request.items?.map((item: any) => ({
        ...item,
        unitAmount: Number(item.unitAmount),
        totalAmount: Number(item.totalAmount),
      })),
    };
  }

  private async generateExpenseRequestCode(companyId: string) {
  const year = new Date().getFullYear();

  return this.prisma.$transaction(async (tx) => {
    const series = await tx.documentSeries.findUnique({
      where: {
        companyId_documentType_year: {
          companyId,
          documentType: "EXPENSE_REQUEST",
          year,
        },
      },
    });

    if (!series || !series.active) {
      throw new BadRequestException(
        "No existe una serie documental activa para la empresa seleccionada."
      );
    }

    const nextNumber = series.currentNumber + 1;

    await tx.documentSeries.update({
      where: {
        id: series.id,
      },
      data: {
        currentNumber: nextNumber,
      },
    });

    const formattedNumber = String(nextNumber).padStart(series.padding, "0");

    return `${series.prefix}-${year}-${formattedNumber}`;
  });
}

private buildExpenseRequestWhereByPermissions(user: any) {
  const permissions: string[] = user.permissions ?? [];

  if (permissions.includes('EXPENSE_REQUEST_VIEW_ALL')) {
    return {};
  }

  if (permissions.includes('EXPENSE_REQUEST_VIEW_COMPANY')) {
    return {
      companyId: user.companyId,
    };
  }

  if (permissions.includes('EXPENSE_REQUEST_VIEW_TEAM')) {
    return {
      requester: {
        managerId: user.id,
      },
    };
  }

  if (permissions.includes('EXPENSE_REQUEST_VIEW_OWN')) {
    return {
      requesterId: user.id,
    };
  }

  return {
    id: '__NO_ACCESS__',
  };
}
}