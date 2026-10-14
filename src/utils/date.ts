// src/utils/date.ts
export const CURRENT_YEAR = new Date().getFullYear();

const BIRTH_DATE = new Date(2001, 4, 17);

export const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();

    const birthdayNotReached =
        today.getMonth() < birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());

    if (birthdayNotReached) {
        age--;
    }

    return age;
};

export const CURRENT_AGE = calculateAge(BIRTH_DATE);