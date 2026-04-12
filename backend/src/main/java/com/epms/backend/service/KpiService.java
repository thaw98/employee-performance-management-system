package com.epms.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.epms.backend.entity.KpiRecord;
import com.epms.backend.entity.KpiRevision;
import com.epms.backend.entity.KpiAuditLog;
import com.epms.backend.entity.KpiStatus;
import com.epms.backend.entity.Employee;
import com.epms.backend.repository.KpiRecordRepository;
import com.epms.backend.repository.KpiRevisionRepository;
import com.epms.backend.repository.KpiAuditLogRepository;
import com.epms.backend.dto.KpiUpdateDTO;
import com.epms.backend.entity.SelfAssessmentStatus;
import com.epms.backend.repository.SelfAssessmentRepository;

import java.util.List;
import java.util.stream.Collectors;

//MNA
@Service
public class KpiService {

    private final KpiRecordRepository kpiRecordRepository;
    private final KpiRevisionRepository kpiRevisionRepository;
    private final KpiAuditLogRepository kpiAuditLogRepository;
    private final SelfAssessmentRepository selfAssessmentRepository;

    public KpiService(KpiRecordRepository kpiRecordRepository,
            KpiRevisionRepository kpiRevisionRepository,
            KpiAuditLogRepository kpiAuditLogRepository,
            SelfAssessmentRepository selfAssessmentRepository) {
        this.kpiRecordRepository = kpiRecordRepository;
        this.kpiRevisionRepository = kpiRevisionRepository;
        this.kpiAuditLogRepository = kpiAuditLogRepository;
        this.selfAssessmentRepository = selfAssessmentRepository;
    }

    /**
     * FR-KPI-07: Save KPI as Draft or Finalize Submission.
     */
    @Transactional
    public List<KpiRecord> saveKpiBatch(List<KpiRecord> records, boolean isFinalSubmission, String actorName) {
        if (records.isEmpty())
            return records;

        // Calculate total weight for validation
        double totalWeight = records.stream()
                .mapToDouble(r -> r.getWeight() != null ? r.getWeight() : 0.0)
                .sum();

        // FR-KPI-06: Strict Validation for Final Submission
        if (isFinalSubmission) {
            if (Math.abs(totalWeight - 100.0) > 0.001) {
                logAudit(null, "VALIDATION_FAILURE", "Submission blocked: Total weight " + totalWeight + "%",
                        actorName);
                throw new RuntimeException("Final Submission Failed: Total KPI weight must be exactly 100%. Current: "
                        + totalWeight + "%");
            }
            // Enforce all required fields for final submission
            // Check if Self Assessment is completed
            Employee emp = records.get(0).getEmployee();
            boolean hasSelfAssessment = selfAssessmentRepository.findByEmployee(emp).stream()
                .anyMatch(sa -> sa.getStatus() != SelfAssessmentStatus.UNLOCKED);
            
            if (!hasSelfAssessment) {
                throw new RuntimeException("Appraisal workflow cannot proceed: Mandatory self-assessment is still incomplete.");
            }

            for (KpiRecord r : records) {
                if (r.getKpi() == null || r.getKpi().isEmpty() || r.getCategory() == null) {
                    throw new RuntimeException(
                            "Final Submission Failed: KPI name and category are required for all metrics.");
                }
                r.setStatus(KpiStatus.SUBMITTED);
            }
        } else {
            // Draft Save
            records.forEach(r -> r.setStatus(KpiStatus.DRAFT));
        }

        List<KpiRecord> saved = kpiRecordRepository.saveAll(records);

        String action = isFinalSubmission ? "FINAL_SUBMISSION" : "DRAFT_SAVE";
        logAudit(null, action,
                "Batch saved as " + (isFinalSubmission ? "SUBMITTED" : "DRAFT") + ". Weight: " + totalWeight + "%",
                actorName);

        return saved;
    }

    /**
     * Only HR can approve and lock records.
     */
    @Transactional
    public void lockKpiBatch(Long employeeId, Long periodId, String actorName) {
        List<KpiRecord> records = kpiRecordRepository.findByEmployeeIdAndPeriodId(employeeId, periodId);
        records.forEach(r -> r.setStatus(KpiStatus.LOCKED));
        kpiRecordRepository.saveAll(records);
        logAudit(null, "HR_LOCK", "KPI Records locked for Employee ID: " + employeeId, actorName);
    }

    @Transactional
    public void approveKpiBatch(Long employeeId, Long periodId, String actorName) {
        List<KpiRecord> records = kpiRecordRepository.findByEmployeeIdAndPeriodId(employeeId, periodId);
        records.forEach(r -> r.setStatus(KpiStatus.APPROVED));
        kpiRecordRepository.saveAll(records);
        logAudit(null, "HR_APPROVAL", "KPI Records approved for Employee ID: " + employeeId, actorName);
    }

    @Transactional
    public KpiRecord reviseKpi(Long kpiId, KpiRecord revisedData, Long actorId, String actorName) {
        KpiRecord original = kpiRecordRepository.findById(kpiId)
                .orElseThrow(() -> new RuntimeException("KPI Record not found"));

        if (original.getStatus() == KpiStatus.LOCKED) {
            throw new RuntimeException("System Rule: Locked records cannot be revised.");
        }

        KpiRevision revision = new KpiRevision();
        revision.setKpiRecord(original);
        revision.setPreviousKpi(original.getKpi());
        revision.setPreviousTarget(original.getTarget());
        revision.setPreviousWeight(original.getWeight());
        revision.setRevisedBy(actorId);
        revision.setRevisionNote("Revised during review window");
        kpiRevisionRepository.save(revision);

        original.setKpi(revisedData.getKpi());
        original.setCategory(revisedData.getCategory());
        original.setTarget(revisedData.getTarget());
        original.setWeight(revisedData.getWeight());
        original.setUnit(revisedData.getUnit());
        original.setLogicDirection(revisedData.getLogicDirection());

        calculateKpiMetrics(original);
        logAudit(kpiId, "REVISION", "Revised metric definition: " + original.getKpi(), actorName);

        return kpiRecordRepository.save(original);
    }

    @Transactional
    public KpiRecord updateActualValue(Long kpiId, KpiUpdateDTO dto, Employee currentUser, boolean isHr) {
        KpiRecord record = kpiRecordRepository.findById(kpiId)
                .orElseThrow(() -> new RuntimeException("KPI Record not found"));

        if (record.getStatus() == KpiStatus.LOCKED) {
            throw new RuntimeException("Submission Blocked: Appraisal period is locked.");
        }

        if (!isHr) {
            if (!currentUser.getDepartment().getId().equals(record.getEmployee().getDepartment().getId())) {
                throw new RuntimeException("Security Error: Departmental isolation mismatch.");
            }
        }

        record.setActual(dto.getActual());
        calculateKpiMetrics(record);

        if (record.getStatus() == KpiStatus.ASSIGNED || record.getStatus() == KpiStatus.DRAFT
                || record.getStatus() == KpiStatus.SUBMITTED) {
            record.setStatus(KpiStatus.UNDER_REVIEW);
        }

        logAudit(kpiId, "ACTUAL_UPDATE", "Updated actual result to: " + dto.getActual(), currentUser.getEmployeeName());
        return kpiRecordRepository.save(record);
    }

    public void calculateKpiMetrics(KpiRecord record) {
        if (record.getTarget() == null || record.getActual() == null)
            return;
        try {
            double target = parseNumeric(record.getTarget());
            double actual = parseNumeric(record.getActual());
            if (target == 0 || actual == 0)
                record.setScore(0.0);
            else {
                double score = "lower".equalsIgnoreCase(record.getLogicDirection()) ? (target / actual) * 100
                        : (actual / target) * 100;
                record.setScore(score);
            }
            double weight = record.getWeight() != null ? record.getWeight() : 0.0;
            record.setWeightedScore((record.getScore() * weight) / 100);
        } catch (Exception e) {
            record.setScore(0.0);
        }
    }

    private void logAudit(Long kpiRecordId, String action, String details, String actor) {
        KpiAuditLog log = new KpiAuditLog();
        log.setKpiRecordId(kpiRecordId);
        log.setAction(action);
        log.setDetails(details);
        log.setPerformedBy(actor);
        kpiAuditLogRepository.save(log);
    }

    private double parseNumeric(String value) {
        if (value == null || value.trim().isEmpty())
            return 0.0;
        return Double.parseDouble(value.replaceAll("[^\\d.]", ""));
    }

    public List<KpiRecord> getKpisByEmployee(Long employeeId, Long periodId) {
        return kpiRecordRepository.findByEmployeeIdAndPeriodId(employeeId, periodId);
    }

    public List<KpiRevision> getRevisionHistory(Long kpiId) {
        return kpiRevisionRepository.findByKpiRecordIdOrderByRevisedAtDesc(kpiId);
    }
}
