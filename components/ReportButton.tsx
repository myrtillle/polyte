import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, TextInput } from 'react-native-paper';

import { createReport, ReportType } from '../services/reports';

type ReportButtonProps = {
  reportedId: string;
  contentId: string;
  type: ReportType;
  onReport?: () => void;
};

export function ReportButton({ reportedId, contentId, type, onReport }: ReportButtonProps) {
  const [visible, setVisible] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [details, setDetails] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;

    try {
      setSubmitting(true);
      await createReport(reportedId, type, contentId, reason.trim(), details.trim());
      setVisible(false);
      onReport?.();
    } catch (error) {
      console.error('Error creating report:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button 
        icon="flag" 
        mode="text" 
        onPress={() => setVisible(true)}
      >
        Report
      </Button>

      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Title>Report</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Reason"
              value={reason}
              onChangeText={setReason}
              style={styles.input}
            />
            <TextInput
              label="Additional Details (Optional)"
              value={details}
              onChangeText={setDetails}
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisible(false)}>Cancel</Button>
            <Button 
              onPress={handleSubmit}
              loading={submitting}
              disabled={!reason.trim() || submitting}
            >
              Submit
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    marginBottom: 16,
  },
}); 