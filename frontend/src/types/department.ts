export interface DepartmentDto {
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  status: string;
}

export interface DepartmentCreateDto {
  departmentCode: string;
  departmentName: string;
  status?: string;
}

export interface DepartmentUpdateDto {
  departmentCode: string;
  departmentName: string;
  status?: string;
}
