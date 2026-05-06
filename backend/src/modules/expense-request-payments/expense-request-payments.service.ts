import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExpenseRequestPaymentDto } from './dto/create-expense-request-payment.dto';

@Injectable()
export class ExpenseRequestPaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateExpenseRequestPaymentDto, paidByUserId?: string) {
    const request = await this.prisma.expenseRequest.findUnique({
      where: { id: dto.expenseRequestId },
      include: {
        payments: true,
      },
    });

    if (!request) {
      throw new NotFoundException('La solicitud de gasto no existe.');
    }

    if (request.status !== 'APROBADA') {
      throw new BadRequestException(
        'Solo se puede registrar pago a una solicitud aprobada.',
      );
    }

    const payment = await this.prisma.expenseRequestPayment.create({
      data: {
        expenseRequestId: dto.expenseRequestId,
        paymentMethod: dto.paymentMethod,
        paymentStatus: PaymentStatus.PAGADO,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        referenceNumber: dto.referenceNumber,
        checkNumber: dto.checkNumber,
        amountPaid: new Prisma.Decimal(dto.amountPaid),
        currencyId: dto.currencyId,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
        paidByUserId,
        notes: dto.notes,
      },
    });

    return {
      message: 'Pago registrado correctamente.',
      payment,
    };
  }

  async findByExpenseRequest(expenseRequestId: string) {
    return this.prisma.expenseRequestPayment.findMany({
      where: { expenseRequestId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPaymentSummary(expenseRequestId: string) {
    const payments = await this.prisma.expenseRequestPayment.findMany({
      where: {
        expenseRequestId,
        paymentStatus: 'PAGADO',
      },
    });

    const totalPaid = payments.reduce((sum, payment) => {
      return sum + Number(payment.amountPaid);
    }, 0);

    return {
      expenseRequestId,
      totalPaid,
      payments,
    };
  }

  async approve(id: string, userId?: string) {
  const request = await this.prisma.expenseRequest.findUnique({
    where: { id },
  });

  if (!request) {
    throw new NotFoundException('La solicitud de gasto no existe.');
  }

  if (request.status !== 'EN_REVISION' && request.status !== 'ENVIADA') {
    throw new BadRequestException(
      'Solo se pueden aprobar solicitudes enviadas o en revisión.',
    );
  }

  const updated = await this.prisma.expenseRequest.update({
    where: { id },
    data: {
      status: 'APROBADA',
    },
  });

  return {
    message:
      'Solicitud aprobada correctamente. Queda pendiente de registro de pago.',
    expenseRequest: updated,
  };
}
}