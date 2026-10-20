import { StyleSheet, View } from 'react-native';
import { AppModal } from './AppModal';
import { Button } from './Button';
import { Text } from './Text';
import { colors, fonts } from '../theme';

// Confirmação de exclusão nos moldes do modal "Excluir Rotina" do web.
export function ConfirmModal({
  open,
  title,
  itemName,
  confirmLabel,
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  itemName: string;
  confirmLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <AppModal open={open} onClose={onClose} title={title}>
      <Text>
        Tem certeza que deseja excluir <Text style={styles.name}>{itemName}</Text>?
      </Text>
      <View style={styles.actions}>
        <Button title={confirmLabel} variant="danger" onPress={onConfirm} loading={loading} />
        <Button title="Cancelar" variant="outline" onPress={onClose} />
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  name: { fontFamily: fonts.bodyBold, color: colors.accent },
  actions: { gap: 12 },
});
