import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Request } from './requests';

type CacheConfig = {
  key: string;
  data: any;
  timestamp: number;
  expiryMinutes: number;
};

type PendingAction = {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  timestamp: number;
};

class CacheService {
  private static instance: CacheService;
  private pendingActions: PendingAction[] = [];
  private isOnline: boolean = true;

  private constructor() {
    this.initNetworkListener();
    this.loadPendingActions();
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private async initNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (wasOffline && this.isOnline) {
        this.syncPendingActions();
      }
    });
  }

  private async loadPendingActions() {
    try {
      const actions = await AsyncStorage.getItem('pendingActions');
      if (actions) {
        this.pendingActions = JSON.parse(actions);
      }
    } catch (error) {
      console.error('Error loading pending actions:', error);
    }
  }

  async cacheData(config: CacheConfig) {
    try {
      await AsyncStorage.setItem(
        config.key,
        JSON.stringify({
          data: config.data,
          timestamp: Date.now(),
          expiryMinutes: config.expiryMinutes,
        })
      );
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp, expiryMinutes } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > expiryMinutes * 60 * 1000;

      return isExpired ? null : data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  async addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp'>) {
    const newAction: PendingAction = {
      ...action,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };

    this.pendingActions.push(newAction);
    await this.savePendingActions();

    if (this.isOnline) {
      this.syncPendingActions();
    }
  }

  private async savePendingActions() {
    try {
      await AsyncStorage.setItem(
        'pendingActions',
        JSON.stringify(this.pendingActions)
      );
    } catch (error) {
      console.error('Error saving pending actions:', error);
    }
  }

  private async syncPendingActions() {
    const actions = [...this.pendingActions];
    for (const action of actions) {
      try {
        // Implement sync logic based on action type
        switch (action.type) {
          case 'create':
            // Handle create
            break;
          case 'update':
            // Handle update
            break;
          case 'delete':
            // Handle delete
            break;
        }

        // Remove synced action
        this.pendingActions = this.pendingActions.filter(a => a.id !== action.id);
        await this.savePendingActions();
      } catch (error) {
        console.error('Error syncing action:', error);
      }
    }
  }
}

export const cache = CacheService.getInstance(); 