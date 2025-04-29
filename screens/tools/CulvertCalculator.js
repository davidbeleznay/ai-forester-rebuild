              </Text>
              </View>
              
              {climateFactorEnabled && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Climate Factor Applied:</Text>
                  <Text style={styles.resultValue}>{climateFactor}x</Text>
                </View>
              )}
            </View>
            
            {showTransportAssessment && (
              <View style={styles.transportResults}>
                <Text style={styles.resultTitle}>Transport Assessment</Text>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Risk Category:</Text>
                  <Text 
                    style={[
                      styles.resultValue, 
                      transportCategory === 'High' ? styles.highRisk : 
                      transportCategory === 'Medium' ? styles.mediumRisk : 
                      styles.lowRisk
                    ]}
                  >
                    {transportCategory}
                  </Text>
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Transport Score:</Text>
                  <Text style={styles.resultValue}>{transportScore}/9</Text>
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Additional Sizing:</Text>
                  <Text style={styles.resultValue}>{transportSizing * 100}%</Text>
                </View>
                
                {transportRecommendations.length > 0 && (
                  <View style={styles.recommendationsContainer}>
                    <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                    {transportRecommendations.map((rec, index) => (
                      <View key={index} style={styles.recommendationItem}>
                        <View style={styles.recommendationBullet} />
                        <Text style={styles.recommendationText}>{rec}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
            
            <View style={styles.culvertVisualization}>
              <Text style={styles.visualizationTitle}>Size Visualization</Text>
              
              <View style={styles.visualizationContainer}>
                {/* Stream cross-section */}
                <View style={styles.circlesContainer}>
                  <View 
                    style={[
                      styles.streamCircle,
                      { 
                        width: Math.min(280, 280), 
                        height: Math.min(280, 280),
                        borderRadius: 140
                      }
                    ]}
                  />
                  
                  {/* Recommended culvert */}
                  <View 
                    style={[
                      styles.culvertCircle,
                      { 
                        width: Math.min(250, recommendedSize / 8), 
                        height: Math.min(250, recommendedSize / 8),
                        borderRadius: Math.min(125, recommendedSize / 16)
                      }
                    ]}
                  />
                  
                  {/* Labels */}
                  <View style={styles.circleLabels}>
                    <Text style={styles.streamLabel}>Stream</Text>
                    <Text style={styles.culvertLabel}>{recommendedSize} mm Culvert</Text>
                  </View>
                </View>
              </View>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton, loading && styles.disabledButton]}
                onPress={saveAssessment}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="save" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Save Assessment</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.pdfButton, generatingPDF && styles.disabledButton]}
                onPress={generatePDF}
                disabled={generatingPDF}
              >
                {generatingPDF ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="file-text" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Generate PDF</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Connection status */}
      <View style={styles.connectionStatus}>
        <View
          style={[
            styles.statusIndicator,
            isConnected ? styles.onlineIndicator : styles.offlineIndicator
          ]}
        />
        <Text style={styles.statusText}>
          {isConnected ? 'Online' : 'Offline Mode'}
        </Text>
      </View>

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Culvert Calculator</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {renderForm()}
      </ScrollView>
      
      {renderResultsModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineIndicator: {
    backgroundColor: COLORS.online,
  },
  offlineIndicator: {
    backgroundColor: COLORS.offline,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: SPACING.md,
  },
  formSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  formField: {
    marginBottom: SPACING.md,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  measurementField: {
    width: '48%',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  calculateButton: {
    backgroundColor: COLORS.primary,
    flex: 2,
    marginRight: 8,
  },
  resetButton: {
    borderWidth: 1,
    borderColor: '#e53935',
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#e53935',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  gpsInfo: {
    backgroundColor: '#e8f5e9',
    padding: 8,
    borderRadius: 6,
    marginBottom: SPACING.md,
  },
  gpsText: {
    fontSize: 14,
    color: '#2e7d32',
  },
  gpsAccuracy: {
    fontSize: 12,
    color: '#388e3c',
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 6,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 14,
    color: '#c62828',
  },
  methodToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  methodToggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginRight: 10,
  },
  methodToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 8,
    borderRadius: 6,
  },
  methodToggleButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginRight: 8,
  },
  transportAssessment: {
    marginTop: SPACING.sm,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  selectOption: {
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  selectText: {
    fontSize: 14,
    color: COLORS.text,
  },
  // Photo Section Styles
  photoButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  photoButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  photoList: {
    marginTop: SPACING.sm,
  },
  photoItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoThumbnail: {
    width: 90,
    height: 90,
  },
  photoDetails: {
    flex: 1,
    padding: SPACING.sm,
  },
  photoComment: {
    flex: 1,
    fontSize: 14,
    minHeight: 50,
  },
  removePhotoButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  closeButton: {
    padding: 5,
  },
  modalScrollView: {
    padding: SPACING.md,
  },
  resultSection: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  resultSize: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  resultSizeMetric: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    padding: 12,
    marginTop: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  warningIcon: {
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#5D4037',
  },
  resultDetails: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: SPACING.md,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  transportResults: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: SPACING.md,
  },
  highRisk: {
    color: COLORS.error,
    fontWeight: 'bold',
  },
  mediumRisk: {
    color: COLORS.warning,
    fontWeight: 'bold',
  },
  lowRisk: {
    color: COLORS.success,
    fontWeight: 'bold',
  },
  recommendationsContainer: {
    marginTop: 10,
  },
  recommendationsTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  recommendationBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 6,
    marginRight: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  culvertVisualization: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  visualizationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 15,
  },
  visualizationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  circlesContainer: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  streamCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(173, 216, 230, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 255, 0.5)',
    zIndex: 1,
  },
  culvertCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(144, 238, 144, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(0, 128, 0, 0.7)',
    borderStyle: 'dashed',
    zIndex: 2,
  },
  circleLabels: {
    position: 'absolute',
    top: -40,
    alignItems: 'center',
    zIndex: 3,
  },
  streamLabel: {
    color: 'rgba(0, 0, 255, 0.7)',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  culvertLabel: {
    color: 'rgba(0, 128, 0, 0.9)',
    fontWeight: 'bold',
  },
  visualizationLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 10,
  },
  actionButtons: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  pdfButton: {
    backgroundColor: COLORS.secondary,
  },
});

export default CulvertCalculator;