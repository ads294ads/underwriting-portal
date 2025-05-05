import { loanApplications, type LoanApplication, type InsertLoanApplication } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Loan application methods
  getAllLoanApplications(): Promise<LoanApplication[]>;
  getLoanApplication(id: number): Promise<LoanApplication | undefined>;
  createLoanApplication(application: any): Promise<LoanApplication>;
  updateLoanApplication(id: number, data: Partial<LoanApplication>): Promise<LoanApplication>;
}

// Define the User types to maintain compatibility with existing interface
export type User = {
  id: number;
  username: string;
  password: string;
};

export type InsertUser = {
  username: string;
  password: string;
};

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private loanApplications: Map<number, LoanApplication>;
  private userCurrentId: number;
  private loanApplicationCurrentId: number;

  constructor() {
    this.users = new Map();
    this.loanApplications = new Map();
    this.userCurrentId = 1;
    this.loanApplicationCurrentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Loan application methods
  async getAllLoanApplications(): Promise<LoanApplication[]> {
    return Array.from(this.loanApplications.values());
  }

  async getLoanApplication(id: number): Promise<LoanApplication | undefined> {
    return this.loanApplications.get(id);
  }

  async createLoanApplication(application: any): Promise<LoanApplication> {
    const id = this.loanApplicationCurrentId++;
    const newApplication: LoanApplication = { 
      ...application, 
      id,
      createdAt: new Date()
    };
    this.loanApplications.set(id, newApplication);
    return newApplication;
  }

  async updateLoanApplication(id: number, data: Partial<LoanApplication>): Promise<LoanApplication> {
    const application = this.loanApplications.get(id);
    
    if (!application) {
      throw new Error(`Loan application with ID ${id} not found`);
    }
    
    const updatedApplication = { ...application, ...data };
    this.loanApplications.set(id, updatedApplication);
    
    return updatedApplication;
  }
}

export const storage = new MemStorage();
