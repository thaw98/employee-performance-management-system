import React from 'react';
import { PenLine } from 'lucide-react';
import { isImageLikeMediaRef, resolveMediaSrc } from '../../../utils/mediaUrl';
import { formatDateTimeWithSeconds } from '../../../utils/dateUtils';

export interface SelfAssessmentSignatureGridProps {
  employeeName?: string | null;
  managerName?: string | null;
  employeeSignatureData?: string | null;
  employeeSignatureDate?: string | null;
  managerSignatureData?: string | null;
  managerSignatureDate?: string | null;
  /** Prefer final HR approval signature when present (matches PDF export). */
  hrSignatureData?: string | null;
  hrSignatureDate?: string | null;
  hrFinalSignatureData?: string | null;
  hrFinalSignatureDate?: string | null;
}

function SignatureBlock({
  title,
  pending,
  signatureData,
  signatureDate,
  printedName,
}: {
  title: string;
  pending: boolean;
  signatureData?: string | null;
  signatureDate?: string | null;
  printedName?: string | null;
}) {
  const hasSig = Boolean(signatureData?.trim());
  const showImage = hasSig && isImageLikeMediaRef(signatureData);

  return (
    <div className="flex min-w-0 flex-col">
      <p className="text-xs leading-snug text-slate-500 dark:text-slate-400">
        <span className="font-medium text-slate-600 dark:text-slate-300">{title}</span>
        {pending ? (
          <span className="font-normal text-slate-400 dark:text-slate-500"> – Pending</span>
        ) : null}
      </p>
      <div className="mt-2 flex min-h-[56px] items-end border-b border-slate-300/90 pb-1 dark:border-slate-600">
        {showImage ? (
          <img
            src={resolveMediaSrc(signatureData!)}
            alt=""
            className="max-h-12 max-w-full object-contain object-bottom-left opacity-90 dark:opacity-95"
          />
        ) : hasSig ? (
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{signatureData}</span>
        ) : null}
      </div>
      {signatureDate ? (
        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">
          Date & time: {formatDateTimeWithSeconds(signatureDate)}
        </p>
      ) : null}
      {printedName?.trim() ? (
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{printedName.trim()}</p>
      ) : null}
    </div>
  );
}

export const SelfAssessmentSignatureGrid: React.FC<SelfAssessmentSignatureGridProps> = ({
  employeeName,
  managerName,
  employeeSignatureData,
  employeeSignatureDate,
  managerSignatureData,
  managerSignatureDate,
  hrSignatureData,
  hrSignatureDate,
  hrFinalSignatureData,
  hrFinalSignatureDate,
}) => {
  const hrData = hrFinalSignatureData ?? hrSignatureData;
  const hrDate = hrFinalSignatureDate ?? hrSignatureDate;
  const employeePending = !employeeSignatureDate;
  const managerPending = !managerSignatureDate;
  const hrPending = !hrDate;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/60">
          <PenLine size={15} className="text-slate-500 dark:text-slate-400" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Signatures</h3>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10">
        <SignatureBlock
          title="Signature of Employee & Date"
          pending={employeePending}
          signatureData={employeeSignatureData}
          signatureDate={employeeSignatureDate}
          printedName={employeeName}
        />
        <SignatureBlock
          title="Signature of Manager & Date"
          pending={managerPending}
          signatureData={managerSignatureData}
          signatureDate={managerSignatureDate}
          printedName={managerName}
        />
      </div>

      <div className="mt-8 max-w-md">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Review by: HR Department</p>
        <SignatureBlock
          title="Signature of HR & Date"
          pending={hrPending}
          signatureData={hrData}
          signatureDate={hrDate}
          printedName={null}
        />
      </div>
    </div>
  );
};
