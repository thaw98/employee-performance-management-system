package com.epms.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "appraisal_import_session_item")
@Getter
@Setter
@NoArgsConstructor
public class AppraisalImportSessionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "`row_number`", nullable = false)
    private Integer rowNumber;

    /** VALID, INVALID, IMPORTED, FAILED */
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "row_data_json", columnDefinition = "TEXT")
    private String rowDataJson;

    @Column(name = "error_messages_json", columnDefinition = "TEXT")
    private String errorMessagesJson;
}
