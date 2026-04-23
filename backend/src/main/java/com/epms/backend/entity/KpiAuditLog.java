// KpiAuditLog.java - Add PrePersist
package com.epms.backend.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "kpi_audit_log")
@Getter
@Setter
@NoArgsConstructor
public class KpiAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_id")
    private Long id;

    @Column(name = "employee_kpi_id")
    private Long kpiRecordId;

    @Column(name = "field_name")
    private String action;

    @Column(name = "new_value", columnDefinition = "text")
    private String details;

    @Column(name = "reason", columnDefinition = "text")
    private String reason;

    @Column(name = "change_date")
    private Instant createdAt;

    private String performedBy;
    
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}