import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import utilities
import { getFieldCards, deleteFieldCard } from '../../../utils/storage/fieldCardStorage';
import { COLORS, SPACING, FONT_SIZE, SCREEN } from '../../../constants/constants';

/**
 * Culvert Tool History Screen
 * Displays saved field cards with options to view or delete
 */
const HistoryScreen = ({ navigation, route }) => {
  const [fieldCards, setFieldCards] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load field cards from storage
  const loadFieldCards = useCallback(async () => {
    try {
      const cards = await getFieldCards();
      
      // Sort by date (newest first)
      cards.sort((a, b) => {
        return new Date(b.dateCreated) - new Date(a.dateCreated);
      });
      
      setFieldCards(cards);
    } catch (error) {
      console.error('Error loading field cards:', error);
      Alert.alert('Error', 'Failed to load saved field cards.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load field cards on initial render
  useEffect(() => {
    loadFieldCards();
  }, [loadFieldCards]);

  // Refresh field cards when the screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFieldCards();
    });

    return unsubscribe;
  }, [navigation, loadFieldCards]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFieldCards();
  }, [loadFieldCards]);

  // Handle deleting a field card
  const handleDelete = async (id) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this field card? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteFieldCard(id);
              
              if (success) {
                // Update state to remove the deleted card
                setFieldCards(currentCards => 
                  currentCards.filter(card => card.id !== id)
                );
              } else {
                Alert.alert('Error', 'Failed to delete the field card.');
              }
            } catch (error) {
              console.error('Error deleting field card:', error);
              Alert.alert('Error', 'Failed to delete the field card.');
            }
          }
        }
      ]
    );
  };

  // Handle viewing a field card
  const handleViewCard = (fieldCard) => {
    // Determine calculation method
    const calculationMethod = fieldCard.calculationMethod || (fieldCard.topWidths ? 'california' : 'area');
    
    // Check if professional design is required
    const requiresProfessionalDesign = fieldCard.requiresProfessionalDesign || false;
    
    navigation.navigate('Result', { 
      fieldCard, 
      culvertDiameter: fieldCard.calculatedDiameter || fieldCard.finalSize,
      requiresProfessionalDesign,
      calculationMethod
    });
  };

  // Render a field card item
  const renderFieldCard = ({ item }) => {
    const date = new Date(item.dateCreated);
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    
    // Determine calculation method for display
    const methodType = item.calculationMethod || (item.topWidths ? 'california' : 'area');
    const methodDisplay = methodType === 'california' ? 'California Method' : 'Area-Based';

    return (
      <View style={styles.cardItem}>
        <TouchableOpacity 
          style={styles.cardContent}
          onPress={() => handleViewCard(item)}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.streamId || item.projectName}</Text>
            <Text style={styles.cardDate}>{formattedDate}</Text>
          </View>
          
          <View style={styles.cardDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>
                {item.location || 'Not specified'}
              </Text>
            </View>
            
            {methodType === 'california' ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Avg. Width:</Text>
                <Text style={styles.detailValue}>{item.averageTopWidth?.toFixed(2) || 'N/A'} m</Text>
              </View>
            ) : (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Watershed:</Text>
                <Text style={styles.detailValue}>{item.watershedArea || 'N/A'} km²</Text>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Culvert Size:</Text>
              <Text style={styles.detailValue}>
                {item.calculatedDiameter || item.finalSize} mm
              </Text>
            </View>
            
            <View style={styles.methodBadge}>
              <Text style={styles.methodBadgeText}>{methodDisplay}</Text>
              {item.requiresProfessionalDesign && (
                <Text style={styles.professionalBadge}>Professional Design</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>Loading field cards...</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateText}>No saved field cards found</Text>
        <Text style={styles.emptyStateSubtext}>
          Calculate and save culvert sizes to see them here.
        </Text>
        <TouchableOpacity
          style={styles.newCardButton}
          onPress={() => navigation.navigate('Input')}
        >
          <Text style={styles.newCardButtonText}>Create New Field Card</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Field Card History</Text>
        <Text style={styles.subtitle}>View and manage your saved field cards</Text>
      </View>
      
      <FlatList
        data={fieldCards}
        renderItem={renderFieldCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  cardItem: {
    backgroundColor: COLORS.card,
    borderRadius: SCREEN.borderRadius,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  cardContent: {
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.primary,
    flex: 1,
  },
  cardDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  cardDetails: {
    marginTop: SPACING.xs,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  detailLabel: {
    width: 90,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  detailValue: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  methodBadge: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
  },
  methodBadgeText: {
    fontSize: FONT_SIZE.sm,
    backgroundColor: COLORS.primary + '20',
    color: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.sm,
    overflow: 'hidden',
    marginRight: SPACING.sm,
  },
  professionalBadge: {
    fontSize: FONT_SIZE.sm,
    backgroundColor: COLORS.warning + '20',
    color: COLORS.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.sm,
    overflow: 'hidden',
  },
  deleteButton: {
    backgroundColor: COLORS.error + '20', // 20% opacity
    borderBottomLeftRadius: SCREEN.borderRadius,
    borderBottomRightRadius: SCREEN.borderRadius,
    padding: SPACING.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  deleteButtonText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    marginTop: SPACING.xxl,
  },
  emptyStateText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  newCardButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SCREEN.borderRadius,
    padding: SPACING.md,
    alignItems: 'center',
    minWidth: 200,
  },
  newCardButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});

export default HistoryScreen;
