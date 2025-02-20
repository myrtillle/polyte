import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

const baseTheme = {
  // Custom colors
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2196F3',
    secondary: '#4CAF50',
    // Add more custom colors as needed
  },
};

export const theme = {
  ...MD3LightTheme,
  ...baseTheme,
};

export const darkTheme = {
  ...MD3DarkTheme,
  ...baseTheme,
}; 