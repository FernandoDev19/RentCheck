import type { User } from "./user.model";

export interface Role {
  id: number;
  name: string;
  users?: User[];
}
