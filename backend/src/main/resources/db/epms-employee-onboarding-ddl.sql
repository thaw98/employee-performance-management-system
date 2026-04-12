CREATE TABLE IF NOT EXISTS religions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS departments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS positions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS staff_type (
  id BIGINT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  UNIQUE KEY uq_staff_type_name (name)
);

INSERT IGNORE INTO staff_type (id, name) VALUES (1, 'Permanent'), (2, 'Probation');

CREATE TABLE IF NOT EXISTS employee_father (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  father_name VARCHAR(100) NULL,
  father_nrc_no VARCHAR(100) NULL,
  father_occupation VARCHAR(100) NULL
);

CREATE TABLE IF NOT EXISTS employee_spouse (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  spouse_name VARCHAR(100) NULL,
  spouse_nrc_no VARCHAR(100) NULL,
  spouse_occupation VARCHAR(100) NULL
);

CREATE TABLE IF NOT EXISTS employee_probation (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  probation_month INT NULL,
  probation_start_date DATE NULL,
  probation_end_date DATE NULL
);

CREATE TABLE IF NOT EXISTS employees (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  employee_id VARCHAR(100) NULL,
  employee_name VARCHAR(50) NULL,
  other_name VARCHAR(100) NULL,
  staff_nrc_no VARCHAR(100) NULL,
  gender ENUM('Male','Female') NULL,
  race VARCHAR(100) NULL,
  religion_id BIGINT NULL,
  date_of_birth DATE NULL,
  birth_place VARCHAR(255) NULL,
  contact_address VARCHAR(500) NULL,
  permanent_address VARCHAR(500) NULL,
  phone_no VARCHAR(20) NULL,
  marital_status ENUM('SINGLE','MARRIED') NULL,
  employee_spouse_id BIGINT NULL,
  department_id BIGINT NULL,
  position_id BIGINT NULL,
  nationality VARCHAR(100) NULL,
  staff_type_id BIGINT NULL,
  employee_probation_id BIGINT NULL,
  employee_father_id BIGINT NULL,
  date_of_joining DATE NULL,
  date_of_demotion DATE NULL,
  date_of_title_change DATE NULL,
  date_of_promotion DATE NULL,
  date_of_transfer DATE NULL,
  work_permit_no VARCHAR(100) NULL,
  work_permit_valid_date DATE NULL,
  work_permit_expire_date DATE NULL,
  labour_registration_no VARCHAR(100) NULL,
  permanent_phone_no VARCHAR(20) NULL,
  present_phone_no VARCHAR(20) NULL,
  emergency_mobile_no VARCHAR(20) NULL,
  relation_with_emergency_mobile_no VARCHAR(100) NULL,
  product_project VARCHAR(200) NULL,
  mobile_attendance VARCHAR(50) NULL,
  fingerprint VARCHAR(100) NULL,
  profile_picture_base64 LONGTEXT NULL,
  record_status VARCHAR(20) NULL,
  created_by BIGINT NULL,
  updated_by BIGINT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_employees_employee_id (employee_id),
  CONSTRAINT fk_employees_religion FOREIGN KEY (religion_id) REFERENCES religions(id),
  CONSTRAINT fk_employees_department FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_employees_position FOREIGN KEY (position_id) REFERENCES positions(id),
  CONSTRAINT fk_employees_staff_type FOREIGN KEY (staff_type_id) REFERENCES staff_type(id),
  CONSTRAINT fk_employees_employee_probation FOREIGN KEY (employee_probation_id) REFERENCES employee_probation(id),
  CONSTRAINT fk_employees_employee_father FOREIGN KEY (employee_father_id) REFERENCES employee_father(id),
  CONSTRAINT fk_employees_employee_spouse FOREIGN KEY (employee_spouse_id) REFERENCES employee_spouse(id)
);

CREATE TABLE IF NOT EXISTS passport (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  employee_id BIGINT NOT NULL UNIQUE,
  passport_no VARCHAR(100) NULL,
  passport_expire_date DATE NULL,
  CONSTRAINT fk_passport_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

ALTER TABLE users
  MODIFY COLUMN employee_id BIGINT NOT NULL,
  MODIFY COLUMN password VARCHAR(255) NOT NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  ADD CONSTRAINT fk_users_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
  ADD CONSTRAINT uq_users_email UNIQUE (email),
  ADD CONSTRAINT uq_users_employee UNIQUE (employee_id);

INSERT IGNORE INTO religions (name) VALUES
  ('Buddhist'), ('Christian'), ('Muslim'), ('Hindu');
