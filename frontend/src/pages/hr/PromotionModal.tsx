import React, { useState } from 'react';
import { X, Rocket, Loader2, ClipboardCheck, Download, FileSpreadsheet } from 'lucide-react';
import { useGetAvailablePositionsQuery, useProposePromotionMutation } from '../../features/performanceReport/performanceReportApi';
import * as XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { addPdfFooterBranding, addPdfHeaderBranding, addPdfHeaderLogo, getPdfHeaderTextX, loadPdfLogo } from '../../utils/pdfBranding';

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number;
  employeeName: string;
  currentPosition: string | null;
  departmentName: string | null;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  currentPosition,
  departmentName,
}) => {
  const { data: positions = [], isLoading: isLoadingPositions } = useGetAvailablePositionsQuery(employeeId, {
    skip: !isOpen,
  });

  const [proposePromotion, { isLoading: isSubmitting }] = useProposePromotionMutation();

  const [selectedKey, setSelectedKey] = useState<string>(''); // format: "positionId-departmentId"
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKey) {
      setError('Please select a target position');
      return;
    }
    if (!effectiveDate) {
      setError('Please select an effective date');
      return;
    }

    const [posIdStr, deptIdStr] = selectedKey.split('-');
    const newPositionId = Number(posIdStr);
    const targetDepartmentId = deptIdStr ? Number(deptIdStr) : undefined;

    setError('');
    try {
      await proposePromotion({
        employeeId,
        newPositionId,
        targetDepartmentId,
        effectiveDate,
        remarks: remarks || undefined,
      }).unwrap();
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to submit promotion proposal');
    }
  };

  const selectedPositionId = selectedKey ? selectedKey.split('-')[0] : '';
  const targetPosition = positions.find(p => p.positionId.toString() === selectedPositionId);
  const targetPositionName = targetPosition ? `${targetPosition.positionName} ${targetPosition.levelCodeName ? `(${targetPosition.levelCodeName})` : ''}` : 'N/A';

  const handleExportExcel = () => {
    try {
      const data: any[] = [];
      data.push(['PROMOTION PROPOSAL FORM', '']);
      data.push(['', '']);
      data.push(['Employee Name', employeeName]);
      data.push(['Current Position', currentPosition || 'N/A']);
      data.push(['Department', departmentName || 'N/A']);
      data.push(['Target Position', targetPositionName]);
      data.push(['Effective Date', effectiveDate]);
      data.push(['Remarks / Justification', remarks || 'None']);

      const ws = XLSX.utils.aoa_to_sheet(data);
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }
      ];
      ws['!cols'] = [
        { wch: 25 },
        { wch: 50 },
      ];

      for (let r = 0; r < data.length; r++) {
        for (let c = 0; c < 2; c++) {
          const cellRef = `${['A', 'B'][c]}${r + 1}`;
          if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };

          if (r === 0) {
            ws[cellRef].s = {
              font: { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
              fill: { fgColor: { rgb: '2463EB' } },
              alignment: { horizontal: 'center', vertical: 'center' }
            };
          } else if (r > 1) {
             ws[cellRef].s = {
               font: { name: 'Segoe UI', sz: 11, bold: c === 0 },
               alignment: { vertical: 'top', wrapText: true },
               border: {
                 top: { style: 'thin', color: { rgb: 'E2E8F0' } },
                 bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
                 left: { style: 'thin', color: { rgb: 'E2E8F0' } },
                 right: { style: 'thin', color: { rgb: 'E2E8F0' } }
               }
             };
          }
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Promotion Proposal");
      XLSX.writeFile(wb, `Promotion_Proposal_${employeeName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportPdf = async () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');

      const logoDataUrl = await loadPdfLogo();
      const margin = 14;
      const logoWidth = 24;
      const headerTextX = getPdfHeaderTextX(margin, !!logoDataUrl, { logoWidth });
      if (logoDataUrl) {
        addPdfHeaderLogo(doc, logoDataUrl, { x: margin, y: 5, width: logoWidth, height: 12 });
      }

      doc.setFontSize(16);
      doc.text('Promotion Proposal Form', headerTextX, 18);
      doc.setFontSize(10);
      doc.text(`Export Date: ${format(new Date(), 'dd MMM yyyy')}`, 140, 18);
      addPdfHeaderBranding(doc, { margin: 14, y: 14 });

      autoTable(doc, {
        startY: 30,
        head: [['Field', 'Details']],
        body: [
          ['Employee Name', employeeName],
          ['Current Position', currentPosition || 'N/A'],
          ['Department', departmentName || 'N/A'],
          ['Target Position', targetPositionName],
          ['Effective Date', effectiveDate],
          ['Remarks / Justification', remarks || 'None']
        ],
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [36, 99, 235], textColor: 255 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 50 },
          1: { cellWidth: 'auto' }
        }
      });

      addPdfFooterBranding(doc, { align: 'left', margin: 14, y: doc.internal.pageSize.getHeight() - 8 });
      doc.save(`Promotion_Proposal_${employeeName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="text-indigo-600 dark:text-indigo-400" size={20} />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Propose Promotion</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
              <ClipboardCheck size={24} className="animate-bounce" />
            </div>
            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">Proposal Submitted!</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Promotion proposal has been successfully submitted to the Department Head for approval.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Employee details card */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800 text-sm space-y-2">
              <div>
                <span className="text-slate-400">Employee:</span>{' '}
                <strong className="text-slate-700 dark:text-slate-300">{employeeName}</strong>
              </div>
              <div>
                <span className="text-slate-400">Current Position:</span>{' '}
                <strong className="text-slate-700 dark:text-slate-300">{currentPosition || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-400">Department:</span>{' '}
                <strong className="text-slate-700 dark:text-slate-300">{departmentName || 'N/A'}</strong>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Position Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                Target Position <span className="text-red-500">*</span>
              </label>
              {isLoadingPositions ? (
                <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                  <Loader2 size={16} className="animate-spin" />
                  Loading positions...
                </div>
              ) : (
                <select
                  required
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500"
                >
                  <option value="">Select Target Position</option>
                  {positions.map((pos) => {
                    const optionValue = `${pos.positionId}-${pos.departmentId || ''}`;
                    const label = `${pos.recommended ? '⭐ [Recommended] ' : ''}${pos.positionName} (${pos.levelCodeName || 'N/A'})`;
                    return (
                      <option key={optionValue} value={optionValue}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Effective Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                Effective Date <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500"
              />
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                Proposal Remarks / Reason
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Specify the justification or remarks for this promotion proposal..."
                rows={3}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  <Download size={14} /> PDF
                </button>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#eff6ff] text-[#2463eb] rounded-lg hover:bg-[#dbeafe] dark:bg-blue-900/30 dark:text-blue-400 transition-colors"
                >
                  <FileSpreadsheet size={14} /> Excel
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedKey}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Rocket size={16} />
                      Submit Proposal
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
