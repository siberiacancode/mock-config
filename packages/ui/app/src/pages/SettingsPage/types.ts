export interface SettingsField {
  label: string;
  value: string;
  wide?: boolean;
}

export interface SettingsSection {
  fields: SettingsField[];
  isEnabled?: boolean;
  title: string;
}
