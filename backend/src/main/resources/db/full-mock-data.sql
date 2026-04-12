-- =========================================================
-- EPMS FIXED FULL MOCK DATA SQL
-- Safe version: uses position/department name lookups
-- Password for all users: ACE12345
-- BCrypt hash used below:
-- $2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w
-- =========================================================

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM `users`;
DELETE FROM `employees`;
DELETE FROM `positions`;
DELETE FROM `departments`;

ALTER TABLE `departments` AUTO_INCREMENT = 1;
ALTER TABLE `positions` AUTO_INCREMENT = 1;
ALTER TABLE `employees` AUTO_INCREMENT = 1;
ALTER TABLE `users` AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- 1. DEPARTMENTS
-- =========================================================
INSERT INTO `departments` (`name`) VALUES
('Executive Office'),
('HR'),
('Engineering'),
('Sales'),
('Product'),
('Operations'),
('Marketing'),
('Finance'),
('Administration'),
('Legal'),
('Call Center');

-- =========================================================
-- 2. POSITIONS
-- =========================================================
INSERT INTO `positions` (`name`, `department_id`) VALUES
('CHAIRMAN', NULL),
('CEO', NULL),
('COO', NULL),
('EXECUTIVE DIRECTOR', NULL),
('GENERAL MANAGER', NULL),
('EXTERNAL CONSULTANTS', NULL),

('PS HEAD', (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1)),
('SALES HEAD', (SELECT id FROM departments WHERE name = 'Sales' LIMIT 1)),
('PRODUCT HEAD', (SELECT id FROM departments WHERE name = 'Product' LIMIT 1)),
('OM HEAD', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1)),
('MARKETING HEAD', (SELECT id FROM departments WHERE name = 'Marketing' LIMIT 1)),
('SENIOR FINANCE OFFICER', (SELECT id FROM departments WHERE name = 'Finance' LIMIT 1)),
('HR', (SELECT id FROM departments WHERE name = 'HR' LIMIT 1)),
('SENIOR ADMIN OFFICER', (SELECT id FROM departments WHERE name = 'Administration' LIMIT 1)),
('CORPORATE LAWYER', (SELECT id FROM departments WHERE name = 'Legal' LIMIT 1)),

('ACCOUNT MANAGER', (SELECT id FROM departments WHERE name = 'Sales' LIMIT 1)),
('PROJECT MANAGER', (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1)),
('CALL CENTER SUPERVISOR', (SELECT id FROM departments WHERE name = 'Call Center' LIMIT 1)),

('TEAM LEADER', (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1)),
('LEAD DESIGNER', (SELECT id FROM departments WHERE name = 'Marketing' LIMIT 1)),
('SSE', (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1)),
('DESIGNER', (SELECT id FROM departments WHERE name = 'Marketing' LIMIT 1)),
('SALES EXECUTIVE', (SELECT id FROM departments WHERE name = 'Sales' LIMIT 1)),
('SALES ADMIN', (SELECT id FROM departments WHERE name = 'Sales' LIMIT 1)),
('TRANSLATOR', (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1)),

('SE', (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1)),
('JUNIOR FINANCE OFFICER', (SELECT id FROM departments WHERE name = 'Finance' LIMIT 1)),
('JUNIOR HR', (SELECT id FROM departments WHERE name = 'HR' LIMIT 1)),
('JUNIOR ADMIN OFFICER', (SELECT id FROM departments WHERE name = 'Administration' LIMIT 1)),
('CALL CENTER OFFICER', (SELECT id FROM departments WHERE name = 'Call Center' LIMIT 1)),

('OJT', (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1)),
('DRIVERS', (SELECT id FROM departments WHERE name = 'Administration' LIMIT 1)),
('CLEANERS', (SELECT id FROM departments WHERE name = 'Administration' LIMIT 1)),
('SECURITY', (SELECT id FROM departments WHERE name = 'Administration' LIMIT 1));

-- =========================================================
-- 3. EMPLOYEES
-- NOTE:
-- We use subqueries for department_id and position_id.
-- This is the key fix for Error Code: 1452.
-- =========================================================
INSERT INTO `employees`
(
  `employee_id`,
  `employee_name`,
  `email_address`,
  `gender`,
  `marital_status`,
  `record_status`,
  `created_at`,
  `updated_at`,
  `department_id`,
  `position_id`,
  `nationality_id`,
  `religion_id`
)
VALUES
('ACE001', 'Aung Chairman', 'aungchairman@gmail.com', 'Male', 'Married', 'COMPLETED', NOW(), NOW(), NULL, (SELECT id FROM positions WHERE name = 'CHAIRMAN' LIMIT 1), NULL, NULL),
('ACE002', 'Mya CEO', 'myaceo@gmail.com', 'Female', 'Married', 'COMPLETED', NOW(), NOW(), NULL, (SELECT id FROM positions WHERE name = 'CEO' LIMIT 1), NULL, NULL),
('ACE003', 'Ko COO', 'kocoo@gmail.com', 'Male', 'Married', 'COMPLETED', NOW(), NOW(), NULL, (SELECT id FROM positions WHERE name = 'COO' LIMIT 1), NULL, NULL),
('ACE004', 'Su Executive Director', 'suexecutivedirector@gmail.com', 'Female', 'Single', 'COMPLETED', NOW(), NOW(), NULL, (SELECT id FROM positions WHERE name = 'EXECUTIVE DIRECTOR' LIMIT 1), NULL, NULL),
('ACE005', 'Min General Manager', 'mingeneralmanager@gmail.com', 'Male', 'Married', 'COMPLETED', NOW(), NOW(), NULL, (SELECT id FROM positions WHERE name = 'GENERAL MANAGER' LIMIT 1), NULL, NULL),
('ACE006', 'Lwin External Consultant', 'lwinexternalconsultants@gmail.com', 'Male', 'Single', 'COMPLETED', NOW(), NOW(), NULL, (SELECT id FROM positions WHERE name = 'EXTERNAL CONSULTANTS' LIMIT 1), NULL, NULL),

('ACE007', 'Thaw PS Head', 'thawpshead@gmail.com', 'Male', 'Married', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'PS HEAD' LIMIT 1), NULL, NULL),

('ACE008', 'Hnin Sales Head', 'hninsaleshead@gmail.com', 'Female', 'Married', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Sales' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'SALES HEAD' LIMIT 1), NULL, NULL),

('ACE009', 'Zaw Product Head', 'zawproducthead@gmail.com', 'Male', 'Married', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Product' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'PRODUCT HEAD' LIMIT 1), NULL, NULL),

('ACE010', 'Ei OM Head', 'eiomhead@gmail.com', 'Female', 'Married', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'OM HEAD' LIMIT 1), NULL, NULL),

('ACE011', 'May Marketing Head', 'maymarketinghead@gmail.com', 'Female', 'Single', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Marketing' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'MARKETING HEAD' LIMIT 1), NULL, NULL),

('ACE012', 'Aye Senior Finance Officer', 'ayeseniorfinanceofficer@gmail.com', 'Female', 'Married', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Finance' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'SENIOR FINANCE OFFICER' LIMIT 1), NULL, NULL),

('ACE013', 'Nilar HR', 'nilarhr@gmail.com', 'Female', 'Married', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'HR' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'HR' LIMIT 1), NULL, NULL),

('ACE014', 'Kyaw Senior Admin Officer', 'kyawsenioradminofficer@gmail.com', 'Male', 'Married', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Administration' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'SENIOR ADMIN OFFICER' LIMIT 1), NULL, NULL),

('ACE015', 'Cherry Corporate Lawyer', 'cherrycorporatelawyer@gmail.com', 'Female', 'Single', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Legal' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'CORPORATE LAWYER' LIMIT 1), NULL, NULL),

('ACE016', 'Tun Account Manager', 'tunaccountmanager@gmail.com', 'Male', 'Married', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Sales' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'ACCOUNT MANAGER' LIMIT 1), NULL, NULL),

('ACE017', 'Htet Project Manager', 'htetprojectmanager@gmail.com', 'Male', 'Married', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'PROJECT MANAGER' LIMIT 1), NULL, NULL),

('ACE018', 'Poe Call Center Supervisor', 'poecallcentersupervisor@gmail.com', 'Female', 'Single', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Call Center' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'CALL CENTER SUPERVISOR' LIMIT 1), NULL, NULL),

('ACE019', 'Moe Team Leader', 'moeteamleader@gmail.com', 'Male', 'Married', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'TEAM LEADER' LIMIT 1), NULL, NULL),

('ACE020', 'Yoon Lead Designer', 'yoonleaddesigner@gmail.com', 'Female', 'Single', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Marketing' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'LEAD DESIGNER' LIMIT 1), NULL, NULL),

('ACE021', 'Wai SSE', 'waisse@gmail.com', 'Male', 'Married', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'SSE' LIMIT 1), NULL, NULL),

('ACE022', 'Hla Designer', 'hladesigner@gmail.com', 'Female', 'Single', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Marketing' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'DESIGNER' LIMIT 1), NULL, NULL),

('ACE023', 'Nyein Sales Executive', 'nyeinsalesexecutive@gmail.com', 'Female', 'Single', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Sales' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'SALES EXECUTIVE' LIMIT 1), NULL, NULL),

('ACE024', 'Shine Sales Admin', 'shinesalesadmin@gmail.com', 'Male', 'Single', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Sales' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'SALES ADMIN' LIMIT 1), NULL, NULL),

('ACE025', 'Yu Translator', 'yutranslator@gmail.com', 'Female', 'Single', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'TRANSLATOR' LIMIT 1), NULL, NULL),

('ACE026', 'Zin SE', 'zinse@gmail.com', 'Female', 'Single', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'SE' LIMIT 1), NULL, NULL),

('ACE027', 'Soe Junior Finance Officer', 'soejuniorfinance@gmail.com', 'Male', 'Single', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Finance' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'JUNIOR FINANCE OFFICER' LIMIT 1), NULL, NULL),

('ACE028', 'Khin Junior HR', 'khinjuniorhr@gmail.com', 'Female', 'Single', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'HR' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'JUNIOR HR' LIMIT 1), NULL, NULL),

('ACE029', 'Phyu Junior Admin Officer', 'phyujunioradminofficer@gmail.com', 'Female', 'Single', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Administration' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'JUNIOR ADMIN OFFICER' LIMIT 1), NULL, NULL),

('ACE030', 'Akar Call Center Officer', 'akarcallcenterofficer@gmail.com', 'Male', 'Single', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Call Center' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'CALL CENTER OFFICER' LIMIT 1), NULL, NULL),

('ACE031', 'Lin OJT', 'linojt@gmail.com', 'Male', 'Single', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'OJT' LIMIT 1), NULL, NULL),

('ACE032', 'Ba Drivers', 'badrivers@gmail.com', 'Male', 'Married', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Administration' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'DRIVERS' LIMIT 1), NULL, NULL),

('ACE033', 'Moe Cleaners', 'moecleaners@gmail.com', 'Female', 'Married', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Administration' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'CLEANERS' LIMIT 1), NULL, NULL),

('ACE034', 'Win Security', 'winsecurity@gmail.com', 'Male', 'Married', 'COMPLETED', NOW(), NOW(),
 (SELECT id FROM departments WHERE name = 'Administration' LIMIT 1),
 (SELECT id FROM positions WHERE name = 'SECURITY' LIMIT 1), NULL, NULL);

-- =========================================================
-- 4. USERS
-- role:
-- 1 = HR
-- 2 = DEPARTMENT_HEAD
-- 3 = TEAM_HEAD
-- 4 = Employee
-- =========================================================
INSERT INTO `users`
(`is_active`, `email`, `enabled`, `must_change_password`, `password`, `employee_id`, `role_id`)
VALUES
(1, 'aungchairman@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE001', 4),
(1, 'myaceo@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE002', 4),
(1, 'kocoo@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE003', 4),
(1, 'suexecutivedirector@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE004', 4),
(1, 'mingeneralmanager@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE005', 4),
(1, 'lwinexternalconsultants@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE006', 4),

(1, 'thawpshead@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE007', 2),
(1, 'hninsaleshead@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE008', 2),
(1, 'zawproducthead@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE009', 2),
(1, 'eiomhead@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE010', 2),
(1, 'maymarketinghead@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE011', 2),
(1, 'ayeseniorfinanceofficer@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE012', 2),
(1, 'nilarhr@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE013', 1),
(1, 'kyawsenioradminofficer@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE014', 2),
(1, 'cherrycorporatelawyer@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE015', 2),

(1, 'tunaccountmanager@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE016', 3),
(1, 'htetprojectmanager@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE017', 3),
(1, 'poecallcentersupervisor@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE018', 3),
(1, 'moeteamleader@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE019', 3),
(1, 'yoonleaddesigner@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE020', 3),
(1, 'waisse@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE021', 3),

(1, 'hladesigner@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE022', 4),
(1, 'nyeinsalesexecutive@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE023', 4),
(1, 'shinesalesadmin@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE024', 4),
(1, 'yutranslator@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE025', 4),
(1, 'zinse@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE026', 4),
(1, 'soejuniorfinance@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE027', 4),
(1, 'khinjuniorhr@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE028', 4),
(1, 'phyujunioradminofficer@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE029', 4),
(1, 'akarcallcenterofficer@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE030', 4),
(1, 'linojt@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE031', 4),
(1, 'badrivers@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE032', 4),
(1, 'moecleaners@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE033', 4),
(1, 'winsecurity@gmail.com', 1, 0, '$2a$10$NkC5mXJSxMq0H1WqV5ZbUe9L8fR2pS3tA4vB6nM7kP8qR9sT0uV1w', 'ACE034', 4);

-- =========================================================
-- 5. CHECK RESULT
-- =========================================================
SELECT e.employee_id, e.employee_name, p.name AS position_name, d.name AS department_name, u.email, u.role_id
FROM employees e
LEFT JOIN positions p ON e.position_id = p.id
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN users u ON u.employee_id = e.employee_id
ORDER BY e.employee_id;

UPDATE users SET password = 'ACE12345';
