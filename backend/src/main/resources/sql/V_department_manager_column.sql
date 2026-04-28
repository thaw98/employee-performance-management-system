ALTER TABLE department ADD COLUMN manager_id BIGINT NULL;

ALTER TABLE department
ADD CONSTRAINT fk_department_manager
FOREIGN KEY (manager_id) REFERENCES employee(employee_id);
