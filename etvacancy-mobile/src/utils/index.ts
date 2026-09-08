/**
 * Utility Functions Barrel
 * Modularized domain utilities with 100% backward-compatible re-exports.
 */

// Currency & Salary
export {
  formatCurrency,
  formatSalaryRange,
  type FormatCurrencyOptions,
} from './currency';

// Date & Time
export {
  formatDate,
  formatDateTime,
  formatTime,
  dateRange,
  calculateAge,
} from './date';

// Strings & Text
export {
  capitalize,
  capitalizeWords,
  getInitials,
  getFullName,
  truncate,
  slugify,
  stripHtml,
  countWords,
  humanizeEnumValue,
  generateId,
  getFileExtension,
  markdownToHtml,
  markdownToHtmlDark,
} from './string';

// Validation & Formatting
export {
  validateEmail,
  validatePhone,
  validateUrl,
  formatPhoneNumber,
  maskEmail,
  maskPhone,
} from './validation';

// Linking & Platform
export {
  openUrl,
  openEmail,
  openPhone,
  openSms,
  shareUrl,
  isAndroid,
  isIOS,
  isWeb,
} from './linking';

// Labels & Colors
export {
  jobTypeLabels,
  experienceLevelLabels,
  employmentTypeLabels,
  applicationStatusLabels,
  interviewStatusLabels,
  companySizeLabels,
  educationLevelLabels,
  roleLabels,
  getStatusColor,
} from './labels';

// Collections, Timing & Objects
export {
  formatFileSize,
  debounce,
  throttle,
  groupBy,
  uniqueBy,
  paginate,
  deepClone,
  mergeDeep,
} from './collection';
