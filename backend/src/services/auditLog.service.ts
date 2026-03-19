import { prisma } from '../database';

export interface AuditLogEntry {
  submissionId: string;
  institutionId: string;
  dataCategories: string[];
  piiStripped: boolean;
  provider: string;
  providerModel: string;
  legalBasis: string;
  consentRecordId?: string;
  retentionPolicy: string;
  retentionExpiresAt?: Date;
}

export class AuditLogService {
  static async record(entry: AuditLogEntry, tx?: any): Promise<string | null> {
    try {
      const client = tx ?? prisma;
      const log = await client.aiDataAuditLog.create({
        data: {
          submissionId: entry.submissionId,
          institutionId: entry.institutionId,
          dataCategories: entry.dataCategories,
          piiStripped: entry.piiStripped,
          provider: entry.provider,
          providerModel: entry.providerModel,
          legalBasis: entry.legalBasis,
          consentRecordId: entry.consentRecordId,
          retentionPolicy: entry.retentionPolicy,
          retentionExpiresAt: entry.retentionExpiresAt,
        },
      });
      return log.id;
    } catch (error) {
      console.error('[AuditLogService] Failed to record audit log:', error);
      return null;
    }
  }

  static async getLogsForSubmission(submissionId: string) {
    try {
      return await prisma.aiDataAuditLog.findMany({
        where: { submissionId },
        orderBy: { sentAt: 'desc' },
      });
    } catch (error) {
      console.error('[AuditLogService] Failed to get logs:', error);
      return [];
    }
  }
}
