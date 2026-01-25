import { useState, useEffect, useCallback } from 'react';

export interface ITAsset {
  id: string;
  registrationNumber: string;
  type: string;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  invoiceUrl?: string;
  processor?: string;
  ramSize?: string;
  ramSerial?: string;
  storageType?: string;
  storageSize?: string;
  storageSerial?: string;
  motherboardModel?: string;
  motherboardSerial?: string;
  displayModel?: string;
  displaySerial?: string;
  macAddress?: string;
  warrantyTill: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
}

export interface ITPassword {
  id: string;
  portal: string;
  username: string;
  password: string;
  createdAt: string;
}

export interface NetworkImage {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

export interface TelephoneEntry {
  id: string;
  department: string;
  intercom: string;
  phoneNumber: string;
  createdAt: string;
}

export interface ITNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface ITHeadProfile {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  designation: string;
  profilePhoto: string;
}

const getStorageKey = (key: string) => `ithead_${key}`;

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(getStorageKey(key));
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(getStorageKey(key), JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export const useITHeadData = () => {
  const [assets, setAssets] = useState<ITAsset[]>(() => loadFromStorage('assets', []));
  const [passwords, setPasswords] = useState<ITPassword[]>(() => loadFromStorage('passwords', []));
  const [networkImages, setNetworkImages] = useState<NetworkImage[]>(() => loadFromStorage('networkImages', []));
  const [telephoneImages, setTelephoneImages] = useState<NetworkImage[]>(() => loadFromStorage('telephoneImages', []));
  const [telephoneEntries, setTelephoneEntries] = useState<TelephoneEntry[]>(() => loadFromStorage('telephoneEntries', []));
  const [notes, setNotes] = useState<ITNote[]>(() => loadFromStorage('notes', []));
  const [profile, setProfile] = useState<ITHeadProfile>(() => loadFromStorage('profile', {
    firstName: 'IT',
    lastName: 'Head',
    mobileNumber: '',
    designation: 'IT Head',
    profilePhoto: ''
  }));

  // Auto-save to localStorage
  useEffect(() => { saveToStorage('assets', assets); }, [assets]);
  useEffect(() => { saveToStorage('passwords', passwords); }, [passwords]);
  useEffect(() => { saveToStorage('networkImages', networkImages); }, [networkImages]);
  useEffect(() => { saveToStorage('telephoneImages', telephoneImages); }, [telephoneImages]);
  useEffect(() => { saveToStorage('telephoneEntries', telephoneEntries); }, [telephoneEntries]);
  useEffect(() => { saveToStorage('notes', notes); }, [notes]);
  useEffect(() => { saveToStorage('profile', profile); }, [profile]);

  // Generate registration number: VMCC/Brand/Year/Month/Number
  const generateRegistrationNumber = useCallback((brand: string): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const existingCount = assets.filter(a => 
      a.registrationNumber.includes(`VMCC/${brand.toUpperCase()}/${year}/${month}`)
    ).length;
    const number = String(existingCount + 1).padStart(3, '0');
    return `VMCC/${brand.toUpperCase()}/${year}/${month}/${number}`;
  }, [assets]);

  // Asset operations
  const addAsset = useCallback((asset: Omit<ITAsset, 'id' | 'registrationNumber' | 'createdAt'>) => {
    const newAsset: ITAsset = {
      ...asset,
      id: crypto.randomUUID(),
      registrationNumber: generateRegistrationNumber(asset.brand),
      createdAt: new Date().toISOString()
    };
    setAssets(prev => [newAsset, ...prev]);
    return newAsset;
  }, [generateRegistrationNumber]);

  const updateAsset = useCallback((id: string, updates: Partial<ITAsset>) => {
    setAssets(prev => prev.map(asset => 
      asset.id === id ? { ...asset, ...updates } : asset
    ));
  }, []);

  const deleteAsset = useCallback((id: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== id));
  }, []);

  const assignAsset = useCallback((id: string, employeeId: string, employeeName: string) => {
    updateAsset(id, { assignedTo: employeeId, assignedToName: employeeName });
  }, [updateAsset]);

  // Password operations
  const addPassword = useCallback((portal: string, username: string, password: string) => {
    const newEntry: ITPassword = {
      id: crypto.randomUUID(),
      portal,
      username,
      password,
      createdAt: new Date().toISOString()
    };
    setPasswords(prev => [newEntry, ...prev]);
  }, []);

  const updatePassword = useCallback((id: string, updates: Partial<ITPassword>) => {
    setPasswords(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deletePassword = useCallback((id: string) => {
    setPasswords(prev => prev.filter(p => p.id !== id));
  }, []);

  // Network image operations
  const addNetworkImage = useCallback((name: string, url: string) => {
    const newImage: NetworkImage = {
      id: crypto.randomUUID(),
      name,
      url,
      createdAt: new Date().toISOString()
    };
    setNetworkImages(prev => [newImage, ...prev]);
  }, []);

  const deleteNetworkImage = useCallback((id: string) => {
    setNetworkImages(prev => prev.filter(img => img.id !== id));
  }, []);

  // Telephone image operations
  const addTelephoneImage = useCallback((name: string, url: string) => {
    const newImage: NetworkImage = {
      id: crypto.randomUUID(),
      name,
      url,
      createdAt: new Date().toISOString()
    };
    setTelephoneImages(prev => [newImage, ...prev]);
  }, []);

  const deleteTelephoneImage = useCallback((id: string) => {
    setTelephoneImages(prev => prev.filter(img => img.id !== id));
  }, []);

  // Telephone entry operations
  const addTelephoneEntry = useCallback((department: string, intercom: string, phoneNumber: string) => {
    const newEntry: TelephoneEntry = {
      id: crypto.randomUUID(),
      department,
      intercom,
      phoneNumber,
      createdAt: new Date().toISOString()
    };
    setTelephoneEntries(prev => [newEntry, ...prev]);
  }, []);

  const updateTelephoneEntry = useCallback((id: string, updates: Partial<TelephoneEntry>) => {
    setTelephoneEntries(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTelephoneEntry = useCallback((id: string) => {
    setTelephoneEntries(prev => prev.filter(t => t.id !== id));
  }, []);

  // Notes operations
  const addNote = useCallback((content: string) => {
    const newNote: ITNote = {
      id: crypto.randomUUID(),
      content,
      createdAt: new Date().toISOString()
    };
    setNotes(prev => [newNote, ...prev]);
  }, []);

  const updateNote = useCallback((id: string, content: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content } : n));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  // Profile operations
  const updateProfile = useCallback((updates: Partial<ITHeadProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    // Data
    assets,
    passwords,
    networkImages,
    telephoneImages,
    telephoneEntries,
    notes,
    profile,
    // Asset operations
    addAsset,
    updateAsset,
    deleteAsset,
    assignAsset,
    generateRegistrationNumber,
    // Password operations
    addPassword,
    updatePassword,
    deletePassword,
    // Network image operations
    addNetworkImage,
    deleteNetworkImage,
    // Telephone operations
    addTelephoneImage,
    deleteTelephoneImage,
    addTelephoneEntry,
    updateTelephoneEntry,
    deleteTelephoneEntry,
    // Notes operations
    addNote,
    updateNote,
    deleteNote,
    // Profile operations
    updateProfile
  };
};
