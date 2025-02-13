import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform, 
  StatusBar,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  FlatList,
  Pressable
} from 'react-native';
import { auth } from '../config/firebaseConfig';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Calendar } from 'react-native-calendars';
import { getFirestore, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { format } from 'date-fns'; // Tarih formatlama içi


export default function MainPage({ navigation }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedGoalIndex, setSelectedGoalIndex] = useState(null);
  const [goalForm, setGoalForm] = useState({
    title: '',
    pages: '',
    notes: ''
  });
  const [readingGoals, setReadingGoals] = useState({});
  const [selectedDateGoals, setSelectedDateGoals] = useState([]);

  const db = getFirestore();

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        setReadingGoals(data.readingGoals || {});
      }
    } catch (error) {
      console.error('Error loading goals:', error);
      Alert.alert('Hata', 'Hedefler yüklenirken bir hata oluştu.');
    }
  };

  const handleDayPress = (day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDay = new Date(day.dateString);
    
    if (selectedDay < today) {
      Alert.alert('Uyarı', 'Geçmiş tarihlere hedef ekleyemezsiniz.');
      return;
    }

    setSelectedDate(day.dateString);
    
    if (readingGoals[day.dateString] && readingGoals[day.dateString].goals) {
      setSelectedDateGoals(readingGoals[day.dateString].goals);
      setViewModalVisible(true);
    } else {
      setModalVisible(true);
    }
  };

  const closeAllModals = () => {
    setModalVisible(false);
    setViewModalVisible(false);
    setEditModalVisible(false);
    setActionModalVisible(false);
    setGoalForm({ title: '', pages: '', notes: '' });
    setSelectedGoalIndex(null);
  };

  const handleSaveGoal = async () => {
    if (!goalForm.title.trim()) {
      Alert.alert('Hata', 'Lütfen hedef başlığı girin.');
      return;
    }

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(userRef);
      
      const newGoal = {
        title: goalForm.title,
        pages: goalForm.pages,
        notes: goalForm.notes,
        completed: false
      };

      let updatedGoals = { ...readingGoals };
      
      if (!updatedGoals[selectedDate]) {
        updatedGoals[selectedDate] = {
          goals: [newGoal]
        };
      } else {
        updatedGoals[selectedDate].goals = [
          ...(updatedGoals[selectedDate].goals || []),
          newGoal
        ];
      }

      if (!docSnap.exists()) {
        await setDoc(userRef, {
          email: auth.currentUser.email,
          readingGoals: updatedGoals,
          createdAt: new Date().toISOString()
        });
      } else {
        await updateDoc(userRef, {
          readingGoals: updatedGoals
        });
      }

      setReadingGoals(updatedGoals);
      closeAllModals();
      Alert.alert('Başarılı', 'Okuma hedefi kaydedildi!');
    } catch (error) {
      console.error('Error saving goal:', error);
      Alert.alert('Hata', 'Hedef kaydedilirken bir hata oluştu.');
    }
  };
  
  const handleEditGoal = async () => {
    if (!goalForm.title.trim()) {
      Alert.alert('Hata', 'Lütfen hedef başlığı girin.');
      return;
    }

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      let updatedGoals = { ...readingGoals };
      
      updatedGoals[selectedDate].goals[selectedGoalIndex] = {
        ...updatedGoals[selectedDate].goals[selectedGoalIndex],
        title: goalForm.title,
        pages: goalForm.pages,
        notes: goalForm.notes
      };

      await updateDoc(userRef, {
        readingGoals: updatedGoals
      });

      setReadingGoals(updatedGoals);
      if (updatedGoals[selectedDate]) {
        setSelectedDateGoals(updatedGoals[selectedDate].goals);
      }
      closeAllModals();
      Alert.alert('Başarılı', 'Hedef güncellendi!');
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Hata', 'Hedef güncellenirken bir hata oluştu.');
    }
  };

  const handleDeleteGoal = async () => {
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      let updatedGoals = { ...readingGoals };
      
      updatedGoals[selectedDate].goals = updatedGoals[selectedDate].goals.filter(
        (_, index) => index !== selectedGoalIndex
      );

      if (updatedGoals[selectedDate].goals.length === 0) {
        delete updatedGoals[selectedDate];
      }

      await updateDoc(userRef, {
        readingGoals: updatedGoals
      });

      setReadingGoals(updatedGoals);
      closeAllModals();
      
      if (updatedGoals[selectedDate]) {
        setSelectedDateGoals(updatedGoals[selectedDate].goals);
        setViewModalVisible(true);
      }
      
      Alert.alert('Başarılı', 'Hedef silindi!');
    } catch (error) {
      console.error('Error deleting goal:', error);
      Alert.alert('Hata', 'Hedef silinirken bir hata oluştu.');
    }
  };

  const startEditGoal = (index) => {
    const goal = selectedDateGoals[index];
    setSelectedGoalIndex(index);
    setGoalForm({
      title: goal.title,
      pages: goal.pages,
      notes: goal.notes
    });
    setViewModalVisible(false);
    setEditModalVisible(true);
  };

  const getMarkedDates = () => {
    const marked = {};
    Object.keys(readingGoals).forEach(date => {
      const goals = readingGoals[date].goals || [];
      const allCompleted = goals.every(goal => goal.completed);
      
      marked[date] = {
        marked: true,
        dotColor: allCompleted ? '#4CAF50' : '#2196F3',
        selected: date === selectedDate,
        selectedColor: '#E8F5E9'
      };
    });
    return marked;
  };

  const renderGoalItem = ({ item, index }) => (
    <Pressable
      onPress={() => startEditGoal(index)}
      style={styles.goalItem}
    >
      <Text style={styles.goalTitle}>{item.title}</Text>
      {item.pages && (
        <Text style={styles.goalDetail}>Hedef Sayfa: {item.pages}</Text>
      )}
      {item.notes && (
        <Text style={styles.goalDetail}>Notlar: {item.notes}</Text>
      )}
    </Pressable>
  );

  const [showAllGoals, setShowAllGoals] = useState(false);
  const [showFullList, setShowFullList] = useState(false);

  const getUpcomingGoals = () => {
    const allGoals = getAllGoals();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return allGoals.filter(goal => {
      const goalDate = new Date(goal.date);
      return goalDate >= today;
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy');
  };

  const GoalCard = ({ goal }) => (
    <TouchableOpacity 
      style={styles.goalCard}
      onPress={() => {
        setSelectedDate(goal.date);
        const dateGoals = readingGoals[goal.date].goals;
        setSelectedDateGoals(dateGoals);
        setViewModalVisible(true);
      }}
    >
      <View style={styles.goalCardHeader}>
        <Text style={styles.goalCardTitle}>{goal.title}</Text>
        <Text style={styles.goalCardDate}>{formatDate(goal.date)}</Text>
      </View>
      {goal.pages && (
        <Text style={styles.goalCardDetail}>Hedef: {goal.pages} sayfa</Text>
      )}
      {goal.notes && (
        <Text style={styles.goalCardDetail} numberOfLines={1}>
          {goal.notes}
        </Text>
      )}
    </TouchableOpacity>
  );

  const UpcomingGoalsSection = () => {
    // State'i tanımlayalım
    const [showFullList, setShowFullList] = useState(false);
    const upcomingGoals = getUpcomingGoals();
      
    return (
      <>
        <View style={styles.upcomingGoalsContainer}>
          <Text style={styles.sectionTitle}>Yaklaşan Hedefler</Text>
          
          {upcomingGoals.length > 0 ? (
            <>
              {upcomingGoals.slice(0, 3).map((goal, index) => (
                <GoalCard key={`${goal.date}-${index}`} goal={goal} />
              ))}
              
              {getAllGoals().length > 3 && (
                <TouchableOpacity 
                  style={styles.showMoreButton}
                  onPress={() => setShowFullList(true)}
                >
                  <Text style={styles.showMoreText}>daha fazla</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.noGoalsText}>Henüz hedef eklenmemiş</Text>
          )}
        </View>
  
        {/* Modal'i aynı component içinde render edelim */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showFullList}
          onRequestClose={() => setShowFullList(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Tüm Hedefler</Text>
              
              {getAllGoals().length > 0 ? (
                <FlatList
                  data={getAllGoals()}
                  renderItem={({ item }) => (
                    <GoalCard goal={item} />
                  )}
                  keyExtractor={(item, index) => `${item.date}-${index}`}
                  style={styles.allGoalsList}
                />
              ) : (
                <Text style={styles.noGoalsText}>Henüz hedef eklenmemiş</Text>
              )}
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowFullList(false)}
              >
                <Text style={styles.cancelButtonText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </>
    );
  };

  const getAllGoals = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allGoals = [];
    
    // readingGoals objesini kontrol et
    if (readingGoals && typeof readingGoals === 'object') {
      Object.entries(readingGoals).forEach(([date, data]) => {
        if (data && data.goals && Array.isArray(data.goals)) {
          data.goals.forEach(goal => {
            allGoals.push({
              ...goal,
              date: date
            });
          });
        }
      });
    }

    // Tarihe göre sırala
    return allGoals.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const AllGoalsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showFullList}
      onRequestClose={() => setShowFullList(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Tüm Hedefler</Text>
          
          {getAllGoals().length > 0 ? (
            <FlatList
              data={getAllGoals()}
              renderItem={({ item }) => (
                <GoalCard goal={item} />
              )}
              keyExtractor={(item, index) => `${item.date}-${index}`}
              style={styles.allGoalsList}
            />
          ) : (
            <Text style={styles.noGoalsText}>Henüz hedef eklenmemiş</Text>
          )}
          
          <TouchableOpacity 
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => setShowFullList(false)}
          >
            <Text style={styles.cancelButtonText}>Kapat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Icon name="person" size={26} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.calendarContainer}>
          <Text style={styles.sectionTitle}>Okuma Hedeflerim</Text>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={getMarkedDates()}
            theme={{
              selectedDayBackgroundColor: '#4CAF50',
              todayTextColor: '#4CAF50',
              arrowColor: '#4CAF50',
            }}
          />
        </View>

        <UpcomingGoalsSection />

        <TouchableOpacity 
          style={styles.bookCaseButton}
          onPress={() => navigation.navigate('BookCase')}
        >
          <Text style={styles.buttonText}>Kitaplığım</Text>
        </TouchableOpacity>
      </ScrollView>


      {/* Hedef Ekleme Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Okuma Hedefi Ekle</Text>
            <Text style={styles.dateText}>{selectedDate}</Text>

            <TextInput
              style={styles.input}
              placeholder="Hedef Başlığı"
              value={goalForm.title}
              onChangeText={(text) => setGoalForm({...goalForm, title: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Hedef Sayfa Sayısı"
              value={goalForm.pages}
              onChangeText={(text) => setGoalForm({...goalForm, pages: text})}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notlar"
              value={goalForm.notes}
              onChangeText={(text) => setGoalForm({...goalForm, notes: text})}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveGoal}
              >
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Hedefleri Görüntüleme Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={viewModalVisible}
        onRequestClose={() => setViewModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Günün Hedefleri</Text>
            <Text style={styles.dateText}>{selectedDate}</Text>
            <Text style={styles.helperText}>Düzenlemek veya silmek için hedefe tıklayın</Text>

            <FlatList
              data={selectedDateGoals}
              renderItem={renderGoalItem}
              keyExtractor={(item, index) => index.toString()}
              style={styles.goalsList}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setViewModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Kapat</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => {
                  setViewModalVisible(false);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.saveButtonText}>Yeni Hedef Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

     {/* Hedef Düzenleme Modalı */}
     <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => closeAllModals()}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Hedefi Düzenle</Text>
            <Text style={styles.dateText}>{selectedDate}</Text>

            <TextInput
              style={styles.input}
              placeholder="Hedef Başlığı"
              value={goalForm.title}
              onChangeText={(text) => setGoalForm({...goalForm, title: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Hedef Sayfa Sayısı"
              value={goalForm.pages}
              onChangeText={(text) => setGoalForm({...goalForm, pages: text})}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notlar"
              value={goalForm.notes}
              onChangeText={(text) => setGoalForm({...goalForm, notes: text})}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => closeAllModals()}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleEditGoal}
              >
                <Text style={styles.saveButtonText}>Güncelle</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => {
                Alert.alert(
                  'Hedefi Sil',
                  'Bu hedefi silmek istediğinizden emin misiniz?',
                  [
                    {
                      text: 'İptal',
                      style: 'cancel'
                    },
                    {
                      text: 'Sil',
                      onPress: handleDeleteGoal,
                      style: 'destructive'
                    }
                  ]
                );
              }}
            >
              <Text style={styles.deleteButtonText}>Hedefi Sil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileButton: {
    padding: 8,
  },
  iconContainer: {
    backgroundColor: '#4CAF50',
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 18,
    marginBottom: 30,
  },
  calendarContainer: {
    marginVertical: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bookCaseButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    height: 45,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  deleteButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  goalItem: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  goalDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  goalsList: {
    maxHeight: 300,
    marginBottom: 10,
  },
  helperText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  upcomingGoalsContainer: {
    marginVertical: 20,
    paddingHorizontal: 5,
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8, // Kartlar arası mesafeyi azalttık
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  goalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  goalCardDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
  goalCardDetail: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  showMoreButton: {
    alignItems: 'center',
    padding: 10,
    marginTop: 5,
  },
  showMoreButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
  },
  noGoalsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 10,
    fontStyle: 'italic',
  },
  noGoalsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginVertical: 20,
    fontStyle: 'italic',
  },
  
  allGoalsList: {
    maxHeight: '80%',
    marginBottom: 10,
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8, // Kartlar arası mesafeyi azalttık
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  goalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalCardTitle: {
    fontSize: 14, // Yazı boyutunu küçülttük
    fontWeight: '600',
    flex: 1,
  },
  goalCardDate: {
    fontSize: 12, // Yazı boyutunu küçülttük
    color: '#666',
    marginLeft: 8,
  },
  goalCardDetail: {
    fontSize: 12, // Yazı boyutunu küçülttük
    color: '#666',
    marginTop: 2,
  },
  showMoreButton: {
    alignItems: 'center',
    padding: 8,
    marginTop: 4,
  },
  showMoreText: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
  },
  allGoalsList: {
    maxHeight: '80%',
    marginBottom: 10,
  },
});