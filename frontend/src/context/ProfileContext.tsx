import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, CurrencyCode, CURRENCIES } from '../types';
import { api } from '../services/api';

interface ProfileContextType {
  profile: UserProfile;
  setCurrency: (code: CurrencyCode) => void;
  updateProfile: (updated: UserProfile) => Promise<void>;
  clearAllData: () => Promise<void>;
  currencySymbol: string;
  isLoading: boolean;
}

const getDefaultCurrency = (): CurrencyCode => {
  try {
    const locale = navigator.language || '';
    if (locale.includes('IN')) return 'INR';
    if (locale.includes('GB')) return 'GBP';
    if (['de', 'fr', 'es', 'it', 'nl', 'pt', 'EU'].some(c => locale.includes(c))) return 'EUR';
    return 'USD';
  } catch {
    return 'USD';
  }
};

const defaultProfile: UserProfile = {
  currency: getDefaultCurrency(),
  monthly_income: 5000,
  monthly_expenses: 2500,
  risk_tolerance: 'moderate',
  primary_goal: 'Build wealth and emergency savings',
};

const ProfileContext = createContext<ProfileContextType>({
  profile: defaultProfile,
  setCurrency: () => {},
  updateProfile: async () => {},
  clearAllData: async () => {},
  currencySymbol: '$',
  isLoading: false,
});

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await api.getProfile();
        if (data && data.currency) {
          setProfile(data);
        }
      } catch (err) {
        console.warn('Could not load profile from backend, using local defaults.');
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const setCurrency = async (currency: CurrencyCode) => {
    const updated = { ...profile, currency };
    setProfile(updated);
    try {
      await api.updateProfile(updated);
    } catch (e) {
      console.warn('Failed to sync currency change to server:', e);
    }
  };

  const updateProfile = async (updated: UserProfile) => {
    setProfile(updated);
    try {
      await api.updateProfile(updated);
    } catch (e) {
      console.error('Failed to update profile:', e);
    }
  };

  const clearAllData = async () => {
    try {
      await api.clearUserData();
      setProfile({
        ...defaultProfile,
        currency: getDefaultCurrency(),
      });
    } catch (e) {
      console.error('Failed to clear data:', e);
    }
  };

  const currencySymbol = CURRENCIES[profile.currency]?.symbol || '$';

  return (
    <ProfileContext.Provider
      value={{
        profile,
        setCurrency,
        updateProfile,
        clearAllData,
        currencySymbol,
        isLoading,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
