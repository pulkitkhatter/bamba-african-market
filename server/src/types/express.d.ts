declare namespace Express {
  export interface Request {
    adminId?: string;
    adminRole?: "ADMIN" | "EMPLOYEE";
  }
}
