export function getCategoryColor(category: string): string {
  switch (category.toLowerCase()) {
    case 'emergency':
      return '#F44336';
    case 'medical':
      return '#2196F3';
    case 'food':
      return '#4CAF50';
    case 'transportation':
      return '#FF9800';
    case 'shelter':
      return '#9C27B0';
    case 'other':
    default:
      return '#757575';
  }
} 