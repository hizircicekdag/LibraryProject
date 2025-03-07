import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

const ReadingTracker = ({ book, bookCaseId, onProgressUpdate }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [readingHistoryModal, setReadingHistoryModal] = useState(false);
  const [dailyPagesRead, setDailyPagesRead] = useState('');
  const [currentPage, setCurrentPage] = useState(book.currentPage || 0);
  const [tempCurrentPage, setTempCurrentPage] = useState((book.currentPage || 0).toString());
  const [readingSessions, setReadingSessions] = useState(book.readingSessions || []);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const db = getFirestore();

  useEffect(() => {
    setCurrentPage(book.currentPage || 0);
    setTempCurrentPage((book.currentPage || 0).toString());
    setReadingSessions(book.readingSessions || []);
  }, [book]);

    const updateBookProgress = async (newCurrentPage, pagesRead = 0) => {
    if (book.pageCount && newCurrentPage > book.pageCount) {
        Alert.alert('Hata', 'Girilen sayfa sayısı kitabın toplam sayfa sayısını aşıyor.');
        return false;
    }

    try {
        setLoading(true);
        const bookCaseRef = doc(db, "bookCases", bookCaseId);
        const bookCaseSnap = await getDoc(bookCaseRef);
        
        if (bookCaseSnap.exists()) {
        const bookCaseData = bookCaseSnap.data();
        let updatedSessions = [...readingSessions]; // Mevcut session'ları kullan
        
        if (pagesRead > 0) {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            
            const todaySessionIndex = updatedSessions.findIndex(session => 
            session.date.split('T')[0] === todayStr
            );

            if (todaySessionIndex !== -1) {
            updatedSessions[todaySessionIndex] = {
                date: today.toISOString(),
                pagesRead: updatedSessions[todaySessionIndex].pagesRead + pagesRead,
                currentPage: newCurrentPage
            };
            } else {
            updatedSessions.push({
                date: today.toISOString(),
                pagesRead: pagesRead,
                currentPage: newCurrentPage
            });
            }
        }

        const updatedBooks = bookCaseData.books.map(b => {
            if (b.title === book.title && b.author === book.author) {
            return {
                ...b,
                currentPage: newCurrentPage,
                readingSessions: updatedSessions,
                readingStatus: newCurrentPage === book.pageCount ? 'finished' : 'reading'
            };
            }
            return b;
        });

        await updateDoc(bookCaseRef, { books: updatedBooks });
        
        // State'leri güncelle
        setCurrentPage(newCurrentPage);
        setReadingSessions(updatedSessions);
        onProgressUpdate && onProgressUpdate();
        return true;
        }
    } catch (error) {
        console.error('Güncelleme hatası:', error);
        Alert.alert('Hata', 'İşlem sırasında bir hata oluştu.');
        return false;
    } finally {
        setLoading(false);
    }
    };

  const handleDailyReading = async () => {
    if (!dailyPagesRead || parseInt(dailyPagesRead) <= 0) {
      Alert.alert('Hata', 'Geçerli bir sayfa sayısı girin.');
      return;
    }

    const pagesReadNum = parseInt(dailyPagesRead);
    const newCurrentPage = parseInt(currentPage) + pagesReadNum;

    const success = await updateBookProgress(newCurrentPage, pagesReadNum);
    if (success) {
      setDailyPagesRead('');
      setModalVisible(false);
      Alert.alert('Başarılı', 'Günlük okuma kaydı eklendi!');
    }
  };

  const handleCurrentPageBlur = async () => {
    if (!tempCurrentPage || parseInt(tempCurrentPage) < 0) {
      setTempCurrentPage(currentPage.toString());
      return;
    }

    const newPageNum = parseInt(newPage);
    const success = await updateBookProgress(newPageNum);
    if (success) {
      Alert.alert('Başarılı', 'Mevcut sayfa güncellendi!');
    }
  };

  const getFilteredSessions = () => {
    const now = new Date();
    
    // Önce tarihleri filtrele
    const filteredSessions = readingSessions.filter(session => {
      const sessionDate = new Date(session.date);
      switch (filterType) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return sessionDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          return sessionDate >= monthAgo;
        default:
          return true;
      }
    });

    const groupedSessions = filteredSessions.reduce((acc, session) => {
        const dateKey = session.date.split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = session;
        } else {
          // Aynı gün içindeki kayıtları birleştir
          acc[dateKey] = {
            ...session,
            pagesRead: acc[dateKey].pagesRead + session.pagesRead,
          };
        }
        return acc;
      }, {});
  
      // Objeyi array'e çevir ve tarihe göre sırala
      return Object.values(groupedSessions).sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
    };

  const getTotalPages = (sessions) => {
    return sessions.reduce((total, session) => total + session.pagesRead, 0);
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.progressButton} 
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="book" size={24} color="#4CAF50" />
          <Text style={styles.progressText}>Okuma Kaydı Ekle</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => setReadingHistoryModal(true)}
        >
          <Ionicons name="time" size={24} color="#2196F3" />
          <Text style={styles.progressText}>Okuma Geçmişi</Text>
        </TouchableOpacity>

        <View style={styles.progressInfo}>
          <Text style={styles.progressInfoText}>
            Mevcut Sayfa: {currentPage} 
            {book.pageCount ? ` / ${book.pageCount}` : ''}
          </Text>
          {book.pageCount && (
            <Text style={styles.progressPercentage}>
              ({Math.round((currentPage / book.pageCount) * 100)}%)
            </Text>
          )}
        </View>
      </View>

      {/* Okuma Kaydı Ekleme Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Okuma Kaydı Ekle</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Günlük Okunan Sayfa</Text>
              <TextInput
                style={styles.input}
                placeholder="Bugün kaç sayfa okudunuz?"
                keyboardType="numeric"
                value={dailyPagesRead}
                onChangeText={setDailyPagesRead}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mevcut Sayfa</Text>
              <TextInput
                style={styles.input}
                placeholder="Kitabın şu an bulunduğunuz sayfası"
                keyboardType="numeric"
                value={tempCurrentPage}
                onChangeText={setTempCurrentPage}
                onBlur={handleCurrentPageBlur}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setDailyPagesRead('');
                }}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleDailyReading}
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

      {/* Okuma Geçmişi Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={readingHistoryModal}
        onRequestClose={() => setReadingHistoryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Okuma Geçmişi</Text>

            <View style={styles.filterButtons}>
              <TouchableOpacity 
                style={[styles.filterButton, filterType === 'all' && styles.activeFilter]}
                onPress={() => setFilterType('all')}
              >
                <Text style={[styles.filterButtonText, filterType === 'all' && styles.activeFilterText]}>
                  Tümü
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterButton, filterType === 'week' && styles.activeFilter]}
                onPress={() => setFilterType('week')}
              >
                <Text style={[styles.filterButtonText, filterType === 'week' && styles.activeFilterText]}>
                  Bu Hafta
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterButton, filterType === 'month' && styles.activeFilter]}
                onPress={() => setFilterType('month')}
              >
                <Text style={[styles.filterButtonText, filterType === 'month' && styles.activeFilterText]}>
                  Bu Ay
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.totalPages}>
              Toplam Okunan: {getTotalPages(getFilteredSessions())} sayfa
            </Text>

            <ScrollView style={styles.sessionsList}>
              {getFilteredSessions().map((session, index) => (
                <View key={index} style={styles.sessionItem}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionDate}>
                      {new Date(session.date).toLocaleDateString('tr-TR')}
                    </Text>
                    <Text style={styles.sessionPages}>
                      {session.pagesRead} sayfa
                    </Text>
                  </View>
                  <Text style={styles.currentPageInfo}>
                    Mevcut Sayfa: {session.currentPage}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setReadingHistoryModal(false)}
            >
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginTop: 16,
  },
  progressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  progressText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressInfoText: {
    fontSize: 16,
    color: '#666',
  },
  progressPercentage: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#f0f0f0',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  activeFilterText: {
    color: '#fff',
  },
  totalPages: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  sessionsList: {
    maxHeight: 300,
  },
  sessionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sessionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 14,
    color: '#666',
  },
  sessionPages: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  currentPageInfo: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  closeButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

export default ReadingTracker;