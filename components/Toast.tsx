import { StyleSheet } from 'react-native';

import { Toast as StatusToast } from '@/components/ui/Toast';

export const Toast = ({
  message,
  type = 'success',
}: {
  message: string;
  type?: 'default' | 'loading' | 'success' | 'error';
}) => <StatusToast message={message} state={type} style={styles.container} />;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 96,
    left: 24,
    right: 24,
  },
}); 