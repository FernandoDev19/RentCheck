export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  renterId: string;
  employeeId: string;
  branchId: string;
  roleId: number;
  status: 'active' | 'inactive' | 'suspended';
  deletedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
