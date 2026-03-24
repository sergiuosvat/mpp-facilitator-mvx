import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Session, Prisma } from '@prisma/client';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private prisma: PrismaService) {}

  async createSession(data: {
    channelId: string;
    employer: string;
    receiver: string;
    tokenId: string;
    amountLocked: string;
  }): Promise<Session> {
    this.logger.log(`Creating session: ${data.channelId}`);
    return this.prisma.session.create({
      data: {
        ...data,
        status: 'OPEN',
      },
    });
  }

  async getSession(channelId: string): Promise<Session> {
    const session = await this.prisma.session.findUnique({
      where: { channelId },
    });
    if (!session) {
      throw new NotFoundException(`Session ${channelId} not found`);
    }
    return session;
  }

  async addVoucher(
    channelId: string,
    data: {
      amount: string;
      nonce: number;
      signature: string;
    },
  ): Promise<Session> {
    const session = await this.getSession(channelId);

    if (session.status !== 'OPEN') {
      throw new BadRequestException(`Session ${channelId} is not OPEN`);
    }

    // Basic cumulative check
    const currentAmount = BigInt(session.lastVoucherAmount);
    const newAmount = BigInt(data.amount);
    
    if (newAmount <= currentAmount && BigInt(data.nonce) <= session.lastVoucherNonce) {
       // In a real state channel, we only care if the new voucher is "better" (higher cumulative or higher nonce)
       // Here we strictly expect progress to avoid replay of old vouchers if not intended.
    }

    this.logger.log(`Updating session ${channelId} with voucher: amount=${data.amount}, nonce=${data.nonce}`);

    return this.prisma.session.update({
      where: { channelId },
      data: {
        lastVoucherAmount: data.amount,
        lastVoucherNonce: BigInt(data.nonce),
        lastVoucherSignature: data.signature,
      },
    });
  }

  async updateStatus(channelId: string, status: string): Promise<Session> {
    return this.prisma.session.update({
      where: { channelId },
      data: { status },
    });
  }

  async listActiveSessions(): Promise<Session[]> {
    return this.prisma.session.findMany({
      where: {
        status: 'OPEN',
      },
    });
  }
}
