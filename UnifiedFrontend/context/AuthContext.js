import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userPhone, setUserPhone] = useState(null);
  const [assignedVehicle, setAssignedVehicle] = useState(null);

  return (
    <AuthContext.Provider value={{
      userRole, setUserRole,
      userId, setUserId,
      userName, setUserName,
      userPhone, setUserPhone,
      assignedVehicle, setAssignedVehicle,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
