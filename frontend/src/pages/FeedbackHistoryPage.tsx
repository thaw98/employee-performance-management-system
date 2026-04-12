import { useGetFeedbackHistoryQuery } from '../features/feedback/api/feedbackApi'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate } from '../utils/dateUtils'

export function FeedbackHistoryPage() {
  const { data: historyRes, isLoading } = useGetFeedbackHistoryQuery()

  if (isLoading) return <div className="p-8">Loading history...</div>

  const history = historyRes?.data || []

  const exportPDF = () => {
    const doc = new jsPDF()

    doc.setFontSize(20)
    doc.text('Feedback History Report', 14, 22)
    doc.setFontSize(11)
    doc.text(`Generated on: ${formatDate(new Date().toISOString())}`, 14, 30)

    let yPos = 40

    history.forEach((h) => {
      // Create a page break if needed
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(`Evaluatee: ${h.evaluateeName}`, 14, yPos)
      yPos += 7

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`Date: ${formatDate(h.assessmentDate)} | Pos: ${h.evaluateePosition} | Dept: ${h.evaluateeDepartment}`, 14, yPos)
      yPos += 7
      doc.text(`Score: ${Math.round(h.totalScore)}/100 (${h.scoreGrade}) | Points: ${h.totalPoints}`, 14, yPos)
      yPos += 10

      const tableData = h.details.map(d => [d.criteriaName, d.rating.toString(), d.comment || '-'])

      autoTable(doc, {
        startY: yPos,
        head: [['Criteria', 'Rating', 'Comment']],
        body: tableData,
        theme: 'grid',
        margin: { left: 14, right: 14 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        didDrawPage: (data: any) => {
          yPos = data.cursor ? data.cursor.y + 15 : yPos + 15
        }
      })
    })

    if (history.length === 0) {
      doc.text("No feedback history available.", 14, yPos)
    }

    doc.save('feedback_history.pdf')
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Feedback History</h1>
          <p className="text-slate-500 mt-1">Review the feedbacks you have provided to other employees.</p>
        </div>
        <button
          onClick={exportPDF}
          className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-lg shadow font-medium flex items-center gap-2 transition"
        >
          <i className="bi bi-file-earmark-pdf-fill" /> Export to PDF
        </button>
      </div>

      {history.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4 text-slate-400">
            <i className="bi bi-inbox text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">No Feedbacks Given Yet</h2>
          <p className="text-slate-500">You haven't submitted any performance feedbacks recently.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {history.map((h) => (
            <div key={h.id} className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow transition flex flex-col">
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{h.evaluateeName}</h3>
                  <div className="text-sm text-slate-500">
                    {h.evaluateePosition} • {h.evaluateeDepartment}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-black uppercase tracking-wider text-sm ${h.totalScore >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
                    {h.scoreGrade}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    {formatDate(h.assessmentDate)}
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-4 flex-1">
                {h.details.map((d, i) => (
                  <div key={i} className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-slate-700">{d.criteriaName}</span>
                      <span className="font-bold text-blue-600">{d.rating}/5</span>
                    </div>
                    {d.comment && <p className="text-slate-500 text-xs italic">"{d.comment}"</p>}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-xl">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Score</span>
                <span className="font-black text-slate-800 text-xl">{Math.round(h.totalScore)}<span className="text-sm text-slate-400 font-medium">/100</span></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
