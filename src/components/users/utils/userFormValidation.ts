
interface FormData {
  name: string;
  email: string;
  phone_number: string;
  create_gp51_account: boolean;
  gp51_username: string;
  gp51_password: string;
}

export const validateUserForm = (formData: FormData, isEdit: boolean = false) => {
  const errors: Record<string, string> = {};

  if (!formData.name.trim()) errors.name = 'Name is required';
  
  if (!isEdit) {
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Invalid email format';
  }
  
  if (!formData.phone_number.trim()) errors.phone_number = 'Phone number is required';

  if (formData.create_gp51_account && !isEdit) {
    if (!formData.gp51_username.trim()) errors.gp51_username = 'GP51 username is required';
    if (!formData.gp51_password.trim()) errors.gp51_password = 'GP51 password is required';
    if (formData.gp51_password.length < 6) errors.gp51_password = 'Password must be at least 6 characters';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

export const generateGP51Username = (name: string) => {
  const baseUsername = name.toLowerCase().replace(/\s+/g, '');
  const randomSuffix = Math.floor(Math.random() * 1000);
  return `${baseUsername}${randomSuffix}`;
};
