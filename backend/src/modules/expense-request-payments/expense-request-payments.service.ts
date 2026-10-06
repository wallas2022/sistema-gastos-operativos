import { authorizedCompanyId } from '../auth/permissions.util';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExpenseRequestPaymentDto } from './dto/create-expense-request-payment.dto';
import { StorageService } from '../documents/storage/storage.service';
import { createHash } from 'crypto';
import { isAllowedEvidence, isDirectPaymentCurrencyCompatible, isDisbursementCurrencyCompatible, isRequesterPaymentModality, operationTypeForModality } from '../banking/banking-rules';

@Injectable()
export class ExpenseRequestPaymentsService {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService) {}

  async create(dto: CreateExpenseRequestPaymentDto, file: Express.Multer.File | undefined, user: any) {
    if (!['TESORERIA', 'ADMIN', 'FINANZAS'].includes(user?.role)) throw new ForbiddenException('Sólo Tesorería puede registrar la ejecución financiera.');
    if (!file) throw new BadRequestException('El comprobante de pago es obligatorio.');
    if (!isAllowedEvidence(file.mimetype)) throw new BadRequestException('El comprobante debe ser PDF, JPG o PNG.');
    const initial = await this.prisma.expenseRequest.findUnique({ where: { id: dto.expenseRequestId }, include: { payments: true } });
    if (!initial) throw new NotFoundException('La solicitud de gasto no existe.');
    if (user.role !== 'ADMIN' && (!user.companyId || initial.companyId !== user.companyId)) throw new ForbiddenException('No tiene acceso a la empresa de la solicitud.');
    if (initial.status !== 'APROBADA') throw new BadRequestException('Solo se puede registrar pago a una solicitud aprobada.');
    if (!Number.isFinite(Number(dto.amountPaid)) || Number(dto.amountPaid) <= 0) throw new BadRequestException('El importe pagado debe ser mayor que cero.');
    const authorizedAmount = new Prisma.Decimal(initial.estimatedAmount);
    if (new Prisma.Decimal(dto.amountPaid).gt(authorizedAmount)) throw new BadRequestException(`El importe pagado no puede superar el monto autorizado de ${authorizedAmount.toFixed(2)}.`);
    if (initial.payments.some((payment) => payment.paymentStatus === PaymentStatus.PAGADO)) throw new BadRequestException('La solicitud ya cuenta con una ejecución financiera pagada.');
    const requesterPayment = isRequesterPaymentModality(initial.paymentModality);
    const account = requesterPayment ? await this.prisma.applicantBankAccount.findFirst({ where: { id: dto.bankAccountId, userId: initial.requesterId, active: true }, include: { currency: true, bank: true } }) : null;
    if (requesterPayment && !account) throw new BadRequestException('La modalidad requiere una cuenta bancaria activa que pertenezca al solicitante.');
    if (requesterPayment && !isDisbursementCurrencyCompatible(initial.currencyId!, dto.currencyId, account!.currencyId)) throw new BadRequestException('La cuenta bancaria seleccionada no corresponde a la moneda del desembolso.');
    if (!requesterPayment && !isDirectPaymentCurrencyCompatible(initial.currencyId!, dto.currencyId)) throw new BadRequestException('La moneda del pago directo debe coincidir con la moneda de la solicitud.');
    const beneficiaryName = requesterPayment ? initial.requesterName : (dto.beneficiaryName?.trim() || initial.intendedBeneficiaryName?.trim());
    if (!beneficiaryName) throw new BadRequestException('El pago directo requiere un beneficiario identificado.');

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "ExpenseRequest" WHERE id = ${initial.id} FOR UPDATE`;
      const request = await tx.expenseRequest.findUnique({ where: { id: initial.id }, include: { payments: true } });
      if (!request || request.status !== 'APROBADA') throw new BadRequestException('La solicitud ya no está disponible para pago.');
      if (request.payments.some((payment) => payment.paymentStatus === PaymentStatus.PAGADO)) throw new BadRequestException('La solicitud ya cuenta con una ejecución financiera pagada.');
      const uploaded = await this.storage.uploadFile(file);
      const evidence = await tx.document.create({ data: { fileName: file.originalname, fileType: requesterPayment ? 'DISBURSEMENT_EVIDENCE' : 'DIRECT_PAYMENT_EVIDENCE', mimeType: file.mimetype, storagePath: uploaded.key, sizeBytes: BigInt(file.size), status: 'CARGADO', userId: user.id, expenseRequestId: request.id } });
      const created = await tx.expenseRequestPayment.create({ data: { expenseRequestId: request.id, paymentMethod: dto.paymentMethod, paymentStatus: PaymentStatus.PAGADO, operationType: operationTypeForModality(request.paymentModality), beneficiaryName, beneficiaryTaxId: dto.beneficiaryTaxId?.trim() || request.intendedBeneficiaryTaxId, bankName: requesterPayment ? account!.bank.name : dto.bankName, accountNumber: requesterPayment ? account!.accountNumber : dto.accountNumber, referenceNumber: dto.referenceNumber.trim(), checkNumber: dto.checkNumber, amountPaid: new Prisma.Decimal(dto.amountPaid), currencyId: dto.currencyId, paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(), paidByUserId: user.id, notes: dto.notes, bankAccountId: account?.id, evidenceDocumentId: evidence.id } });
      await tx.expenseRequestTrace.create({ data: { requestId: request.id, event: requesterPayment ? 'DESEMBOLSO_REGISTRADO' : 'PAGO_DIRECTO_REGISTRADO', description: `${requesterPayment ? 'Desembolso al solicitante' : 'Pago directo'} ${dto.referenceNumber} registrado para ${beneficiaryName}; evidencia ${file.originalname}; SHA-256 ${createHash('sha256').update(file.buffer).digest('hex')}.`, userName: user.name, fromStatus: request.status, toStatus: request.status } });
      return { message: requesterPayment ? 'Desembolso registrado correctamente.' : 'Pago directo registrado correctamente.', payment: created };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async pending(user: any) {
    if (!['TESORERIA', 'ADMIN', 'FINANZAS'].includes(user?.role)) throw new ForbiddenException('No tiene acceso a la bandeja de pagos.');
    return this.prisma.expenseRequest.findMany({ where: { status: 'APROBADA', ...(user.role === 'ADMIN' ? {} : { companyId: authorizedCompanyId(user, undefined, '') }), payments: { none: { paymentStatus: PaymentStatus.PAGADO } } }, include: { currencyRef: true, company: true }, orderBy: { createdAt: 'desc' } });
  }

  async findByExpenseRequest(expenseRequestId: string, user: any) {
    await this.assertRequestAccess(expenseRequestId, user);
    return this.prisma.expenseRequestPayment.findMany({
      where: { expenseRequestId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPaymentSummary(expenseRequestId: string, user: any) {
    await this.assertRequestAccess(expenseRequestId, user);
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

  private async assertRequestAccess(expenseRequestId: string, user: any) {
    const request = await this.prisma.expenseRequest.findUnique({ where: { id: expenseRequestId }, select: { requesterId: true, companyId: true } });
    if (!request) throw new NotFoundException('Solicitud de gasto no encontrada.');
    const privileged = ['ADMIN', 'FINANZAS', 'TESORERIA', 'GERENTE'].includes(user?.role) && (user.role === 'ADMIN' || (!!user.companyId && request.companyId === user.companyId));
    const owner = request.requesterId === user?.id && !!user.companyId && request.companyId === user.companyId;
    if (!privileged && !owner) throw new NotFoundException('Pago no encontrado.');
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
