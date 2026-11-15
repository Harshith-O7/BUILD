export type ModuleId =
  | 'dashboard'
  | 'resource-check'
  | 'projects'
  | 'site-progress'
  | 'workforce'
  | 'equipment'
  | 'materials'
  | 'budget'
  | 'safety'
  | 'daily-reports'
  | 'documents'
  | 'notifications'
  | 'settings';

export type ProjectStatus = 'Planning' | 'In Progress' | 'On Hold' | 'Completed';

export interface Project {
  id: string;
  projectCode: string;
  name: string;
  clientName: string;
  location: string;
  manager: string;
  startDate: string;
  expectedCompletionDate: string;
  budget: number;
  status: ProjectStatus;
  completionPercentage: number;
  description: string;
  imageUrl?: string;
}

export type ConstructionTrade =
  | 'Excavation'
  | 'Foundation Work'
  | 'Structural Work'
  | 'Brickwork'
  | 'Plumbing'
  | 'Electrical Work'
  | 'Roofing'
  | 'Painting'
  | 'Finishing';

export interface SiteTask {
  id: string;
  projectId: string;
  trade: ConstructionTrade;
  title: string;
  assignedEngineer: string;
  startDate?: string;
  deadline: string;
  plannedProgress: number;
  actualProgress: number;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  isDelayed: boolean;
  isMilestone?: boolean;
  dependsOn?: string[];
  notes?: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Leave';

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  role: string;
  category: 'Skilled' | 'Semi-Skilled' | 'Unskilled' | 'Engineering' | 'Supervisory';
  contactNumber: string;
  dailyWage: number;
  assignedProjectId: string;
  attendanceStatus: AttendanceStatus;
}

export type EquipmentStatus = 'Available' | 'In Use' | 'Under Maintenance';

export interface Equipment {
  id: string;
  equipmentCode: string;
  name: string;
  category: string;
  assignedProjectId: string;
  operatorName: string;
  purchaseDate: string;
  maintenanceDate: string;
  status: EquipmentStatus;
  hoursUsedThisMonth: number;
}

export type MaterialCategory =
  | 'Cement'
  | 'Steel'
  | 'Sand'
  | 'Bricks'
  | 'Concrete'
  | 'Gravel'
  | 'Paint'
  | 'Electrical Materials'
  | 'Plumbing Materials';

export interface MaterialItem {
  id: string;
  materialCode: string;
  name: MaterialCategory;
  quantity: number;
  unit: string;
  unitPrice: number;
  minStockLevel: number;
  supplier: string;
  consumedThisMonth: number;
  lastRestocked: string;
}

export type ExpenseCategory =
  | 'Labour'
  | 'Material'
  | 'Equipment'
  | 'Transportation'
  | 'Other';

export type PaymentStatus = 'Paid' | 'Pending' | 'Approved';

export interface Expense {
  id: string;
  projectId: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  vendor: string;
  paymentStatus: PaymentStatus;
  notes?: string;
}

export type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type IncidentStatus = 'Open' | 'Investigating' | 'Resolved';

export interface SafetyIncident {
  id: string;
  title: string;
  projectId: string;
  location: string;
  incidentDate: string;
  severity: IncidentSeverity;
  type: 'Incident' | 'Unsafe Condition';
  description: string;
  correctiveAction: string;
  status: IncidentStatus;
}

export interface SafetyInspection {
  id: string;
  projectId: string;
  inspectorName: string;
  date: string;
  ppeComplianceRate: number;
  findings: string;
  passed: boolean;
}

export interface DailyReport {
  id: string;
  reportDate: string;
  projectId: string;
  weatherConditions: 'Sunny' | 'Partly Cloudy' | 'Light Rain' | 'Heavy Rain' | 'Windy';
  workersCount: number;
  workCompleted: string;
  materialsUsed: string;
  equipmentUsed: string;
  siteChallenges: string;
  safetyObservations: string;
  workPlannedTomorrow: string;
  supervisorComments: string;
  supervisorName: string;
}

export type DocumentCategory =
  | 'Construction Drawings'
  | 'Site Photographs'
  | 'Work Orders'
  | 'Contracts'
  | 'Safety Documents'
  | 'Inspection Certificates'
  | 'Project Reports';

export interface SiteDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  projectId: string;
  uploadDate: string;
  fileSize: string;
  fileType: string;
  uploadedBy: string;
  fileUrl: string;
}

export type NotificationCategory =
  | 'Low Inventory'
  | 'Project Deadline'
  | 'Overdue Task'
  | 'Equipment Maintenance'
  | 'Safety Incident'
  | 'Budget Overrun';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  timestamp: string;
  read: boolean;
  targetModule: ModuleId;
  severity: 'info' | 'warning' | 'critical';
}

export type UserRole =
  | 'Manager'
  | 'Administrator'
  | 'Project Manager'
  | 'Site Manager'
  | 'Site Engineer'
  | 'Site Supervisor'
  | 'Accountant';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedSite: string;
  active: boolean;
}

export interface ActivityLog {
  id: string;
  type: 'project' | 'material' | 'inspection' | 'attendance' | 'safety' | 'expense';
  title: string;
  description: string;
  timestamp: string;
}

export interface UserSettings {
  profile: {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    avatarUrl: string;
  };
  company: {
    name: string;
    gstin: string;
    headquarters: string;
    contactEmail: string;
    currency: 'INR';
  };
  preferences: {
    defaultProjectView: 'cards' | 'table';
    fiscalYearStart: string;
    lowStockAlerts: boolean;
    safetyIncidentAlerts: boolean;
    budgetThresholdAlerts: boolean;
    maintenanceReminders: boolean;
    dailyReportReminders: boolean;
  };
}
