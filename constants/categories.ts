import { RequestCategory } from '../types/request';

export const CATEGORIES: {
  value: RequestCategory;
  label: string;
  icon: string;
  color: string;
  backgroundColor: string;
}[] = [
  {
    value: 'plastic',
    label: 'Plastic',
    icon: 'bottle-soda',
    color: '#1976D2',
    backgroundColor: '#E3F2FD',
  },
  {
    value: 'paper',
    label: 'Paper',
    icon: 'newspaper',
    color: '#7B1FA2',
    backgroundColor: '#F3E5F5',
  },
  {
    value: 'metal',
    label: 'Metal',
    icon: 'can',
    color: '#455A64',
    backgroundColor: '#ECEFF1',
  },
  {
    value: 'glass',
    label: 'Glass',
    icon: 'bottle-wine',
    color: '#00897B',
    backgroundColor: '#E0F2F1',
  },
  {
    value: 'electronics',
    label: 'Electronics',
    icon: 'devices',
    color: '#D32F2F',
    backgroundColor: '#FFEBEE',
  },
  {
    value: 'other',
    label: 'Other',
    icon: 'dots-horizontal',
    color: '#795548',
    backgroundColor: '#EFEBE9',
  },
];

export const getCategoryColor = (category: RequestCategory) => 
  CATEGORIES.find(c => c.value === category)?.color || '#000000';

export const getCategoryBackgroundColor = (category: RequestCategory) => 
  CATEGORIES.find(c => c.value === category)?.backgroundColor || '#FFFFFF'; 