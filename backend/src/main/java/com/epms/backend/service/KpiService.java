// KpiService.java - Complete fixed version
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
import com.epms.backend.dto.kpi.KpiCreateDTO;
import com.epms.backend.dto.kpi.KpiRevisionRequestDTO;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class KpiService {

    private final KpiRecordRepository kpiRecordRepository;
    private final KpiRevisionRepository kpiRevisionRepository;
    private final KpiAuditLogRepository kpiAuditLogRepository;

    private static final Pattern NUMERIC_PATTERN = Pattern.compile("^\\d+(\\.\\d+)?$");

    public KpiService(KpiRecordRepository kpiRecordRepository,
                      KpiRevisionRepository kpiRevisionRepository,
                      KpiAuditLogRepository kpiAuditLogRepository) {
        this.kpiRecordRepository = kpiRecordRepository;
        this.kpiRevisionRepository = kpiRevisionRepository;
        this.kpiAuditLogRepository = kpiAuditLogRepository;
    }

    /**
     * Create KPI records for an employee
     */
    @Transactional
    public List<KpiRecord> createKpisForEmployee(Long employeeId, Long periodId, List<KpiCreateDTO> kpis, Employee creator, boolean isFinal) {
        
        for (KpiCreateDTO kpi : kpis) {
            validateKpiFields(kpi);
        }

        BigDecimal totalWeight = kpis.stream()
                .map(KpiCreateDTO::getWeight)
                .filter(w -> w != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (isFinal && totalWeight.compareTo(new BigDecimal("100")) != 0) {
            throw new RuntimeException("Total KPI weight must equal 100%. Current total: " + totalWeight + "%");
        }

        Employee employee = new Employee();
        employee.setId(employeeId);

        List<KpiRecord> savedRecords = new ArrayList<>();

        for (KpiCreateDTO dto : kpis) {
            KpiRecord record = new KpiRecord();
            record.setEmployee(employee);
            record.setPeriodId(periodId);
            record.setKpi(dto.getKpiName());
            record.setCategory(dto.getCategory());
            record.setTarget(dto.getTarget());
            record.setUnit(dto.getUnit());
            record.setWeight(dto.getWeight());
            record.setPriorityLevel(dto.getPriorityLevel());
            record.setLogicDirection(dto.getLogicDirection() != null ? dto.getLogicDirection() : "higher");
            record.setStatus(isFinal ? KpiStatus.SUBMITTED : KpiStatus.DRAFT);
            record.setCreatedBy(creator);
            record.setCreatedDate(Instant.now());
            record.setUpdatedBy(creator);
            record.setUpdatedDate(Instant.now());
            record.setRevisionNumber(0);
            
            savedRecords.add(kpiRecordRepository.save(record));
        }

        logAudit(null, "KPI_CREATION", 
                String.format("Created %d KPIs for employee ID %d. Total weight: %s%%. Status: %s", 
                        kpis.size(), employeeId, totalWeight, isFinal ? "SUBMITTED" : "DRAFT"),
                creator.getEmployeeName());

        return savedRecords;
    }

    private void validateKpiFields(KpiCreateDTO kpi) {
        if (kpi.getKpiName() == null || kpi.getKpiName().trim().isEmpty()) {
            throw new RuntimeException("KPI name is required");
        }
        if (kpi.getCategory() == null || kpi.getCategory().trim().isEmpty()) {
            throw new RuntimeException("Category is required for KPI: " + kpi.getKpiName());
        }
        if (kpi.getTarget() == null || kpi.getTarget().trim().isEmpty()) {
            throw new RuntimeException("Target is required for KPI: " + kpi.getKpiName());
        }
        if (kpi.getWeight() == null) {
            throw new RuntimeException("Weight is required for KPI: " + kpi.getKpiName());
        }
        if (kpi.getWeight().compareTo(BigDecimal.ZERO) < 0 || 
            kpi.getWeight().compareTo(new BigDecimal("100")) > 0) {
            throw new RuntimeException("Weight must be between 0 and 100 for KPI: " + kpi.getKpiName());
        }
    }

    /**
     * FR-KPI-05 to FR-KPI-08: Update actual value with authorization
     */
    @Transactional
    public KpiRecord updateActualValue(Long kpiId, KpiUpdateDTO dto, Employee currentUser, boolean isHr) {
        return updateActualValue(kpiId, dto, currentUser, isHr, false);
    }

    @Transactional
    public KpiRecord updateActualValue(Long kpiId, KpiUpdateDTO dto, Employee currentUser, boolean isHr, boolean isManager) {
        
        KpiRecord record = kpiRecordRepository.findById(kpiId)
                .orElseThrow(() -> new RuntimeException("KPI Record not found"));

        if (record.getStatus() == KpiStatus.LOCKED) {
            throw new RuntimeException("Cannot update locked KPI record. Please contact HR to unlock.");
        }

        // Authorization check
        boolean isAuthorized = false;
        
        if (isHr) {
            isAuthorized = true;
        } else if (isManager) {
            if (currentUser.getDepartment() != null && 
                record.getEmployee().getDepartment() != null &&
                currentUser.getDepartment().getId().equals(record.getEmployee().getDepartment().getId())) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            throw new RuntimeException("Access denied: Only HR or Department Head can update KPI actual values.");
        }

        String oldActual = record.getActual();

        if (dto.getActual() != null) {
            record.setActual(dto.getActual());
        }
        if (dto.getRemarks() != null) {
            record.setRemarks(dto.getRemarks());
        }

        calculateKpiMetrics(record);

        if (record.getStatus() == KpiStatus.ASSIGNED || record.getStatus() == KpiStatus.DRAFT) {
            record.setStatus(KpiStatus.UNDER_REVIEW);
        }

        record.setUpdatedBy(currentUser);
        record.setUpdatedDate(Instant.now());
        
        // Increment revision number
        record.setRevisionNumber(record.getRevisionNumber() != null ? record.getRevisionNumber() + 1 : 1);

        KpiRecord saved = kpiRecordRepository.save(record);

        // Create revision record
        KpiRevision revision = new KpiRevision();
        revision.setKpiRecord(record);
        revision.setPreviousTarget(record.getTarget());
        revision.setPreviousWeight(record.getWeight());
        revision.setRevisedBy(currentUser.getId());
        revision.setRevisionNote("Actual value updated from " + oldActual + " to " + dto.getActual());
        revision.setRevisedAt(Instant.now());
        kpiRevisionRepository.save(revision);

        logAudit(kpiId, "ACTUAL_UPDATE", 
                String.format("Updated actual from '%s' to '%s'", oldActual, dto.getActual()),
                currentUser.getEmployeeName());

        return saved;
    }

    /**
     * Lock KPI records for an employee (HR only)
     */
    @Transactional
    public void lockKpiBatch(Long employeeId, Long periodId, Employee hrUser) {
        List<KpiRecord> records;
        
        if (periodId != null) {
            records = kpiRecordRepository.findByEmployeeIdAndPeriodId(employeeId, periodId);
        } else {
            records = kpiRecordRepository.findByEmployeeId(employeeId);
        }
        
        if (records.isEmpty()) {
            throw new RuntimeException("No KPI records found for employee ID: " + employeeId);
        }

        for (KpiRecord record : records) {
            record.setStatus(KpiStatus.LOCKED);
            record.setLockedDate(Instant.now());
            record.setUpdatedBy(hrUser);
        }
        
        kpiRecordRepository.saveAll(records);
        logAudit(null, "HR_LOCK", 
                String.format("Locked %d KPI records for employee ID: %s", records.size(), employeeId),
                hrUser.getEmployeeName());
    }

    /**
     * Approve KPI batch (HR only)
     */
    @Transactional
    public void approveKpiBatch(Long employeeId, Long periodId, String actorName) {
        List<KpiRecord> records;
        
        if (periodId != null) {
            records = kpiRecordRepository.findByEmployeeIdAndPeriodId(employeeId, periodId);
        } else {
            records = kpiRecordRepository.findByEmployeeId(employeeId);
        }
        
        if (records.isEmpty()) {
            throw new RuntimeException("No KPI records found for employee ID: " + employeeId);
        }

        for (KpiRecord record : records) {
            record.setStatus(KpiStatus.APPROVED);
            record.setUpdatedDate(Instant.now());
        }
        
        kpiRecordRepository.saveAll(records);
        logAudit(null, "HR_APPROVAL", 
                String.format("Approved %d KPI records for employee ID: %s", records.size(), employeeId),
                actorName);
    }

    /**
     * Revise KPI (during review window)
     */
    @Transactional
    public KpiRecord reviseKpi(Long kpiId, KpiRecord revisedData, Long actorId, String actorName) {
        KpiRecord original = kpiRecordRepository.findById(kpiId)
                .orElseThrow(() -> new RuntimeException("KPI Record not found"));

        if (original.getStatus() == KpiStatus.LOCKED) {
            throw new RuntimeException("Locked records cannot be revised.");
        }

        // Save revision history
        KpiRevision revision = new KpiRevision();
        revision.setKpiRecord(original);
        revision.setPreviousKpi(original.getKpi());
        revision.setPreviousTarget(original.getTarget());
        revision.setPreviousWeight(original.getWeight());
        revision.setRevisedBy(actorId);
        revision.setRevisionNote("Revised during review window");
        revision.setRevisedAt(Instant.now());
        kpiRevisionRepository.save(revision);

        // Update original with new values
        original.setKpi(revisedData.getKpi());
        original.setCategory(revisedData.getCategory());
        original.setTarget(revisedData.getTarget());
        original.setWeight(revisedData.getWeight());
        original.setUnit(revisedData.getUnit());
        original.setLogicDirection(revisedData.getLogicDirection());
        original.setRevisionNumber(original.getRevisionNumber() != null ? original.getRevisionNumber() + 1 : 1);
        
        calculateKpiMetrics(original);
        
        logAudit(kpiId, "REVISION", "Revised metric definition: " + original.getKpi(), actorName);

        return kpiRecordRepository.save(original);
    }

    /**
     * Save KPI batch as draft or final
     */
    @Transactional
    public List<KpiRecord> saveKpiBatch(List<KpiRecord> records, boolean isFinalSubmission, String actorName) {
        if (records.isEmpty())
            return records;

        BigDecimal totalWeight = records.stream()
                .map(KpiRecord::getWeight)
                .filter(w -> w != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (isFinalSubmission) {
            if (totalWeight.compareTo(new BigDecimal("100")) != 0) {
                logAudit(null, "VALIDATION_FAILURE", "Submission blocked: Total weight " + totalWeight + "%", actorName);
                throw new RuntimeException("Final Submission Failed: Total KPI weight must be exactly 100%. Current: "
                        + totalWeight + "%");
            }
            
            for (KpiRecord r : records) {
                if (r.getKpi() == null || r.getKpi().isEmpty() || r.getCategory() == null) {
                    throw new RuntimeException("Final Submission Failed: KPI name and category are required for all metrics.");
                }
                r.setStatus(KpiStatus.SUBMITTED);
            }
        } else {
            records.forEach(r -> r.setStatus(KpiStatus.DRAFT));
        }

        List<KpiRecord> saved = kpiRecordRepository.saveAll(records);
        
        String action = isFinalSubmission ? "FINAL_SUBMISSION" : "DRAFT_SAVE";
        logAudit(null, action, "Batch saved. Weight: " + totalWeight + "%", actorName);

        return saved;
    }

    public void calculateKpiMetrics(KpiRecord record) {
        String targetStr = record.getTarget();
        String actualStr = record.getActual();
        
        if (targetStr == null || actualStr == null || targetStr.isBlank() || actualStr.isBlank()) {
            record.setScore(null);
            record.setWeightedScore(null);
            return;
        }

        try {
            double target = parseNumeric(targetStr);
            double actual = parseNumeric(actualStr);
            
            if (target == 0) {
                record.setScore(BigDecimal.ZERO);
            } else {
                double score;
                if ("lower".equalsIgnoreCase(record.getLogicDirection())) {
                    score = (target / actual) * 100;
                } else {
                    score = (actual / target) * 100;
                }
                score = Math.min(score, 150);
                record.setScore(BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP));
            }
            
            BigDecimal weight = record.getWeight() != null ? record.getWeight() : BigDecimal.ZERO;
            BigDecimal score = record.getScore() != null ? record.getScore() : BigDecimal.ZERO;
            record.setWeightedScore(
                    score.multiply(weight)
                         .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
            );
        } catch (Exception e) {
            record.setScore(BigDecimal.ZERO);
            record.setWeightedScore(BigDecimal.ZERO);
        }
    }

    private double parseNumeric(String value) {
        if (value == null || value.trim().isEmpty()) return 0.0;
        String cleaned = value.replaceAll("[^\\d.-]", "");
        if (cleaned.isEmpty() || cleaned.equals("-")) return 0.0;
        return Double.parseDouble(cleaned);
    }

    private void logAudit(Long kpiRecordId, String action, String details, String actor) {
        KpiAuditLog log = new KpiAuditLog();
        log.setKpiRecordId(kpiRecordId);
        log.setAction(action);
        log.setDetails(details);
        log.setPerformedBy(actor);
        log.setCreatedAt(Instant.now());
        kpiAuditLogRepository.save(log);
    }

    public List<KpiRecord> getKpisByEmployee(Long employeeId, Long periodId) {
        if (periodId != null) {
            return kpiRecordRepository.findByEmployeeIdAndPeriodId(employeeId, periodId);
        }
        return kpiRecordRepository.findByEmployeeId(employeeId);
    }

    public List<KpiRevision> getRevisionHistory(Long kpiId) {
        return kpiRevisionRepository.findByKpiRecordIdOrderByRevisedAtDesc(kpiId);
    }
    
    public Double getTotalWeightByEmployee(Long employeeId, Long periodId) {
        return kpiRecordRepository.getTotalWeightByEmployee(employeeId, periodId);
    }
    
 // Add these methods to KpiService.java

    /**
     * FR-KPI-REV-01 to FR-KPI-REV-04: Revise KPI during review period
     * Authorized users can revise KPI during the review period
     * Revised KPI values are saved with timestamp and user details
     * Previous KPI values remain in history
     * Locked KPIs cannot be edited unless unlocked by an authorized role
     */
    @Transactional
    public KpiRecord reviseKpi(Long kpiId, KpiRevisionRequestDTO revisionRequest, Employee reviewer, boolean isHr, boolean isManager) {
        
        KpiRecord original = kpiRecordRepository.findById(kpiId)
                .orElseThrow(() -> new RuntimeException("KPI Record not found"));
        
        // FR-KPI-REV-04: Locked KPIs cannot be edited unless unlocked by authorized role
        if (original.getStatus() == KpiStatus.LOCKED) {
            if (!isHr) {
                throw new RuntimeException("Locked KPI records cannot be revised. Please contact HR to unlock.");
            }
            // HR can revise locked records (override)
        }
        
        // Check authorization
        boolean isAuthorized = false;
        if (isHr) {
            isAuthorized = true;
        } else if (isManager) {
            // Manager can revise KPIs for employees in their department
            if (reviewer.getDepartment() != null && 
                original.getEmployee().getDepartment() != null &&
                reviewer.getDepartment().getId().equals(original.getEmployee().getDepartment().getId())) {
                isAuthorized = true;
            }
        } else if (reviewer.getId().equals(original.getEmployee().getId())) {
            // Employee can revise their own KPIs only if not locked
            if (original.getStatus() != KpiStatus.LOCKED) {
                isAuthorized = true;
            }
        }
        
        if (!isAuthorized) {
            throw new RuntimeException("Access denied: You are not authorized to revise this KPI.");
        }
        
        // FR-KPI-REV-03: Save previous values to history before revision
        KpiRevision revision = new KpiRevision();
        revision.setKpiRecord(original);
        revision.setPreviousKpi(original.getKpi());
        revision.setPreviousTarget(original.getTarget());
        revision.setPreviousWeight(original.getWeight());
        revision.setRevisedBy(reviewer.getId());
        revision.setRevisionNote(revisionRequest.getRevisionNote() != null ? 
                revisionRequest.getRevisionNote() : "Revised during review period");
        revision.setRevisedAt(Instant.now());
        kpiRevisionRepository.save(revision);
        
        // FR-KPI-REV-02: Update with new values and timestamp
        if (revisionRequest.getKpiName() != null) original.setKpi(revisionRequest.getKpiName());
        if (revisionRequest.getCategory() != null) original.setCategory(revisionRequest.getCategory());
        if (revisionRequest.getTarget() != null) original.setTarget(revisionRequest.getTarget());
        if (revisionRequest.getUnit() != null) original.setUnit(revisionRequest.getUnit());
        if (revisionRequest.getWeight() != null) original.setWeight(revisionRequest.getWeight());
        if (revisionRequest.getPriorityLevel() != null) original.setPriorityLevel(revisionRequest.getPriorityLevel());
        if (revisionRequest.getLogicDirection() != null) original.setLogicDirection(revisionRequest.getLogicDirection());
        
        original.setUpdatedBy(reviewer);
        original.setUpdatedDate(Instant.now());
        original.setRevisionNumber(original.getRevisionNumber() != null ? original.getRevisionNumber() + 1 : 1);
        
        // Recalculate metrics
        calculateKpiMetrics(original);
        
        // Log the revision
        logAudit(kpiId, "KPI_REVISION", 
                String.format("KPI revised from '%s' to '%s'. Revision note: %s", 
                        original.getKpi(), revisionRequest.getKpiName(), revisionRequest.getRevisionNote()),
                reviewer.getEmployeeName());
        
        return kpiRecordRepository.save(original);
    }

    /**
     * FR-KPI-VAL-01 to FR-KPI-VAL-04: Validate KPI weight before submission
     * System automatically totals KPI weights
     * Submission is blocked if total is not 100%
     * Validation message clearly explains the issue
     * Valid KPI records can be submitted successfully
     */
    public WeightValidationResult validateKpiWeights(List<KpiCreateDTO> kpis) {
        BigDecimal totalWeight = kpis.stream()
                .map(KpiCreateDTO::getWeight)
                .filter(w -> w != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        boolean isValid = totalWeight.compareTo(new BigDecimal("100")) == 0;
        String message;
        
        if (isValid) {
            message = "Weight validation passed. Total weight is 100%.";
        } else if (totalWeight.compareTo(new BigDecimal("100")) < 0) {
            message = String.format("Total KPI weight is %.2f%%. Please add %.2f%% more weight to reach 100%%.", 
                    totalWeight, new BigDecimal("100").subtract(totalWeight));
        } else {
            message = String.format("Total KPI weight is %.2f%%. Please reduce by %.2f%% to reach 100%%.", 
                    totalWeight, totalWeight.subtract(new BigDecimal("100")));
        }
        
        return WeightValidationResult.builder()
                .totalWeight(totalWeight)
                .isValid(isValid)
                .message(message)
                .build();
    }

    public WeightValidationResult validateKpiWeightsFromRecords(List<KpiRecord> records) {
        BigDecimal totalWeight = records.stream()
                .map(KpiRecord::getWeight)
                .filter(w -> w != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        boolean isValid = totalWeight.compareTo(new BigDecimal("100")) == 0;
        String message;
        
        if (isValid) {
            message = "Weight validation passed. Total weight is 100%.";
        } else if (totalWeight.compareTo(new BigDecimal("100")) < 0) {
            message = String.format("Total KPI weight is %.2f%%. Please add %.2f%% more weight.", 
                    totalWeight, new BigDecimal("100").subtract(totalWeight));
        } else {
            message = String.format("Total KPI weight is %.2f%%. Please reduce by %.2f%%.", 
                    totalWeight, totalWeight.subtract(new BigDecimal("100")));
        }
        
        return WeightValidationResult.builder()
                .totalWeight(totalWeight)
                .isValid(isValid)
                .message(message)
                .build();
    }

    // Inner class for validation result
    @lombok.Builder
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class WeightValidationResult {
        private BigDecimal totalWeight;
        private boolean isValid;
        private String message;
    }
}