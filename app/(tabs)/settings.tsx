import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { List, Switch, Text, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';

type NotificationSettings = {
  requestHelp: boolean;
  requestComplete: boolean;
  newReview: boolean;
  nearbyRequest: boolean;
  chatMessage: boolean;
};

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const [notifications, setNotifications] = React.useState<NotificationSettings>({
    requestHelp: true,
    requestComplete: true,
    newReview: true,
    nearbyRequest: true,
    chatMessage: true,
  });

  // Load saved settings
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('notificationSettings');
        if (savedSettings) {
          setNotifications(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Save settings when changed
  const updateNotificationSetting = async (key: keyof NotificationSettings, value: boolean) => {
    try {
      const newSettings = { ...notifications, [key]: value };
      setNotifications(newSettings);
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Subheader>Notifications</List.Subheader>
        <List.Item
          title="Request Help Updates"
          description="When someone helps with your request"
          right={() => (
            <Switch
              value={notifications.requestHelp}
              onValueChange={value => updateNotificationSetting('requestHelp', value)}
            />
          )}
        />
        <List.Item
          title="Request Completion"
          description="When your request is marked as complete"
          right={() => (
            <Switch
              value={notifications.requestComplete}
              onValueChange={value => updateNotificationSetting('requestComplete', value)}
            />
          )}
        />
        <List.Item
          title="New Reviews"
          description="When you receive a new review"
          right={() => (
            <Switch
              value={notifications.newReview}
              onValueChange={value => updateNotificationSetting('newReview', value)}
            />
          )}
        />
        <List.Item
          title="Nearby Requests"
          description="When new requests are posted in your area"
          right={() => (
            <Switch
              value={notifications.nearbyRequest}
              onValueChange={value => updateNotificationSetting('nearbyRequest', value)}
            />
          )}
        />
        <List.Item
          title="Chat Messages"
          description="When you receive new messages"
          right={() => (
            <Switch
              value={notifications.chatMessage}
              onValueChange={value => updateNotificationSetting('chatMessage', value)}
            />
          )}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Account</List.Subheader>
        <List.Item
          title="Account Type"
          description={profile?.user_type}
          left={props => <List.Icon {...props} icon="account" />}
        />
        <List.Item
          title="Email"
          description={profile?.email}
          left={props => <List.Icon {...props} icon="email" />}
        />
        <List.Item
          title="Sign Out"
          left={props => <List.Icon {...props} icon="logout" />}
          onPress={signOut}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>About</List.Subheader>
        <List.Item
          title="Version"
          description="1.0.0"
          left={props => <List.Icon {...props} icon="information" />}
        />
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 