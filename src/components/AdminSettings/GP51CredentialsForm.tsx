
import React from 'react';
import { useGP51Credentials } from '@/hooks/useGP51Credentials';
import GP51FormFields from './GP51FormFields';
import GP51InfoAlert from './GP51InfoAlert';

const GP51CredentialsForm: React.FC = () => {
  const {
    username,
    setUsername,
    password,
    setPassword,
    apiUrl,
    setApiUrl,
    handleSaveCredentials,
    isLoading
  } = useGP51Credentials();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveCredentials();
  };

  return (
    <>
      <GP51FormFields
        username={username}
        password={password}
        apiUrl={apiUrl}
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onApiUrlChange={setApiUrl}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
      <GP51InfoAlert />
    </>
  );
};

export default GP51CredentialsForm;
