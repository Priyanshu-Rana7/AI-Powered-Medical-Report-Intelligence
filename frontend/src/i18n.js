import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import hi from './locales/hi.json';
import or from './locales/or.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            English: { translation: en },
            Hindi: { translation: hi },
            Odia: { translation: or }
        },
        fallbackLng: 'English',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
