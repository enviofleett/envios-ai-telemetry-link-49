
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
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
      <GP51InfoAlert />
    </>
  );
};

export default GP51CredentialsForm;
