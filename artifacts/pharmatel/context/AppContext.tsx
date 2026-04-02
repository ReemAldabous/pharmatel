import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type {
  DiaryEntry,
  DoseSchedule,
  ObservationSession,
  Patient,
  Prescription,
} from "@/models";
import {
  addPrescription,
  deleteDiaryEntry,
  getDiaryEntries,
  getAuthToken,
  getObservationSessionByDose,
  getObservationSessions,
  getPrescriptions,
  login as loginService,
  logout as logoutService,
  MOCK_SYMPTOM_DEFINITIONS,
  removePrescription,
  saveObservationSession,
  saveDiaryEntry,
  updateDoseSchedule,
} from "@/services/storage";
import {
  cancelAllDoseNotifications,
  syncDoseReminderNotifications,
} from "@/services/doseNotifications";
import {
  handleDoseNotificationAction,
  setIncomingDoseNotification,
} from "@/notificationTasks";

interface AppContextValue {
  patient: Patient | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  prescriptions: Prescription[];
  observationSessions: ObservationSession[];
  diaryEntries: DiaryEntry[];
  currentDoseNotification: {
    notification: Notifications.Notification;
    prescriptionId: string;
    doseScheduleId: string;
  } | null;
  dismissDoseNotification: () => void;
  login: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  markDoseTaken: (
    prescriptionId: string,
    doseScheduleId: string,
    note?: string,
  ) => Promise<void>;
  refreshPrescriptions: () => Promise<void>;
  saveObservation: (session: ObservationSession) => Promise<void>;
  getSessionForDose: (
    doseScheduleId: string,
  ) => Promise<ObservationSession | null>;
  symptomDefinitions: typeof MOCK_SYMPTOM_DEFINITIONS;
  addDiaryEntry: (entry: DiaryEntry) => Promise<void>;
  updateDiaryEntry: (entry: DiaryEntry) => Promise<void>;
  removeDiaryEntry: (entryId: string) => Promise<void>;
  addUserPrescription: (prescription: Prescription) => Promise<void>;
  deleteUserPrescription: (prescriptionId: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [observationSessions, setObservationSessions] = useState<
    ObservationSession[]
  >([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [currentDoseNotification, setCurrentDoseNotification] = useState<{
    notification: Notifications.Notification;
    prescriptionId: string;
    doseScheduleId: string;
  } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    void syncDoseReminderNotifications(prescriptions);
  }, [isAuthenticated, prescriptions]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const applyAction = async (
      response: Notifications.NotificationResponse,
    ) => {
      console.log("Notification response received:", response);
      const data = response.notification.request.content.data;
      if (
        data &&
        typeof data === "object" &&
        "prescriptionId" in data &&
        "doseScheduleId" in data
      ) {
        const prescriptionId = data.prescriptionId as string;
        const doseScheduleId = data.doseScheduleId as string;
        console.log(
          "Setting current dose notification from response for:",
          prescriptionId,
          doseScheduleId,
        );
        setCurrentDoseNotification({
          notification: response.notification,
          prescriptionId,
          doseScheduleId,
        });
        setIncomingDoseNotification({
          notification: response.notification,
          prescriptionId,
          doseScheduleId,
        });
      }
      const handled = await handleDoseNotificationAction(response);
      if (handled) {
        const rxs = await getPrescriptions();
        setPrescriptions(rxs);
        setCurrentDoseNotification(null);
      }
    };

    const handleForegroundNotification = async (
      notification: Notifications.Notification,
    ) => {
      console.log("Foreground notification received:", notification);
      const data = notification.request.content.data;
      if (
        data &&
        typeof data === "object" &&
        "prescriptionId" in data &&
        "doseScheduleId" in data
      ) {
        const prescriptionId = data.prescriptionId as string;
        const doseScheduleId = data.doseScheduleId as string;
        console.log(
          "Setting current dose notification for:",
          prescriptionId,
          doseScheduleId,
        );
        setCurrentDoseNotification({
          notification,
          prescriptionId,
          doseScheduleId,
        });
        setIncomingDoseNotification({
          notification,
          prescriptionId,
          doseScheduleId,
        });
      }
    };

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        console.log("Last notification response:", response);
        void applyAction(response);
      }
    });

    const notificationSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        void handleForegroundNotification(notification);
      },
    );

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        void applyAction(response);
      },
    );

    return () => {
      notificationSub.remove();
      responseSub.remove();
    };
  }, [isAuthenticated]);

  const loadData = async () => {
    const [rxs, sessions, entries] = await Promise.all([
      getPrescriptions(),
      getObservationSessions(),
      getDiaryEntries(),
    ]);
    setPrescriptions(rxs);
    setObservationSessions(sessions);
    setDiaryEntries(entries);
  };

  const checkAuth = async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        const patientStr = await AsyncStorage.getItem("patient");
        if (patientStr) {
          setPatient(JSON.parse(patientStr));
          setIsAuthenticated(true);
          await loadData();
        }
      }
    } catch (e) {
      console.error("Auth check failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (username: string, password: string) => {
    const result = await loginService(username, password);
    if (result.success) {
      const patientStr = await AsyncStorage.getItem("patient");
      if (patientStr) setPatient(JSON.parse(patientStr));
      setIsAuthenticated(true);
      await loadData();
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await cancelAllDoseNotifications();
    await logoutService();
    setPatient(null);
    setIsAuthenticated(false);
    setPrescriptions([]);
    setObservationSessions([]);
    setDiaryEntries([]);
  }, []);

  const markDoseTaken = useCallback(
    async (prescriptionId: string, doseScheduleId: string, note?: string) => {
      const updates: Partial<DoseSchedule> = {
        status: "taken",
        takenAt: new Date().toISOString(),
        patientNote: note,
      };
      const updated = await updateDoseSchedule(
        prescriptionId,
        doseScheduleId,
        updates,
      );
      setPrescriptions(updated);
    },
    [],
  );

  const refreshPrescriptions = useCallback(async () => {
    const rxs = await getPrescriptions();
    setPrescriptions(rxs);
  }, []);

  const saveObservation = useCallback(async (session: ObservationSession) => {
    await saveObservationSession(session);
    const sessions = await getObservationSessions();
    setObservationSessions(sessions);
  }, []);

  const getSessionForDose = useCallback(async (doseScheduleId: string) => {
    return getObservationSessionByDose(doseScheduleId);
  }, []);

  const addDiaryEntry = useCallback(async (entry: DiaryEntry) => {
    await saveDiaryEntry(entry);
    const entries = await getDiaryEntries();
    setDiaryEntries(entries);
  }, []);

  const updateDiaryEntry = useCallback(async (entry: DiaryEntry) => {
    await saveDiaryEntry(entry);
    const entries = await getDiaryEntries();
    setDiaryEntries(entries);
  }, []);

  const removeDiaryEntry = useCallback(async (entryId: string) => {
    await deleteDiaryEntry(entryId);
    setDiaryEntries((prev) => prev.filter((e) => e.id !== entryId));
  }, []);

  const addUserPrescription = useCallback(
    async (prescription: Prescription) => {
      const updated = await addPrescription(prescription);
      setPrescriptions(updated);
    },
    [],
  );

  const deleteUserPrescription = useCallback(async (prescriptionId: string) => {
    const updated = await removePrescription(prescriptionId);
    setPrescriptions(updated);
  }, []);

  const dismissDoseNotification = useCallback(() => {
    setCurrentDoseNotification(null);
    setIncomingDoseNotification(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        patient,
        isAuthenticated,
        isLoading,
        prescriptions,
        observationSessions,
        diaryEntries,
        currentDoseNotification,
        dismissDoseNotification,
        login,
        logout,
        markDoseTaken,
        refreshPrescriptions,
        saveObservation,
        getSessionForDose,
        symptomDefinitions: MOCK_SYMPTOM_DEFINITIONS,
        addDiaryEntry,
        updateDiaryEntry,
        removeDiaryEntry,
        addUserPrescription,
        deleteUserPrescription,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
