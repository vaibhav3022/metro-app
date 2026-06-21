import COLORS from './colors';
import FONTS_CONFIG from './fonts';

export const PRIMARY_COLOR = COLORS.primary;
export const SECONDARY_COLOR = COLORS.secondary;
export const BACKGROUND_COLOR = COLORS.background;
export const CARD_BG = COLORS.cardBg;
export const TEXT_PRIMARY = COLORS.text;
export const TEXT_SECONDARY = COLORS.textLight;
export const ERROR_COLOR = COLORS.error;
export const SUCCESS_COLOR = COLORS.success;
export const BORDER_COLOR = COLORS.border;
export const WHITE = COLORS.white;

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32
};

export const FONTS = {
  FAMILY: FONTS_CONFIG.regular,
  SIZES: FONTS_CONFIG.sizes,
  WEIGHTS: FONTS_CONFIG.weights
};

export default {
  PRIMARY_COLOR,
  SECONDARY_COLOR,
  BACKGROUND_COLOR,
  CARD_BG,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  ERROR_COLOR,
  SUCCESS_COLOR,
  BORDER_COLOR,
  WHITE,
  SPACING,
  FONTS
};
