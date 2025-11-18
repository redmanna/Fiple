import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { walletService } from '../../api/services';
import type { Wallet, Transaction } from '../../../../shared/types';

export default function WalletScreen() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadWallet = async () => {
    try {
      const [walletData, txData] = await Promise.all([
        walletService.getWallet(),
        walletService.getTransactions(1),
      ]);
      setWallet(walletData);
      setTransactions(txData.data);
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.txCard}>
      <View style={styles.txIcon}>
        <Ionicons
          name={item.type.includes('RECEIVED') ? 'arrow-down' : 'arrow-up'}
          size={20}
          color={item.type.includes('RECEIVED') ? '#10b981' : '#ef4444'}
        />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txDescription}>{item.description}</Text>
        <Text style={styles.txDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <Text
        style={[
          styles.txAmount,
          { color: item.type.includes('RECEIVED') ? '#10b981' : '#ef4444' },
        ]}
      >
        {item.type.includes('RECEIVED') ? '+' : '-'}₦{item.amount.toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fiple Wallet</Text>
      </View>

      {wallet && (
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>₦{wallet.balanceNGN.toLocaleString()}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Total Earned</Text>
              <Text style={styles.statValue}>₦{wallet.totalEarned.toLocaleString()}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Fiple Points</Text>
              <Text style={styles.statValue}>{wallet.fipplePoints.toLocaleString()}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.withdrawButton}>
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Recent Transactions</Text>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadWallet} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#6366f1', padding: 16, paddingTop: 48 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  balanceCard: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 12 },
  balanceLabel: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  balanceAmount: { fontSize: 36, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  statsRow: { flexDirection: 'row', marginBottom: 16 },
  stat: { flex: 1 },
  statLabel: { fontSize: 12, color: '#6b7280' },
  statValue: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  withdrawButton: { backgroundColor: '#6366f1', padding: 16, borderRadius: 8, alignItems: 'center' },
  withdrawButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginHorizontal: 16, marginBottom: 12 },
  txCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, marginBottom: 1 },
  txIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1, marginLeft: 12 },
  txDescription: { fontSize: 14, fontWeight: '500' },
  txDate: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  txAmount: { fontSize: 16, fontWeight: '600' },
});
