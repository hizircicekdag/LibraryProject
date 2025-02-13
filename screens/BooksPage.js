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
  ScrollView
} from 'react-native';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const READING_STATUSES = {
    unread: { label: 'Okunmadı', color: '#6B7280', icon: 'book-outline' },
    reading: { label: 'Okunuyor', color: '#2563EB', icon: 'book' },
    finished: { label: 'Okundu', color: '#059669', icon: 'checkmark-circle' },
    dnf: { label: 'Yarım Bırakıldı', color: '#DC2626', icon: 'close-circle' }
  };

export default function BooksPage({ route, navigation }) {
  const { bookCase } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [editingBook, setEditingBook] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    publisher: '',
    publicationYear: '',
    pageCount: '',
    readingStatus: 'unread',
    genre: '' // Yeni eklenen alan
  });

  const db = getFirestore();

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const bookCaseRef = doc(db, "bookCases", bookCase.id);
      const bookCaseSnap = await getDoc(bookCaseRef);
      
      if (bookCaseSnap.exists()) {
        const data = bookCaseSnap.data();
        setBooks(data.books || []);
      }
    } catch (error) {
      console.error('Error loading books:', error);
      Alert.alert('Hata', 'Kitaplar yüklenirken bir hata oluştu.');
    }
  }

  const filterBooks = () => {
    if (activeFilter === 'all') return books;
    return books.filter(book => book.readingStatus === activeFilter);
  };

  
  const handleStatusChange = async (bookIndex, newStatus) => {
    try {
      setLoading(true);
      const updatedBooks = [...books];
      updatedBooks[bookIndex] = {
        ...updatedBooks[bookIndex],
        readingStatus: newStatus
      };

      const bookCaseRef = doc(db, "bookCases", bookCase.id);
      await updateDoc(bookCaseRef, {
        books: updatedBooks
      });

      setBooks(updatedBooks);
    } catch (error) {
      console.error('Status update error:', error);
      Alert.alert('Hata', 'Durum güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const validateBookData = (bookData) => {
    // Zorunlu alanları kontrol et
    if (!bookData.title?.trim() || !bookData.author?.trim()) {
      return false;
    }
  
    const cleanedData = {
      title: bookData.title.trim(),
      author: bookData.author.trim(),
      publisher: bookData.publisher?.trim() || '',
      publicationYear: bookData.publicationYear?.trim() || '',
      pageCount: bookData.pageCount?.trim() || '',
      readingStatus: bookData.readingStatus || 'unread',
      genre: bookData.genre?.trim() || '' // Yeni eklenen alan
    };
  
    return cleanedData;
  };

  const checkBookExists = (newBook, excludeIndex = -1) => {
    return books.some((book, index) => 
      index !== excludeIndex &&
      book.title.toLowerCase() === newBook.title.toLowerCase() && 
      book.author.toLowerCase() === newBook.author.toLowerCase()
    );
  };

  const handleEditBook = (book, index) => {
    setEditingBook(index);
    setBookForm({
      title: book.title || '',
      author: book.author || '',
      publisher: book.publisher || '',
      publicationYear: book.publicationYear || '',
      pageCount: book.pageCount || '',
      readingStatus: book.readingStatus || 'unread'
    });
    setModalVisible(true);
  };

  const handleDeleteBook = (index) => {
    Alert.alert(
      'Kitap Sil',
      'Bu kitabı silmek istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const updatedBooks = [...books];
              updatedBooks.splice(index, 1);
              
              const bookCaseRef = doc(db, "bookCases", bookCase.id);
              await updateDoc(bookCaseRef, {
                books: updatedBooks
              });

              setBooks(updatedBooks);
              Alert.alert('Başarılı', 'Kitap başarıyla silindi!');
            } catch (error) {
              console.error('Kitap silme hatası:', error);
              Alert.alert('Hata', 'Kitap silinirken bir hata oluştu.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };


  const handleSaveBook = async () => {
    const validatedData = validateBookData(bookForm);
    if (!validatedData) {
      Alert.alert('Hata', 'Kitap adı ve yazar alanları zorunludur!');
      return;
    }

    try {
      setLoading(true);

      const newBook = {
        ...validatedData,
        addedAt: editingBook !== null ? books[editingBook].addedAt : new Date().toISOString()
      };

      if (checkBookExists(newBook, editingBook)) {
        Alert.alert('Hata', 'Bu kitap zaten mevcut!');
        return;
      }

      const bookCaseRef = doc(db, "bookCases", bookCase.id);
      const updatedBooks = [...books];
      
      if (editingBook !== null) {
        updatedBooks[editingBook] = newBook;
      } else {
        updatedBooks.push(newBook);
      }
      
      await updateDoc(bookCaseRef, {
        books: updatedBooks
      });

      setBooks(updatedBooks);
      setModalVisible(false);
      resetForm();
      Alert.alert('Başarılı', `Kitap başarıyla ${editingBook !== null ? 'güncellendi' : 'eklendi'}!`);
    } catch (error) {
      console.error('Kitap kaydetme hatası:', error);
      Alert.alert('Hata', 'Kitap kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge = ({ status }) => (
    <View style={[styles.badge, { backgroundColor: READING_STATUSES[status].color }]}>
      <Ionicons name={READING_STATUSES[status].icon} size={12} color="white" />
      <Text style={styles.badgeText}>{READING_STATUSES[status].label}</Text>
    </View>
  );

  const resetForm = () => {
    setBookForm({
      title: '',
      author: '',
      publisher: '',
      publicationYear: '',
      pageCount: '',
      readingStatus: 'unread',
      genre: '' // Yeni eklenen alan
    });
    setEditingBook(null);
  };


  const renderBook = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.bookItem}
      onPress={() => navigation.navigate('BookDetail', {
        book: item,
        bookCaseId: bookCase.id
      })}
    >
      <View style={styles.bookHeader}>
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>{item.title}</Text>
          <Text style={styles.bookAuthor}>{item.author}</Text>
          <StatusBadge status={item.readingStatus || 'unread'} />
        </View>
        <View style={styles.bookActions}>
          <TouchableOpacity 
            onPress={() => handleEditBook(item, index)}
            style={styles.actionButton}
          >
            <Ionicons name="pencil" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleDeleteBook(index)}
            style={styles.actionButton}
          >
            <Ionicons name="trash-bin" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.statusButtons}>
        {Object.entries(READING_STATUSES).map(([status, { label, color }]) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusButton,
              { borderColor: color },
              item.readingStatus === status && { backgroundColor: color }
            ]}
            onPress={() => handleStatusChange(index, status)}
          >
            <Text
              style={[
                styles.statusButtonText,
                { color: item.readingStatus === status ? 'white' : color }
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {item.publisher && <Text style={styles.bookDetail}>Yayınevi: {item.publisher}</Text>}
      {item.publicationYear && <Text style={styles.bookDetail}>Basım Yılı: {item.publicationYear}</Text>}
      {item.pageCount && <Text style={styles.bookDetail}>Sayfa Sayısı: {item.pageCount}</Text>}
    </TouchableOpacity>
  );

  const renderFilters = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.filtersContainer}
    >
      <TouchableOpacity
        style={[
          styles.filterButton,
          activeFilter === 'all' && styles.activeFilterButton
        ]}
        onPress={() => setActiveFilter('all')}
      >
        <Text style={[
          styles.filterButtonText,
          activeFilter === 'all' && styles.activeFilterButtonText
        ]}>
          Tümü
        </Text>
      </TouchableOpacity>
      {Object.entries(READING_STATUSES).map(([status, { label, color }]) => (
        <TouchableOpacity
          key={status}
          style={[
            styles.filterButton,
            activeFilter === status && { backgroundColor: color }
          ]}
          onPress={() => setActiveFilter(status)}
        >
          <Text style={[
            styles.filterButtonText,
            activeFilter === status && styles.activeFilterButtonText
          ]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{bookCase.name}</Text>
      {renderFilters()}
      {filterBooks().length > 0 ? (
        <FlatList
          data={filterBooks()}
          renderItem={renderBook}
          keyExtractor={(item, index) => index.toString()}
          style={styles.booksList}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>
            {activeFilter === 'all' 
              ? 'Henüz kitap eklenmemiş'
              : 'Bu durumda kitap bulunmuyor'}
          </Text>
          <Text style={styles.emptyStateSubText}>
            {activeFilter === 'all'
              ? 'Kitap eklemek için alttaki + butonunu kullanabilirsiniz'
              : 'Farklı bir durum seçebilir veya yeni kitap ekleyebilirsiniz'}
          </Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalContainer}>
          <ScrollView>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingBook !== null ? 'Kitap Düzenle' : 'Yeni Kitap Ekle'}
              </Text>
              
              <TextInput
                style={[styles.input, styles.requiredInput]}
                placeholder="* Kitap Adı"
                value={bookForm.title}
                onChangeText={(text) => setBookForm({...bookForm, title: text})}
                editable={!loading}
              />

              <TextInput
                style={[styles.input, styles.requiredInput]}
                placeholder="* Yazar"
                value={bookForm.author}
                onChangeText={(text) => setBookForm({...bookForm, author: text})}
                editable={!loading}
              />

              <TextInput
                style={styles.input}
                placeholder="Yayınevi"
                value={bookForm.publisher}
                onChangeText={(text) => setBookForm({...bookForm, publisher: text})}
                editable={!loading}
              />

                <TextInput
                    style={styles.input}
                    placeholder="Kitap Türü (örn: Roman, Şiir, Bilim Kurgu)"
                    value={bookForm.genre}
                    onChangeText={(text) => setBookForm({...bookForm, genre: text})}
                    editable={!loading}
                />

              <TextInput
                style={styles.input}
                placeholder="Basım Yılı"
                value={bookForm.publicationYear}
                onChangeText={(text) => setBookForm({...bookForm, publicationYear: text})}
                editable={!loading}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Sayfa Sayısı"
                value={bookForm.pageCount}
                onChangeText={(text) => setBookForm({...bookForm, pageCount: text})}
                editable={!loading}
                keyboardType="numeric"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveBook}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {editingBook !== null ? 'Güncelle' : 'Kaydet'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
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
  addButton: {
    flexDirection: 'row',
    width: '100%',
    height: 50,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bookInfo: {
    flex: 1,
    marginRight: 10,
  },
  bookActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 5,
    marginLeft: 10,
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
    marginTop: 50,
    marginBottom: 50,
    alignSelf: 'center',
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
    marginBottom: 15,
  },
  requiredInput: {
    borderColor: '#4CAF50',
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
  booksList: {
    flex: 1,
  },
  bookItem: {
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
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bookAuthor: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  bookDetail: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
},
badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    maxHeight: 40, // Maksimum yükseklik eklendi
    paddingVertical: 4, // Dikey padding eklendi
  },
  filterButton: {
    paddingHorizontal: 12, // Yatay padding azaltıldı
    paddingVertical: 6,  // Dikey padding azaltıldı
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
    height: 32, // Sabit yükseklik eklendi
    justifyContent: 'center', // İçeriği dikeyde ortala
    alignItems: 'center', // İçeriği yatayda ortala
  },
  filterButtonText: {
    color: '#4b5563',
    fontSize: 13, // Font boyutu küçültüldü
    fontWeight: '500'
},
   activeFilterButton: {
    backgroundColor: '#2563eb',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  statusButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
});