import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  ActivityLog,
  AppNotification,
  AttendanceStatus,
  DailyReport,
  Employee,
  Equipment,
  Expense,
  MaterialItem,
  ModuleId,
  Project,
  SafetyIncident,
  SafetyInspection,
  SiteDocument,
  SiteTask,
  TeamMember,
  UserSettings,
} from '../types/construction';
import { initialSeedData, WorkspaceDataset } from '../data/seedData';
import {
  authenticateRoleLogin,
  LoginPortalId,
  ROLE_LOGIN_PORTALS,
  RoleSession,
} from '../utils/authRoles';
import {
  canRoleManageTeamRoles,
  getDefaultModuleForRole,
  resolveAllowedModuleForRole,
} from '../utils/rbac';
import {
  applyThemeToDocument,
  loadStoredTheme,
  saveStoredTheme,
  ThemeMode,
  toggleThemeMode,
} from '../utils/theme';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  isFirebaseConfigured,
  OperationType,
  storage,
  testFirestoreConnection,
} from '../lib/firebase';

const STORAGE_KEY = 'buildgrid_workspace_v1';
const ROLE_SESSION_KEY = 'buildgrid_role_session_v1';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

interface StoreContextValue {
  data: WorkspaceDataset;
  activeModule: ModuleId;
  setActiveModule: (module: ModuleId) => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;
  confirmState: ConfirmState;
  requestConfirm: (opts: Omit<ConfirmState, 'open'>) => void;
  closeConfirm: () => void;
  theme: ThemeMode;
  setTheme: (next: ThemeMode) => void;
  toggleTheme: () => void;

  // Auth & Sync
  user: User | null;
  roleSession: RoleSession | null;
  authReady: boolean;
  isCloudSynced: boolean;
  isLoading: boolean;
  loginWithRole: (
    portalId: LoginPortalId,
    identifier: string,
    password: string
  ) => { ok: boolean; error?: string };
  logoutRoleSession: () => void;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  resetDemoData: () => void;

  // CRUD: Projects
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;

  // CRUD: Site Tasks
  addTask: (task: Omit<SiteTask, 'id'>) => void;
  updateTask: (task: SiteTask) => void;
  deleteTask: (id: string) => void;

  // CRUD: Employees
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (emp: Employee) => void;
  deleteEmployee: (id: string) => void;
  setAttendance: (id: string, status: AttendanceStatus) => void;

  // CRUD: Equipment
  addEquipment: (eq: Omit<Equipment, 'id'>) => void;
  updateEquipment: (eq: Equipment) => void;
  deleteEquipment: (id: string) => void;

  // CRUD: Materials
  addMaterial: (mat: Omit<MaterialItem, 'id'>) => void;
  updateMaterial: (mat: MaterialItem) => void;
  deleteMaterial: (id: string) => void;
  adjustMaterialStock: (id: string, delta: number, mode: 'incoming' | 'consumption') => void;

  // CRUD: Expenses
  addExpense: (exp: Omit<Expense, 'id'>) => void;
  updateExpense: (exp: Expense) => void;
  deleteExpense: (id: string) => void;

  // CRUD: Safety
  addIncident: (inc: Omit<SafetyIncident, 'id'>) => void;
  updateIncident: (inc: SafetyIncident) => void;
  deleteIncident: (id: string) => void;
  addInspection: (ins: Omit<SafetyInspection, 'id'>) => void;

  // CRUD: Daily Reports
  addReport: (rep: Omit<DailyReport, 'id'>) => void;
  updateReport: (rep: DailyReport) => void;
  deleteReport: (id: string) => void;

  // CRUD: Documents
  uploadDocumentFile: (file: File) => Promise<{ url: string; sizeLabel: string; fileType: string }>;
  addDocument: (docItem: Omit<SiteDocument, 'id'>) => void;
  deleteDocument: (id: string) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;

  // Settings & Team
  updateSettings: (next: UserSettings) => void;
  addTeamMember: (member: Omit<TeamMember, 'id'>) => void;
  updateTeamMember: (member: TeamMember) => void;
  deleteTeamMember: (id: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function loadLocalDataset(): WorkspaceDataset {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialSeedData;
    const parsed = JSON.parse(raw) as Partial<WorkspaceDataset>;
    return {
      ...initialSeedData,
      ...parsed,
      settings: {
        ...initialSeedData.settings,
        ...(parsed.settings || {}),
        profile: {
          ...initialSeedData.settings.profile,
          ...(parsed.settings?.profile || {}),
        },
        company: {
          ...initialSeedData.settings.company,
          ...(parsed.settings?.company || {}),
        },
        preferences: {
          ...initialSeedData.settings.preferences,
          ...(parsed.settings?.preferences || {}),
        },
      },
    };
  } catch {
    return initialSeedData;
  }
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function loadRoleSession(): RoleSession | null {
  try {
    const raw = localStorage.getItem(ROLE_SESSION_KEY);
    if (raw) {
      return JSON.parse(raw) as RoleSession;
    }
    if (typeof window !== 'undefined' && window.location.search.includes('autostart=1')) {
      const siteMgr = ROLE_LOGIN_PORTALS.find((p) => p.id === 'site-manager')!;
      return {
        portalId: siteMgr.id,
        userId: siteMgr.defaultStaffId,
        displayName: siteMgr.defaultName,
        email: siteMgr.defaultEmail,
        userRole: siteMgr.userRole,
        defaultModule: siteMgr.defaultModule,
        loggedInAt: new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [roleSession, setRoleSession] = useState<RoleSession | null>(() => loadRoleSession());
  const [data, setData] = useState<WorkspaceDataset>(() => loadLocalDataset());
  const [activeModuleState, setActiveModuleState] = useState<ModuleId>(() => {
    const initialSession = loadRoleSession();
    return initialSession?.defaultModule || 'dashboard';
  });

  const currentRole = roleSession?.userRole || data.settings.profile.role;
  const activeModule = resolveAllowedModuleForRole(currentRole, activeModuleState);

  const setActiveModule = useCallback(
    (next: ModuleId) => {
      setActiveModuleState(resolveAllowedModuleForRole(currentRole, next));
    },
    [currentRole]
  );
  const [globalSearch, setGlobalSearch] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setThemeState] = useState<ThemeMode>(() => loadStoredTheme());

  useEffect(() => {
    applyThemeToDocument(theme);
    saveStoredTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => toggleThemeMode(prev));
  }, []);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'success') => {
    const id = makeId('toast');
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const requestConfirm = useCallback((opts: Omit<ConfirmState, 'open'>) => {
    setConfirmState({ ...opts, open: true });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, open: false }));
  }, []);

  // Persist demo workspace to localStorage whenever not in cloud mode
  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // Ignore storage quota errors in restricted browsers
      }
    }
  }, [data, user]);

  // Firebase Auth listener & connection check
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setAuthReady(true);
      return;
    }
    testFirestoreConnection().catch(() => {});
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Seed & Subscribe to Firestore when signed in
  useEffect(() => {
    if (!user || !db || !authReady) return;
    const firestoreDb = db;
    let active = true;
    let unsubSnapshot: (() => void) | null = null;

    const initCloudWorkspace = async () => {
      setIsLoading(true);
      const workspaceRef = doc(firestoreDb, 'workspaces', user.uid);
      try {
        const snap = await getDoc(workspaceRef);
        if (!snap.exists()) {
          const batch = writeBatch(firestoreDb);
          batch.set(workspaceRef, {
            ownerId: user.uid,
            companyName: initialSeedData.settings.company.name,
            updatedAt: serverTimestamp(),
          });

          const pushRecords = <T extends { id: string }>(entityType: string, items: T[]) => {
            items.forEach((item) => {
              const recRef = doc(firestoreDb, 'workspaces', user.uid, 'records', item.id);
              batch.set(recRef, {
                id: item.id,
                ownerId: user.uid,
                entityType,
                payload: item,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            });
          };

          pushRecords('project', initialSeedData.projects);
          pushRecords('task', initialSeedData.tasks);
          pushRecords('employee', initialSeedData.employees);
          pushRecords('equipment', initialSeedData.equipment);
          pushRecords('material', initialSeedData.materials);
          pushRecords('expense', initialSeedData.expenses);
          pushRecords('incident', initialSeedData.incidents);
          pushRecords('inspection', initialSeedData.inspections);
          pushRecords('report', initialSeedData.reports);
          pushRecords('document', initialSeedData.documents);
          pushRecords('notification', initialSeedData.notifications);
          pushRecords('teamMember', initialSeedData.teamMembers);
          pushRecords('activity', initialSeedData.activities);
          batch.set(doc(firestoreDb, 'workspaces', user.uid, 'records', 'user-settings'), {
            id: 'user-settings',
            ownerId: user.uid,
            entityType: 'settings',
            payload: {
              ...initialSeedData.settings,
              profile: {
                ...initialSeedData.settings.profile,
                name: user.displayName || initialSeedData.settings.profile.name,
                email: user.email || initialSeedData.settings.profile.email,
              },
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          await batch.commit();
        }
      } catch (err) {
        console.warn('Workspace bootstrap note:', err);
      }

      if (!active) return;

      const recordsQuery = query(
        collection(firestoreDb, 'workspaces', user.uid, 'records'),
        where('ownerId', '==', user.uid)
      );
      unsubSnapshot = onSnapshot(
        recordsQuery,
        (snapshot) => {
          const next: WorkspaceDataset = {
            projects: [],
            tasks: [],
            employees: [],
            equipment: [],
            materials: [],
            expenses: [],
            incidents: [],
            inspections: [],
            reports: [],
            documents: [],
            notifications: [],
            teamMembers: [],
            activities: [],
            settings: initialSeedData.settings,
          };

          snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            const payload = d.payload;
            switch (d.entityType) {
              case 'project': next.projects.push(payload); break;
              case 'task': next.tasks.push(payload); break;
              case 'employee': next.employees.push(payload); break;
              case 'equipment': next.equipment.push(payload); break;
              case 'material': next.materials.push(payload); break;
              case 'expense': next.expenses.push(payload); break;
              case 'incident': next.incidents.push(payload); break;
              case 'inspection': next.inspections.push(payload); break;
              case 'report': next.reports.push(payload); break;
              case 'document': next.documents.push(payload); break;
              case 'notification': next.notifications.push(payload); break;
              case 'teamMember': next.teamMembers.push(payload); break;
              case 'activity': next.activities.push(payload); break;
              case 'settings': next.settings = payload; break;
            }
          });

          if (snapshot.size > 0) {
            setData(next);
          }
          setIsLoading(false);
        },
        (error) => {
          setIsLoading(false);
          handleFirestoreError(error, OperationType.LIST, `workspaces/${user.uid}/records`);
        }
      );
    };

    initCloudWorkspace();

    return () => {
      active = false;
      if (unsubSnapshot) unsubSnapshot();
    };
  }, [user, authReady]);

  // Helper to sync individual record mutations to Firestore when signed in
  const syncUpsert = useCallback(
    async (entityType: string, id: string, payload: unknown, isNew: boolean) => {
      if (!user || !db) return;
      const recRef = doc(db, 'workspaces', user.uid, 'records', id);
      try {
        if (isNew) {
          await setDoc(recRef, {
            id,
            ownerId: user.uid,
            entityType,
            payload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(
            recRef,
            {
              payload,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch (err) {
        handleFirestoreError(
          err,
          isNew ? OperationType.CREATE : OperationType.UPDATE,
          `workspaces/${user.uid}/records/${id}`
        );
      }
    },
    [user]
  );

  const syncDelete = useCallback(
    async (id: string) => {
      if (!user || !db) return;
      const recRef = doc(db, 'workspaces', user.uid, 'records', id);
      try {
        await deleteDoc(recRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `workspaces/${user.uid}/records/${id}`);
      }
    },
    [user]
  );

  const pushActivity = useCallback(
    (type: ActivityLog['type'], title: string, description: string) => {
      const act: ActivityLog = {
        id: makeId('act'),
        type,
        title,
        description,
        timestamp: 'Just now',
      };
      setData((prev) => ({
        ...prev,
        activities: [act, ...prev.activities].slice(0, 15),
      }));
      void syncUpsert('activity', act.id, act, true);
    },
    [syncUpsert]
  );

  const loginWithRole = useCallback(
    (portalId: LoginPortalId, identifier: string, password: string) => {
      const result = authenticateRoleLogin({ portalId, identifier, password });
      if (!result.ok) {
        return { ok: false, error: result.error };
      }
      const session = result.session;
      try {
        localStorage.setItem(ROLE_SESSION_KEY, JSON.stringify(session));
      } catch {
        // Ignore storage errors
      }
      setRoleSession(session);
      setData((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          profile: {
            ...prev.settings.profile,
            name: session.displayName,
            email: session.email,
            role: session.userRole,
          },
        },
      }));
      setActiveModuleState(getDefaultModuleForRole(session.userRole));
      if (typeof window !== 'undefined' && window.location.hash.startsWith('#login')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      showToast(`Signed in as ${session.userRole} (${session.displayName}).`, 'success');
      return { ok: true };
    },
    [showToast]
  );

  const logoutRoleSession = useCallback(() => {
    try {
      localStorage.removeItem(ROLE_SESSION_KEY);
    } catch {
      // Ignore storage errors
    }
    setRoleSession(null);
    showToast('Signed out to role login portals.', 'info');
  }, [showToast]);

  const signInWithGoogle = useCallback(async () => {
    if (!auth || !googleProvider) {
      showToast('Firebase is not configured. Continuing in local Demo Mode.', 'info');
      return;
    }
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (!roleSession) {
        const sm = ROLE_LOGIN_PORTALS[1];
        const nextSession: RoleSession = {
          portalId: sm.id,
          userId: cred.user.uid,
          displayName: cred.user.displayName || sm.defaultName,
          email: cred.user.email || sm.defaultEmail,
          userRole: 'Administrator',
          defaultModule: 'dashboard',
          loggedInAt: new Date().toISOString(),
        };
        try {
          localStorage.setItem(ROLE_SESSION_KEY, JSON.stringify(nextSession));
        } catch {
          // Ignore storage errors
        }
        setRoleSession(nextSession);
      }
      showToast('Signed in with Google. Syncing workspace to Firestore...', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in cancelled';
      showToast(`Authentication failed: ${message}`, 'error');
    }
  }, [showToast, roleSession]);

  const signOutUser = useCallback(async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
    setData(loadLocalDataset());
    showToast('Signed out. Switched back to Demo Workspace.', 'info');
  }, [showToast]);

  const resetDemoData = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeedData));
    setData(initialSeedData);
    showToast('Demo workspace reset to initial sample dataset.', 'info');
  }, [showToast]);

  // Projects CRUD
  const addProject = useCallback(
    (project: Omit<Project, 'id'>) => {
      const newProject: Project = { ...project, id: makeId('prj') };
      setData((prev) => ({ ...prev, projects: [newProject, ...prev.projects] }));
      void syncUpsert('project', newProject.id, newProject, true);
      pushActivity('project', 'New project created', `${newProject.name} (${newProject.location}) added.`);
      showToast(`Project "${newProject.name}" created.`, 'success');
    },
    [syncUpsert, pushActivity, showToast]
  );

  const updateProject = useCallback(
    (project: Project) => {
      setData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => (p.id === project.id ? project : p)),
      }));
      void syncUpsert('project', project.id, project, false);
      showToast(`Project "${project.name}" updated.`, 'success');
    },
    [syncUpsert, showToast]
  );

  const deleteProject = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        projects: prev.projects.filter((p) => p.id !== id),
      }));
      void syncDelete(id);
      showToast('Project deleted.', 'info');
    },
    [syncDelete, showToast]
  );

  // Tasks CRUD
  const addTask = useCallback(
    (task: Omit<SiteTask, 'id'>) => {
      const newTask: SiteTask = { ...task, id: makeId('tsk') };
      setData((prev) => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
      void syncUpsert('task', newTask.id, newTask, true);
      showToast(`Site task "${newTask.title}" added.`, 'success');
    },
    [syncUpsert, showToast]
  );

  const updateTask = useCallback(
    (task: SiteTask) => {
      setData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === task.id ? task : t)),
      }));
      void syncUpsert('task', task.id, task, false);
      showToast(`Progress updated for "${task.title}".`, 'success');
    },
    [syncUpsert, showToast]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setData((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }));
      void syncDelete(id);
      showToast('Task removed.', 'info');
    },
    [syncDelete, showToast]
  );

  // Employees CRUD
  const addEmployee = useCallback(
    (emp: Omit<Employee, 'id'>) => {
      const newEmp: Employee = { ...emp, id: makeId('emp') };
      setData((prev) => ({ ...prev, employees: [newEmp, ...prev.employees] }));
      void syncUpsert('employee', newEmp.id, newEmp, true);
      pushActivity('attendance', 'New worker onboarded', `${newEmp.name} (${newEmp.role}) assigned.`);
      showToast(`${newEmp.name} added to workforce.`, 'success');
    },
    [syncUpsert, pushActivity, showToast]
  );

  const updateEmployee = useCallback(
    (emp: Employee) => {
      setData((prev) => ({
        ...prev,
        employees: prev.employees.map((e) => (e.id === emp.id ? emp : e)),
      }));
      void syncUpsert('employee', emp.id, emp, false);
      showToast(`Updated record for ${emp.name}.`, 'success');
    },
    [syncUpsert, showToast]
  );

  const deleteEmployee = useCallback(
    (id: string) => {
      setData((prev) => ({ ...prev, employees: prev.employees.filter((e) => e.id !== id) }));
      void syncDelete(id);
      showToast('Employee removed from roster.', 'info');
    },
    [syncDelete, showToast]
  );

  const setAttendance = useCallback(
    (id: string, status: AttendanceStatus) => {
      setData((prev) => {
        const updated = prev.employees.map((e) =>
          e.id === id ? { ...e, attendanceStatus: status } : e
        );
        const target = updated.find((e) => e.id === id);
        if (target) void syncUpsert('employee', id, target, false);
        return { ...prev, employees: updated };
      });
      showToast(`Attendance marked as ${status}.`, 'success');
    },
    [syncUpsert, showToast]
  );

  // Equipment CRUD
  const addEquipment = useCallback(
    (eq: Omit<Equipment, 'id'>) => {
      const newEq: Equipment = { ...eq, id: makeId('eq') };
      setData((prev) => ({ ...prev, equipment: [newEq, ...prev.equipment] }));
      void syncUpsert('equipment', newEq.id, newEq, true);
      showToast(`Equipment "${newEq.name}" added.`, 'success');
    },
    [syncUpsert, showToast]
  );

  const updateEquipment = useCallback(
    (eq: Equipment) => {
      setData((prev) => ({
        ...prev,
        equipment: prev.equipment.map((item) => (item.id === eq.id ? eq : item)),
      }));
      void syncUpsert('equipment', eq.id, eq, false);
      showToast(`Equipment "${eq.name}" updated.`, 'success');
    },
    [syncUpsert, showToast]
  );

  const deleteEquipment = useCallback(
    (id: string) => {
      setData((prev) => ({ ...prev, equipment: prev.equipment.filter((e) => e.id !== id) }));
      void syncDelete(id);
      showToast('Equipment record deleted.', 'info');
    },
    [syncDelete, showToast]
  );

  // Materials CRUD
  const addMaterial = useCallback(
    (mat: Omit<MaterialItem, 'id'>) => {
      const newMat: MaterialItem = { ...mat, id: makeId('mat') };
      setData((prev) => ({ ...prev, materials: [newMat, ...prev.materials] }));
      void syncUpsert('material', newMat.id, newMat, true);
      pushActivity('material', 'Material added', `${newMat.name}: ${newMat.quantity} ${newMat.unit} logged.`);
      showToast(`${newMat.name} added to inventory.`, 'success');
    },
    [syncUpsert, pushActivity, showToast]
  );

  const updateMaterial = useCallback(
    (mat: MaterialItem) => {
      setData((prev) => ({
        ...prev,
        materials: prev.materials.map((m) => (m.id === mat.id ? mat : m)),
      }));
      void syncUpsert('material', mat.id, mat, false);
      showToast(`${mat.name} inventory updated.`, 'success');
    },
    [syncUpsert, showToast]
  );

  const deleteMaterial = useCallback(
    (id: string) => {
      setData((prev) => ({ ...prev, materials: prev.materials.filter((m) => m.id !== id) }));
      void syncDelete(id);
      showToast('Material item deleted.', 'info');
    },
    [syncDelete, showToast]
  );

  const adjustMaterialStock = useCallback(
    (id: string, delta: number, mode: 'incoming' | 'consumption') => {
      const today = new Date().toISOString().slice(0, 10);
      setData((prev) => {
        let updatedItem: MaterialItem | undefined;
        const nextMaterials = prev.materials.map((m) => {
          if (m.id !== id) return m;
          const nextQty =
            mode === 'incoming' ? m.quantity + delta : Math.max(0, m.quantity - delta);
          updatedItem = {
            ...m,
            quantity: nextQty,
            consumedThisMonth:
              mode === 'consumption' ? m.consumedThisMonth + delta : m.consumedThisMonth,
            lastRestocked: mode === 'incoming' ? today : m.lastRestocked,
          };
          return updatedItem;
        });

        let nextNotifications = prev.notifications;
        if (updatedItem) {
          void syncUpsert('material', id, updatedItem, false);
          if (updatedItem.quantity <= updatedItem.minStockLevel) {
            const alert: AppNotification = {
              id: makeId('ntf'),
              title: `Low Inventory Alert: ${updatedItem.name}`,
              message: `${updatedItem.name} dropped to ${updatedItem.quantity} ${updatedItem.unit} (minimum: ${updatedItem.minStockLevel}).`,
              category: 'Low Inventory',
              timestamp: new Date().toISOString(),
              read: false,
              targetModule: 'materials',
              severity: updatedItem.quantity === 0 ? 'critical' : 'warning',
            };
            nextNotifications = [alert, ...prev.notifications];
            void syncUpsert('notification', alert.id, alert, true);
          }
        }
        return { ...prev, materials: nextMaterials, notifications: nextNotifications };
      });
      pushActivity(
        'material',
        mode === 'incoming' ? 'Material received' : 'Material consumed',
        `${delta} units recorded as ${mode}.`
      );
      showToast(
        mode === 'incoming' ? 'Incoming material stock recorded.' : 'Material consumption logged.',
        'success'
      );
    },
    [syncUpsert, pushActivity, showToast]
  );

  // Expenses CRUD
  const addExpense = useCallback(
    (exp: Omit<Expense, 'id'>) => {
      const newExp: Expense = { ...exp, id: makeId('exp') };
      setData((prev) => ({ ...prev, expenses: [newExp, ...prev.expenses] }));
      void syncUpsert('expense', newExp.id, newExp, true);
      pushActivity('expense', 'Expense recorded', `${newExp.title} logged under ${newExp.category}.`);
      showToast(`Expense "${newExp.title}" recorded.`, 'success');
    },
    [syncUpsert, pushActivity, showToast]
  );

  const updateExpense = useCallback(
    (exp: Expense) => {
      setData((prev) => ({
        ...prev,
        expenses: prev.expenses.map((e) => (e.id === exp.id ? exp : e)),
      }));
      void syncUpsert('expense', exp.id, exp, false);
      showToast(`Expense "${exp.title}" updated.`, 'success');
    },
    [syncUpsert, showToast]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      setData((prev) => ({ ...prev, expenses: prev.expenses.filter((e) => e.id !== id) }));
      void syncDelete(id);
      showToast('Expense entry deleted.', 'info');
    },
    [syncDelete, showToast]
  );

  // Safety CRUD
  const addIncident = useCallback(
    (inc: Omit<SafetyIncident, 'id'>) => {
      const newInc: SafetyIncident = { ...inc, id: makeId('inc') };
      const alert: AppNotification = {
        id: makeId('ntf'),
        title: `Safety ${newInc.severity}: ${newInc.title}`,
        message: `${newInc.type} reported at ${newInc.location}.`,
        category: 'Safety Incident',
        timestamp: new Date().toISOString(),
        read: false,
        targetModule: 'safety',
        severity: newInc.severity === 'Critical' || newInc.severity === 'High' ? 'critical' : 'warning',
      };
      setData((prev) => ({
        ...prev,
        incidents: [newInc, ...prev.incidents],
        notifications: [alert, ...prev.notifications],
      }));
      void syncUpsert('incident', newInc.id, newInc, true);
      void syncUpsert('notification', alert.id, alert, true);
      pushActivity('safety', 'Safety issue reported', `${newInc.title} (${newInc.severity}).`);
      showToast('Safety report submitted.', 'warning');
    },
    [syncUpsert, pushActivity, showToast]
  );

  const updateIncident = useCallback(
    (inc: SafetyIncident) => {
      setData((prev) => ({
        ...prev,
        incidents: prev.incidents.map((i) => (i.id === inc.id ? inc : i)),
      }));
      void syncUpsert('incident', inc.id, inc, false);
      showToast(`Incident status updated to ${inc.status}.`, 'success');
    },
    [syncUpsert, showToast]
  );

  const deleteIncident = useCallback(
    (id: string) => {
      setData((prev) => ({ ...prev, incidents: prev.incidents.filter((i) => i.id !== id) }));
      void syncDelete(id);
      showToast('Safety record deleted.', 'info');
    },
    [syncDelete, showToast]
  );

  const addInspection = useCallback(
    (ins: Omit<SafetyInspection, 'id'>) => {
      const newIns: SafetyInspection = { ...ins, id: makeId('ins') };
      setData((prev) => ({ ...prev, inspections: [newIns, ...prev.inspections] }));
      void syncUpsert('inspection', newIns.id, newIns, true);
      pushActivity('inspection', 'Site inspection completed', `${newIns.inspectorName} logged ${newIns.ppeComplianceRate}% PPE compliance.`);
      showToast('Safety inspection logged.', 'success');
    },
    [syncUpsert, pushActivity, showToast]
  );

  // Daily Reports CRUD
  const addReport = useCallback(
    (rep: Omit<DailyReport, 'id'>) => {
      const newRep: DailyReport = { ...rep, id: makeId('rep') };
      setData((prev) => ({ ...prev, reports: [newRep, ...prev.reports] }));
      void syncUpsert('report', newRep.id, newRep, true);
      showToast('Daily site report published.', 'success');
    },
    [syncUpsert, showToast]
  );

  const updateReport = useCallback(
    (rep: DailyReport) => {
      setData((prev) => ({
        ...prev,
        reports: prev.reports.map((r) => (r.id === rep.id ? rep : r)),
      }));
      void syncUpsert('report', rep.id, rep, false);
      showToast('Daily site report updated.', 'success');
    },
    [syncUpsert, showToast]
  );

  const deleteReport = useCallback(
    (id: string) => {
      setData((prev) => ({ ...prev, reports: prev.reports.filter((r) => r.id !== id) }));
      void syncDelete(id);
      showToast('Daily report deleted.', 'info');
    },
    [syncDelete, showToast]
  );

  // Documents CRUD + Storage Upload
  const uploadDocumentFile = useCallback(
    async (file: File): Promise<{ url: string; sizeLabel: string; fileType: string }> => {
      const kb = file.size / 1024;
      const sizeLabel = kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`;
      const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';

      if (user && storage) {
        try {
          const storageRef = ref(storage, `workspaces/${user.uid}/docs/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          return { url, sizeLabel, fileType: ext };
        } catch (err) {
          console.warn('Firebase Storage unavailable, storing local preview URL:', err);
        }
      }

      const dataUrl = await new Promise<string>((resolve) => {
        if (file.size <= 512 * 1024) {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        } else {
          resolve(URL.createObjectURL(file));
        }
      });

      return { url: dataUrl, sizeLabel, fileType: ext };
    },
    [user]
  );

  const addDocument = useCallback(
    (docItem: Omit<SiteDocument, 'id'>) => {
      const newDoc: SiteDocument = { ...docItem, id: makeId('doc') };
      setData((prev) => ({ ...prev, documents: [newDoc, ...prev.documents] }));
      void syncUpsert('document', newDoc.id, newDoc, true);
      showToast(`Document "${newDoc.title}" uploaded.`, 'success');
    },
    [syncUpsert, showToast]
  );

  const deleteDocument = useCallback(
    (id: string) => {
      setData((prev) => ({ ...prev, documents: prev.documents.filter((d) => d.id !== id) }));
      void syncDelete(id);
      showToast('Document deleted.', 'info');
    },
    [syncDelete, showToast]
  );

  // Notifications
  const markNotificationRead = useCallback(
    (id: string) => {
      setData((prev) => {
        const nextList = prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
        const target = nextList.find((n) => n.id === id);
        if (target) void syncUpsert('notification', id, target, false);
        return { ...prev, notifications: nextList };
      });
    },
    [syncUpsert]
  );

  const markAllNotificationsRead = useCallback(() => {
    setData((prev) => {
      const nextList = prev.notifications.map((n) => ({ ...n, read: true }));
      nextList.forEach((n) => void syncUpsert('notification', n.id, n, false));
      return { ...prev, notifications: nextList };
    });
    showToast('All notifications marked as read.', 'success');
  }, [syncUpsert, showToast]);

  const deleteNotification = useCallback(
    (id: string) => {
      setData((prev) => ({ ...prev, notifications: prev.notifications.filter((n) => n.id !== id) }));
      void syncDelete(id);
    },
    [syncDelete]
  );

  // Settings & Team
  const updateSettings = useCallback(
    (next: UserSettings) => {
      const lockedRole =
        roleSession && !canRoleManageTeamRoles(roleSession.userRole)
          ? roleSession.userRole
          : next.profile.role;
      const sanitized: UserSettings = {
        ...next,
        profile: {
          ...next.profile,
          role: lockedRole,
        },
      };
      setData((prev) => ({ ...prev, settings: sanitized }));
      void syncUpsert('settings', 'user-settings', sanitized, false);
      showToast('Settings saved successfully.', 'success');
    },
    [syncUpsert, showToast, roleSession]
  );

  const addTeamMember = useCallback(
    (member: Omit<TeamMember, 'id'>) => {
      const newMember: TeamMember = { ...member, id: makeId('tm') };
      setData((prev) => ({ ...prev, teamMembers: [newMember, ...prev.teamMembers] }));
      void syncUpsert('teamMember', newMember.id, newMember, true);
      showToast(`Added ${newMember.name} (${newMember.role}).`, 'success');
    },
    [syncUpsert, showToast]
  );

  const updateTeamMember = useCallback(
    (member: TeamMember) => {
      setData((prev) => ({
        ...prev,
        teamMembers: prev.teamMembers.map((m) => (m.id === member.id ? member : m)),
      }));
      void syncUpsert('teamMember', member.id, member, false);
      showToast(`Updated role for ${member.name}.`, 'success');
    },
    [syncUpsert, showToast]
  );

  const deleteTeamMember = useCallback(
    (id: string) => {
      setData((prev) => ({ ...prev, teamMembers: prev.teamMembers.filter((m) => m.id !== id) }));
      void syncDelete(id);
      showToast('Team member removed.', 'info');
    },
    [syncDelete, showToast]
  );

  return (
    <StoreContext.Provider
      value={{
        data,
        activeModule,
        setActiveModule,
        globalSearch,
        setGlobalSearch,
        toasts,
        showToast,
        dismissToast,
        confirmState,
        requestConfirm,
        closeConfirm,
        theme,
        setTheme,
        toggleTheme,
        user,
        roleSession,
        authReady,
        isCloudSynced: Boolean(user && db),
        isLoading,
        loginWithRole,
        logoutRoleSession,
        signInWithGoogle,
        signOutUser,
        resetDemoData,
        addProject,
        updateProject,
        deleteProject,
        addTask,
        updateTask,
        deleteTask,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        setAttendance,
        addEquipment,
        updateEquipment,
        deleteEquipment,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        adjustMaterialStock,
        addExpense,
        updateExpense,
        deleteExpense,
        addIncident,
        updateIncident,
        deleteIncident,
        addInspection,
        addReport,
        updateReport,
        deleteReport,
        uploadDocumentFile,
        addDocument,
        deleteDocument,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        updateSettings,
        addTeamMember,
        updateTeamMember,
        deleteTeamMember,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
