import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import language files

// English translations
import enCommon from "./locales/en/common.json";
import enLanguage from "./locales/en/language.json";
import enNavigation from "./locales/en/navigation.json";
import enChapterView from "./locales/en/chapterView.json";
import enAdminView from "./locales/en/adminView.json";
import enDashboard from "./locales/en/dashboard.json";
import enAuth from "./locales/en/auth.json";
import enApp from "./locales/en/app.json";
import enAdmin from "./locales/en/admin.json";
import enFooter from "./locales/en/footer.json";
import enChatTool from "./locales/en/chatTool.json";
import enCourseView from "./locales/en/courseView.json";
import enCreateCourse from "./locales/en/createCourse.json";
import enToolbarContainer from "./locales/en/toolbarContainer.json";
import enStatisticsPage from "./locales/en/statisticsPage.json";

// Configure i18n with default namespace
const i18nInstance = i18n.createInstance();

i18nInstance
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Configure namespaces
    defaultNS: "common",
    ns: ["common", "pricing"],
    fallbackLng: "en",

    // Enable debug in development
    debug: process.env.NODE_ENV === "development",

    // Use dot notation for nested keys
    keySeparator: ".",
    nsSeparator: ":",
    resources: {
      en: {
        // Common translations
        common: enCommon,
        language: enLanguage,
        navigation: enNavigation,
        chapterView: enChapterView,
        adminView: enAdminView,
        dashboard: enDashboard,
        auth: enAuth,
        app: enApp,
        admin: enAdmin,
        footer: enFooter,
        chatTool: enChatTool,
        courseView: enCourseView,
        createCourse: enCreateCourse,
        toolbarContainer: enToolbarContainer,
        statisticsPage: enStatisticsPage,
      },
    },
    //debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // React already safes from XSS
    },

    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

// Export the configured instance
export default i18nInstance;
