package com.epms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_account")
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String password;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "is_active")
    private boolean active = true;

    @Column(name = "last_login")
    private Instant lastLogin;

    @Column(name = "created_date")
    private Instant createdDate;

    @Column(name = "password_reset_token", length = 255)
    private String passwordResetToken;

    @Column(name = "token_expiry")
    private Instant tokenExpiry;

    @Column(name = "must_change_password", nullable = false)
    private boolean mustChangePassword = true;

    @Column(name = "theme", length = 20)
    private String theme = "light";

    public String getEmail() {
        return employee != null ? employee.getEmail() : null;
    }

    public void setEmail(String email) {
        if (employee == null) {
            employee = new Employee();
        }
        employee.setEmail(email);
    }

    @Column(name = "wallpaper_url", length = 255)
    private String wallpaperUrl;

    @Column(name = "language", length = 50)
    private String language = "English";

    @Column(name = "timezone", length = 50)
    private String timezone = "UTC+06:30 (Yangon)";
}
