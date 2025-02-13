import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Alert,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';
import { auth } from '../config/firebaseConfig';
import { getFirestore, collection, addDoc, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function BookCasePage({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [bookCaseName, setBookCaseName] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookCases, setBookCases] = useState([]);
  const db = getFirestore();

  useEffect(() => {
    // Kitaplıkları gerçek zamanlı olarak dinle
    const userId = auth.currentUser.uid;
    const q = query(
      collection(db, "bookCases"),
      where("userId", "==", userId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const bookCasesList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // books array'inin uzunluğunu kontrol et, eğer books yoksa 0 döndür
        const bookCount = data.books ? data.books.length : 0;
        bookCasesList.push({ 
          id: doc.id, 
          ...data,
          bookCount // Kitap sayısını ekle
        });
      });
      setBookCases(bookCasesList);
    });

    return () => unsubscribe();
  }, []);

  const checkBookCaseExists = async (name) => {
    const userId = auth.currentUser.uid;
    const q = query(
      collection(db, "bookCases"),
      where("userId", "==", userId),
      where("name", "==", name)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleAddBookCase = async () => {
    if (!bookCaseName.trim()) {
      Alert.alert('Hata', 'Kitaplık adı boş olamaz!');
      return;
    }

    try {
      setLoading(true);
      const exists = await checkBookCaseExists(bookCaseName);
      
      if (exists) {
        Alert.alert('Hata', 'Bu isimde bir kitaplık zaten mevcut!');
        return;
      }

      await addDoc(collection(db, "bookCases"), {
        name: bookCaseName,
        userId: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
        books: [] // Boş books array'i ekle
      });

      setModalVisible(false);
      setBookCaseName('');
      Alert.alert('Başarılı', 'Kitaplık başarıyla eklendi!');
    } catch (error) {
      console.error('Kitaplık ekleme hatası:', error);
      Alert.alert('Hata', 'Kitaplık eklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const renderBookCase = ({ item }) => (
    <TouchableOpacity 
      style={styles.bookCaseItem}
      onPress={() => navigation.navigate('Books', { bookCase: item })}
    >
      <Text style={styles.bookCaseName}>{item.name}</Text>
      <Text style={styles.bookCount}>{item.bookCount} Kitap</Text>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateText}>Henüz kitaplık eklenmemiş</Text>
      <Text style={styles.emptyStateSubText}>Kitaplık eklemek için sağ alttaki + butonunu kullanabilirsiniz</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {bookCases.length > 0 ? (
        <FlatList
          data={bookCases}
          renderItem={renderBookCase}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: 15,
            paddingTop: 20,
          }}
          ListEmptyComponent={renderEmptyList}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>Henüz kitaplık eklenmemiş</Text>
          <Text style={styles.emptyStateSubText}>Kitaplık eklemek için sağ alttaki + butonunu kullanabilirsiniz</Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yeni Kitaplık Ekle</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Kitaplık Adı"
              value={bookCaseName}
              onChangeText={setBookCaseName}
              editable={!loading}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setBookCaseName('');
                }}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddBookCase}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
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
    width: '80%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    borderColor: '#007AFF',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bookCaseItem: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookCaseName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  bookCount: {
    fontSize: 14,
    color: '#666',
  },
  bookCaseList: {
    flex: 1,
    paddingHorizontal: 15,
    marginTop: 20,
  },
  fab: {
    position: 'absolute',
    left: 30,
    bottom: 30,
    backgroundColor: '#4CAF50',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
  },
});