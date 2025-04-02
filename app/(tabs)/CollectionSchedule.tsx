// CollectionScheduleScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { Button } from 'react-native-paper';
import { offersService } from '../../services/offersService';

type CollectionScheduleRouteProp = RouteProp<RootStackParamList, 'CollectionSchedule'>;

interface Schedule {
    status: string;
    scheduled_time: string;
    scheduled_date: string;
    collectorName: string;
    offererName: string;
    photoUrl: string;
    purok: string;
    barangay: string;
    user_id: string;
}

const CollectionSchedule = () => {
    const navigation = useNavigation();
    const route = useRoute<CollectionScheduleRouteProp>();
    const offerId = route.params?.offerID;
    console.log("Received offer ID:", offerId);

    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const data = await offersService.getOfferSchedule(offerId);
                setSchedule(data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching schedule:", error);
            }
        };
        fetchSchedule();
    }, [offerId]);

    const handleGoToChat = () => {
        // navigation.navigate('Chat', { userId: schedule.user_id });
    };

    const handleCancelSchedule = async () => {
        try {
            await offersService.cancelSchedule(offerId);
            navigation.goBack();
        } catch (error) {
            console.error("Error cancelling schedule:", error);
        }
    };

    if (loading) {
        return <Text>Loading...</Text>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.status}>{schedule?.status}</Text>
            <Text style={styles.time}>{schedule?.scheduled_time} - {schedule?.scheduled_date}</Text>
            <Text style={styles.location}>{schedule?.purok}, {schedule?.barangay}</Text>
            <Image source={{ uri: schedule?.photoUrl }} style={styles.image} />
            <Text style={styles.collectedBy}>To be collected by: {schedule?.collectorName}</Text>
            <Text style={styles.from}>From: {schedule?.offererName}</Text>

            <View style={styles.buttonRow}>
                <Button mode="contained" onPress={handleGoToChat} style={styles.button}>Go to Chat</Button>
                <Button mode="contained" onPress={handleCancelSchedule} style={styles.button}>Cancel Schedule</Button>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: '#023F0F', flex: 1 },
    status: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
    time: { fontSize: 18, color: '#FFF' },
    location: { fontSize: 16, color: '#CCC' },
    image: { width: '100%', height: 200, marginVertical: 10 },
    collectedBy: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
    from: { fontSize: 16, color: '#FFF' },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
    button: { backgroundColor: '#1E592B', padding: 10, borderRadius: 8 },
});

export default CollectionSchedule;
