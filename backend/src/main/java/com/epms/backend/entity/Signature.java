package com.epms.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "signatures")
@Getter
@Setter
@NoArgsConstructor
public class Signature {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "signature_data", columnDefinition = "LONGTEXT")
    private String signatureData; // Base64 or string

    @Column(name = "signature_type")
    private String signatureType; // CANVAS, FILE, TEXT

    @Column(name = "is_default")
    private boolean isDefault = false;

    public boolean isDefault() {
        return isDefault;
    }

    public void setDefault(boolean isDefault) {
        this.isDefault = isDefault;
    }

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
