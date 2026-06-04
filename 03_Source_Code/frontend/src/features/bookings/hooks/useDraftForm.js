import { useState, useEffect } from 'react';

export const useDraftForm = (key, initialValues) => {
  const [values, setValues] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error reading localStorage for draft form', e);
    }
    return initialValues;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(values));
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  }, [key, values]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const setFieldValue = (name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const clearDraft = () => {
    setValues(initialValues);
    localStorage.removeItem(key);
  };

  return { values, handleChange, setFieldValue, clearDraft };
};
