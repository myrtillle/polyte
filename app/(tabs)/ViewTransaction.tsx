import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, RefreshControl, Modal, } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { transactionService } from '@/services/transactionService';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { supabase } from '@/services/supabase';
import { scheduleService } from '@/services/scheduleService';
import * as ImagePicker from 'expo-image-picker';
import { notificationService } from '@/services/notificationService';
import locationIcon from '../../assets/images/greenmark.png';
import pickupIcon from '../../assets/images/pickup.png';
import dropoffIcon from '../../assets/images/dropoff.png';
import meetupIcon from '../../assets/images/meetup.png';
import cashIcon from '../../assets/images/cash.png';
import proofIcon from '../../assets/images/images3d.png';
import { Button, Divider, IconButton } from 'react-native-paper';


const getModeData = (modeName: string) => {
  const lower = modeName.toLowerCase();
  if (lower.includes('pickup')) {
    return { icon: pickupIcon, color: '#FFD700' }; // Yellow
  } else if (lower.includes('drop')) {
    return { icon: dropoffIcon, color: '#FF8515' }; // Orange
  } else {
    return { icon: meetupIcon, color: '#00FF57' }; // Green
  }
};


interface proofImage {
  photo: string;
}
export default function ViewTransaction() {
  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { offerId } = route.params as { offerId: string };

  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [setPaid] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [proofImage, setProofImage] = useState<proofImage>({
    photo: ''
  });
  // console.log('🔍 Navigated with offerId:', offerId);
  console.log('📦 ViewTransaction received offerId:', offerId);
  
  const isSellingPost = transaction?.category_id === 2; // Category 2 means Selling

  const paid = transaction?.status === 'awaiting_payment' || transaction?.status === 'for_completion' || transaction?.status === 'completed';

  useEffect(() => {
    const fetchTransactDetails = async () => {
      setLoading(true);
      setTransaction(null); 
      const data = await transactionService.fetchTransactionDetails(offerId);
      console.log('📄 Data returned from transactionService:', data);

      setTransaction(data);
      setLoading(false);
    };
    
    if (offerId) {
      fetchTransactDetails(); 
    }
    
    setConfirmVisible(false);
    // setPaid(false);

  }, [offerId]);
  
  useEffect(() => {
    const channel = supabase
      .channel('transaction-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'offers',
          filter: `id=eq.${offerId}`,
        },
        async (payload) => {
          console.log('🔁 Real-time transaction update received:', payload);
          const updated = await transactionService.fetchTransactionDetails(offerId);
          setTransaction(updated);
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel); // clean up when leaving screen
    };
  }, [offerId]);
  
  useEffect(() => {

    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        console.error("Error getting user:", error?.message || "No user found");
      } else {
        setCurrentUser(data.user.id);
      }
    };
    getUser();
  }, []);
  
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const updated = await transactionService.fetchTransactionDetails(offerId);
      setTransaction(updated);
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  };
  
  const isOfferer = currentUser === transaction?.offerer_id;
  const isPostOwner = !isOfferer;
  const hasProof = !!transaction?.proof_image_url;
  const hasAgreed = transaction?.status !== 'pending';
  const canComplete = hasProof && paid;

  const isConfirmed = ['awaiting_payment', 'for_completion', 'completed'].includes(transaction?.status);
  const canConfirm = transaction?.status === 'proof_uploaded';

  const handlePostOwnerConfirm = async () => {
    const success = await transactionService.completeTransaction(offerId);

    if (success) {
      Alert.alert('Confirmed', 'Transaction marked as completed.');

      const updated = await transactionService.fetchTransactionDetails(offerId);
      setTransaction(updated);
      
      await notificationService.sendNotification(
        transaction.collector_id,
        'Transaction Completed',
        'The offerer has marked the transaction as completed.',
        'transaction_completed',
        {
          type: 'offer',
          id: offerId
        }
      );

      await notificationService.sendNotification(
        transaction.offerer_id,
        'Transaction Completed',
        'Your transaction has been successfully completed by the post owner.',
        'transaction_completed',
        {
          type: 'offer',
          id: offerId
        }
      );

      setConfirmVisible(false);
      navigation.navigate('TransaCompleted', {
        weight: transaction.weight,
        points: transaction.weight * 100,
      });       
    } else {
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const handleMockPayment = async () => {

    const success = await transactionService.markAsForCompletion(offerId);

     if (success) {
        Alert.alert('Payment Success', 'Payment has been processed.');

        await notificationService.sendNotification(
          transaction.offerer_id,
          'Payment Sent',
          'The post owner has sent payment. Please confirm to complete the transaction.',
          'payment_send',
          {
            type: 'offer',
            id: offerId
          },
        );

        const updated = await transactionService.fetchTransactionDetails(offerId);
        setTransaction(updated);
        // setPaid(true);

        console.log('🧩 canComplete status:', canComplete);
        console.log('🖼️ Has proof?', hasProof);
        console.log('💸 Paid?', paid);
        console.log('🔐 User role:', isOfferer ? 'OFFERER' : 'POST OWNER');
        console.log('📦 Current status:', transaction?.status);
      } else {
        Alert.alert('Error', 'Failed to update payment status.');
      }

      setUploading(false);
  };

  useEffect(() => {
    console.log('🧩 canComplete status:', canComplete);
    console.log('🖼️ Has proof?', hasProof);
    console.log('💸 Paid?', paid);
    console.log('🔐 User role:', isOfferer ? 'OFFERER' : 'POST OWNER');
    console.log('📦 Current status:', transaction?.status);
  }, [canComplete, hasProof, paid, transaction?.status]);
  
  // setProofImage({ photo: asset.uri });
  const handleUploadProof = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'I-allow sa ang permission sa camera roll palihog.');
        return;
      }
  
      setUploading(true);
  
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 1,
      });
  
      if (result.canceled) {
        setUploading(false);
        return;
      }
  
      const asset = result.assets[0];
      if (!asset?.uri) {
        Alert.alert('Error', 'No image selected.');
        return;
      }
  
      // ✅ Upload image using the same working logic (uri → { uri, name, type })
      const uploadedUrl = await transactionService.uploadProofImage(asset.uri, offerId);
      if (!uploadedUrl) throw new Error('Image upload failed');
  
      // ✅ Save URL to the `proof_image_url` column via update
      const success = await transactionService.confirmDelivery(offerId, uploadedUrl);
  
      if (success) {
        Alert.alert('Success', 'Proof photo uploaded and transaction updated.');
        const updated = await transactionService.fetchTransactionDetails(offerId);

        await notificationService.sendNotification(
          transaction.collector_id,
          'Proof of Collection Uploaded',
          'The offerer has uploaded a photo as proof of collection. Please review it before sending payment.',
          'proof_uploaded',
          { type: 'offer', id: offerId}
        )

        setTransaction(updated);

      } else {
        Alert.alert('Error', 'Failed to update the transaction status.');
      }
  
    } catch (error) {
      if (error instanceof Error) {
        console.error('Upload error:', error.message);
        Alert.alert('Error', error.message);
      } else {
        console.error('Unexpected upload error:', error);
        Alert.alert('Error', 'Unexpected error occurred.');
      }
    } finally {
      setUploading(false);
    }
  };
  

  const handleAgreeToSchedule = async () => {
    const success = await scheduleService.agreeToSchedule(offerId);

    if (success) {
      Alert.alert("Schedule Agreed", "You have agreed to the schedule.");
      
      await notificationService.sendNotification(
        transaction.collector_id,
        'Schedule finalized',
        'Offerer has agreed to the schedule. Please proceed to collection via chosen collection mode.',
        'schedule_agreed',
        { type: 'offer', id: offerId}
      )
      const updated = await transactionService.fetchTransactionDetails(offerId);
      setTransaction(updated);
  
      setConfirmVisible(false);

    } else {
      Alert.alert("Error", "Failed to agree on schedule.");
    }
  };

  const steps = [
    'offer_made',
    'offer_accepted',
    'schedule_set',
    'for_collection',
    'proof_uploaded',
    'awaiting_payment',
    'for_completion',
    'completed',
  ];

  const currentStepIndex = steps.indexOf(transaction?.status || '');
  const formatStep = (step: string) => {
    return step.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#00D964" size="large" />
      </View>
    );
  }

  return (
    <LinearGradient colors={['#023F0F', '#05A527']} style={{ flex: 1 }}>
  {/* Header outside the padding container */}
      <View style={styles.headerContainer}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor="white"
          onPress={() => navigation.navigate('TransacHist')}
          style={{ position: 'absolute', left: 0 }}
        />
        <Text style={styles.headerTitle}>TRANSACTION DETAILS</Text>
      </View>
      <ScrollView
       contentContainerStyle={{ padding: 16 }}
         refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#00D964"
          />
        }
      >

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>STATUS</Text>
          <Text style={styles.status}>{transaction?.status?.replace(/_/g, ' ').toUpperCase()}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>SCHEDULED IN</Text>
          <Text style={styles.bigText}>{transaction?.scheduled_time ?? 'N/A'} - {transaction?.scheduled_date}</Text>

          {!hasAgreed && isPostOwner && (
              <Text style={{ color: 'yellow', marginTop: 10 }}>
                Waiting for offerer to agree to the schedule.
              </Text>
            )}

          {isOfferer && !hasAgreed && (
            <Text style={{ color: '#ccc', fontSize: 12, marginTop: 6, marginBottom: 4 }}>
              Not convenient? Discuss the schedule with the seeker.
            </Text>
          )}

          {isOfferer && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                style={{
                  backgroundColor: hasAgreed ? '#888' : '#00D964',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 20,
                  marginRight: 8,
                }}
                onPress={hasAgreed ? undefined : handleAgreeToSchedule}
                disabled={hasAgreed}
              >
                <Text style={{
                  color: '#023F0F',
                  fontWeight: 'bold',
                  fontSize: 12,
                }}>
                  {hasAgreed ? 'AGREED' : 'AGREE'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: '#1E592B',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 20,
                }}
                disabled={hasAgreed}
                onPress={async () => {
                  const { data: { user }, error } = await supabase.auth.getUser();
                  if (user) {
                    navigation.navigate('ChatScreen', {
                      chatId: transaction?.id,
                      userId: user.id,
                      schedule: {
                        scheduled_time: transaction?.scheduled_time,
                        scheduled_date: transaction?.scheduled_date,
                        status: transaction?.status,
                        collectorName: transaction?.collector_name,
                        offererName: transaction?.offerer_name,
                        photoUrl: transaction?.photo_url,
                        purok: transaction?.purok,
                        barangay: transaction?.barangay,
                        user_id: transaction?.collector_id, // correct owner
                        offer_id: offerId
                      }
                    });
                  }
                }}
              >
                <Text style={{
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 12,
                }}>
                  CHAT SEEKER
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.subLabel}>ITEMS</Text>
          <View style={styles.itemList}>
          {transaction?.items?.length > 0 ? (
            transaction.items.map((item: string, index: number) => (
              <View key={index} style={styles.itemChip}>
                <Text style={styles.itemChipText}>{item}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.subValue}>N/A</Text>
          )}
        </View>

          <Text style={styles.subLabel}>SETTLED AT</Text>
          <View style={styles.addressRow}>
          <Image source={locationIcon} style={styles.locationIcon} resizeMode="contain" />
          <Text style={styles.subValue}>
            {transaction?.purok}, {transaction?.barangay}
          </Text>
        </View>


        <Text style={styles.subLabel}>IN METHOD OF</Text>
        <View style={styles.modeRow}>
          {(() => {
            const mode = getModeData(transaction?.method || '');
            return (
              <>
                <Image source={mode.icon} style={[styles.modeIcon, { tintColor: mode.color }]} />
                <Text style={[styles.modeText, { color: mode.color }]}>
                  {transaction?.method?.toUpperCase()}
                </Text>
              </>
            );
          })()}
        </View>

        </View>

        <View style={styles.cardRow}>
          <View>
            <Text style={styles.subLabel}>TO BE COLLECTED BY :</Text>
            <Text style={styles.collectorName}>{transaction?.collector_name}</Text>
            <Text style={styles.subLabel}>FROM:</Text>
            <Text style={styles.offererName}>{transaction?.offerer_name}</Text>

            {/* {!hasAgreed && isOfferer && (
              <TouchableOpacity onPress={handleAgreeToSchedule} style={[styles.confirmButton, { marginTop: 10 }]}>
                <Text style={styles.confirmText}>AGREE TO SCHEDULE</Text>
              </TouchableOpacity>
            )} */}
          </View>
          {transaction?.photo_url && (
            <Image source={{ uri: transaction?.photo_url }} style={styles.photo} />
          )}

      
        </View>

        {/* Proof of Collection */}
        <View style={[styles.card, !hasAgreed && { opacity: 0.5 }]}>
          <Text style={styles.collectionStatusHeader}>COLLECTION STATUS</Text>
          <TouchableOpacity
            onPress={() => setProofModalVisible(true)}
            style={styles.proofCard}
          >
            <View style={styles.proofTextContainer}>
              <Text style={styles.proofCardTitle}>PROOF OF COLLECTION</Text>
              <Text style={styles.proofCardSubtitle}>Tap Here to Upload images</Text>
            </View>
            <Image source={proofIcon} style={styles.proofCardImage} />
          </TouchableOpacity>


          {/* Step Tracker */}
          {/* <View style={{ marginTop: 16 }}>
            {steps.map((step, index) => (
              <Text
                key={step}
                style={{
                  color: index <= currentStepIndex ? '#00D964' : '#aaa',
                  fontWeight: index === currentStepIndex ? 'bold' : 'normal',
                  marginBottom: 6,
                }}
              >
                {index + 1}. {step.replaceAll('_', ' ').toUpperCase()}
              </Text>
            ))}
          </View> */}

          {/* tracker - reversed */}
          <View style={{ marginTop: 16, paddingLeft: 10, borderLeftWidth: 2, borderColor: '#00D964' }}>
            {[...steps].reverse().map((step, index) => {
              const originalIndex = steps.indexOf(step);
              return (
                <View key={step} style={{ marginBottom: 14, position: 'relative' }}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      backgroundColor: originalIndex <= currentStepIndex ? '#00D964' : '#aaa',
                      borderRadius: 5,
                      position: 'absolute',
                      left: -16,
                      top: 4
                    }}
                  />
                  <Text
                    style={{
                      color: originalIndex <= currentStepIndex ? '#00D964' : '#ccc',
                      fontWeight: originalIndex === currentStepIndex ? 'bold' : 'normal'
                    }}
                  >
                    {formatStep(step)}
                  </Text>
                </View>
              );
            })}
          </View>

            {/* ✅ Upload Proof Button (Offerer only + right status) */}
            {/* {isOfferer && transaction?.status === 'for_collection' && (
              <TouchableOpacity style={[styles.confirmButton, { marginTop: 16 }]} onPress={handleUploadProof}>
                <Text style={styles.confirmText}>UPLOAD PROOF</Text>
              </TouchableOpacity>
            )} */}
        </View>

          {/* Payment Section */}
          <View style={[styles.card, !hasAgreed && { opacity: 0.5 }]}>
            <Text style={styles.collectionStatusHeader}>PAYMENT</Text>
            
            <View style={styles.offerPriceRow}>
            <Image source={cashIcon} style={styles.offerPesoIcon} />
            <Text style={styles.offerPriceText}>₱ {transaction?.price?.toFixed(2) ?? 'N/A'}</Text>
          </View>


            {isPostOwner && transaction?.status === 'awaiting_payment' && (
              <TouchableOpacity style={styles.confirmButton} onPress={handleMockPayment}>
                <Text style={styles.confirmText}>PAY</Text>
              </TouchableOpacity>
            )}

            {isOfferer && transaction?.status === 'for_collecion' && (
              <Text style={{ color: '#ccc', fontStyle: 'italic' }}>Please upload a proof of collection first before seeker sends payment.</Text>
            )}

            {isOfferer && transaction?.status === 'awaiting_payment' && (
              <Text style={{ color: '#ccc', fontStyle: 'italic' }}>Waiting for seeker to send payment via e-wallet.</Text>
            )}

            {['for_completion', 'completed'].includes(transaction?.status) && (
              <Text style={{ color: '#ccc', fontStyle: 'italic' }}>
                Payment already processed.
              </Text>
            )}
          </View>

        {/* Offerer Button */}
        {((isSellingPost && isOfferer) || (!isSellingPost && isPostOwner)) && ['for_completion', 'completed'].includes(transaction?.status) && (
          <TouchableOpacity
            style={[
              styles.confirmButton,
              transaction?.status === 'completed' && { backgroundColor: '#888' }
            ]}
            disabled={transaction?.status === 'completed'}
            onPress={() => {
              if (transaction?.status === 'for_completion') {
                setConfirmVisible(true);
              }
            }}
          >
            <Text style={styles.confirmText}>
              {transaction?.status === 'completed' ? 'TRANSACTION COMPLETED' : 'COMPLETE TRANSACTION'}
            </Text>
          </TouchableOpacity>
        )}
  
        {/* Complete Transaction Button */}
        {/* {isPostOwner && (
          <TouchableOpacity
            style={[styles.confirmButton, !canComplete && { backgroundColor: '#888' }]}
            disabled={!canComplete}
            onPress={() => setConfirmVisible(true)}
          >
            <Text style={styles.confirmText}>COMPLETE TRANSACTION</Text>
          </TouchableOpacity>
        )} */}


        {/* {currentUser === transaction?.offerer_id ? (
          <TouchableOpacity
          style={[
            styles.confirmButton,
            transaction?.status === 'for_confirmation' && transaction?.status === 'completed' && { backgroundColor: '#ccc' },
          ]}
          // disabled={transaction?.status === 'for_confirmation'}
            onPress={() => {
              navigation.navigate('ConfirmDelivery', {
                offerId,
                offererName: transaction.offerer_name,
                collectorName: transaction.collector_name,
                photoUrl: transaction.photo_url,
              });
            }}
          >
            <Text style={styles.confirmText}>CONFIRM DELIVERY</Text>
          </TouchableOpacity>
        ) : (
          
          <TouchableOpacity
            style={[
              styles.confirmButton,
              (transaction?.proof_image_url || transaction?.status === 'for_confirmation') && {
                backgroundColor: '#ccc',
              },
            ]}
            disabled={!transaction?.proof_image_url || transaction?.status === 'completed'}
            onPress={() => setConfirmVisible(true)}
          > 
            <Text style={styles.confirmText}>
              {transaction?.status === 'completed' ? 'COMPLETED' : 'OFFER RECEIVED'}
            </Text>
          </TouchableOpacity>
        )}

        {confirmVisible && (
          <View style={styles.modalBackdrop}>
            <View style={styles.modalBox}>
              <Text style={styles.modalText}>Are you sure you want to confirm this offer?</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setConfirmVisible(false)}
                  style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                >
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePostOwnerConfirm}
                  style={[styles.modalButton, { backgroundColor: '#00D964' }]}
                >
                  <Text style={{ fontWeight: 'bold', color: '#003d1a' }}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )} */}
      </ScrollView>
        
      {proofModalVisible && (
        <Modal
        transparent
        visible={proofModalVisible}
        animationType="slide"
        onRequestClose={() => setProofModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.proofModalContainer}>
            <Text style={styles.proofModalHeader}> PROOF OF COLLECTION </Text>
      
            {hasProof ? (
              <>
                <Image source={{ uri: transaction.proof_image_url }} style={styles.proofImage} />
      
                {((isSellingPost && isOfferer) || (!isSellingPost && isPostOwner)) && transaction?.status === 'proof_uploaded' && (
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      {
                        marginTop: 20,
                        backgroundColor: canConfirm ? '#00D964' : '#888',
                      },
                    ]}
                    disabled={!canConfirm}
                    onPress={async () => {
                      const success = await transactionService.markAsAwaitingPayment(offerId);
                      if (success) {
                        const updated = await transactionService.fetchTransactionDetails(offerId);
                        setTransaction(updated);
                        Alert.alert('Confirmed', 'Collection confirmed. Waiting for payment.');
                        setProofModalVisible(false);
                      } else {
                        Alert.alert('Error', 'Failed to confirm collection.');
                      }
                    }}
                  >
                    <Text style={[
                    styles.confirmText,
                    canConfirm && { color: '#023F0F' }  // black text if tappable
                  ]}>
                    {isConfirmed ? 'COLLECTION CONFIRMED' : 'CONFIRM COLLECTION'}
                  </Text>

                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.proofModalText}>No proof of collection uploaded yet.</Text>
                {((isSellingPost && isPostOwner) || (!isSellingPost && isOfferer)) && transaction?.status === 'for_collection' && (
                  <TouchableOpacity onPress={handleUploadProof}>UPLOAD PROOF</TouchableOpacity>
                )}
              </View>
            )}
      
            <TouchableOpacity
              onPress={() => setProofModalVisible(false)}
              style={[styles.modalButton, {  marginTop: 10 }]}
            >
              <Text style={{ fontWeight: 'bold',color:'white' }}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      )}

        {/* Confirmation Popup */}
        {confirmVisible && (
          <View style={styles.modalBackdrop} >
            <View style={styles.modalBox}>
              <Text style={styles.modalText}>Are you sure you want to complete this transaction?</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setConfirmVisible(false)}
                  style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                >
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePostOwnerConfirm}
                  style={[styles.modalButton, { backgroundColor: '#00D964' }]}
                >
                  <Text style={{ fontWeight: 'bold', color: '#003d1a' }}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}  
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'regular',
    textTransform: 'uppercase',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: '#1A3620',
    position: 'relative',
  },

  proofCard: {
    backgroundColor: '#1E592B',
    borderColor: '#00FF57',
    borderWidth: 1,
    borderRadius: 12,
    padding: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal:12,
    paddingVertical:6,

  },
  
  proofTextContainer: {
    flex: 1,
  },
  
  proofCardTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
 
  
  },
  
  proofCardSubtitle: {
    color: '#ccc',
    fontSize: 12,
  },
  
  proofCardImage: {
    width:60,
    height:50,
    marginLeft: 8,
  },
  
  proofModalContainer: {
    width: '91%',
    backgroundColor: '#1A3620',
    padding: 22,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 8,
   
  },
  
  proofModalHeader: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'regular',
    marginBottom: 12,
    textAlign: 'center',
  },
  
  proofModalText: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 10,
  },
  
  proofUploadText: {
    fontSize: 14,
    color: '#00D964',
    fontWeight: 'bold',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  
  proofImage: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    marginTop: 8,
  },
  

  offerPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 10,
  },
  
  offerPesoIcon: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },
  
  offerPriceText: {
    color: '#00FF57',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  modeIcon: {
    width: 18,
    height: 18,
  },
  modeText: {
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  

  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  
  locationIcon: {
    width: 18, // ← change icon size independently here
    height: 18,
    marginRight: 4,
  },
  
  itemList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    marginBottom: 10,
    gap: 6,
  },
  
  itemChip: {
    backgroundColor: '#1E592B',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  itemChipText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  
  container: { flex: 1, padding: 16 },
  header: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20
  },
  card: {
    backgroundColor: '#1A3620',
    borderRadius: 12,
    padding: 16,
    marginBottom: 5
  },
  cardRow: {
    backgroundColor: '#1A3620',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  sectionTitle: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600'
  },
  status: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 15
  },
  bigText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  subLabel: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500'
  },
  subValue: {
    color: 'white',
    fontSize: 13
  },
  collectorName: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 10
  },
  offererName: {
    color: '#bbb',
    fontWeight: '500'
  },
  icon: {
    fontSize: 16
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 10
  },
  confirmButton: {
    backgroundColor: '#00D964',
    paddingVertical: 14,
    paddingHorizontal:60,
    borderRadius: 100,
    alignItems: 'center'
  },
  confirmText: {
    color: 'darkgray',
    fontWeight: 'bold'
  },
  proofText: {
    color: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#023F0F'
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    padding: 10,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  collectionStatusContainer: {
    backgroundColor: '#0C1F10',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  collectionStatusHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  collectionStatusText: {
    color: '#BBB',
    fontSize: 14,
    marginBottom: 10,
  },
  collectionProofImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  
});
