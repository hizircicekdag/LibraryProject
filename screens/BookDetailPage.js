import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import ReadingTracker from './ReadingTracker';

export default function BookDetailPage({ route, navigation }) {
  const { book, bookCaseId } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteDetailVisible, setNoteDetailVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedText, setEditedText] = useState('');
  const db = getFirestore();

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const bookCaseRef = doc(db, "bookCases", bookCaseId);
      const bookCaseSnap = await getDoc(bookCaseRef);
      
      if (bookCaseSnap.exists()) {
        const bookCaseData = bookCaseSnap.data();
        const currentBook = bookCaseData.books.find(b => 
          b.title === book.title && b.author === book.author
        );
        setNotes(currentBook?.notes || []);
      }
    } catch (error) {
      console.error('Not - Alıntı yüklenirken hata:', error);
    }
  };

  const handleAddNote = async () => {
    if (!noteTitle.trim() || !noteText.trim()) {
      Alert.alert('Hata', 'Başlık ve metin alanı boş olamaz!');
      return;
    }

    try {
      setLoading(true);
      const bookCaseRef = doc(db, "bookCases", bookCaseId);
      const bookCaseSnap = await getDoc(bookCaseRef);
      
      if (bookCaseSnap.exists()) {
        const bookCaseData = bookCaseSnap.data();
        const bookIndex = bookCaseData.books.findIndex(b => 
          b.title === book.title && b.author === book.author
        );

        if (bookIndex === -1) {
          throw new Error('Kitap bulunamadı');
        }

        const updatedBooks = [...bookCaseData.books];
        const currentBook = updatedBooks[bookIndex];
        
        if (!currentBook.notes) {
          currentBook.notes = [];
        }

        currentBook.notes.push({
          id: Date.now().toString(),
          title: noteTitle.trim(),
          text: noteText.trim(),
          createdAt: new Date().toISOString()
        });

        updatedBooks[bookIndex] = currentBook;

        await updateDoc(bookCaseRef, {
          books: updatedBooks
        });

        await loadNotes();
        
        setModalVisible(false);
        setNoteTitle('');
        setNoteText('');
        Alert.alert('Başarılı', 'Not - Alıntı başarıyla eklendi!');
      }
    } catch (error) {
      console.error('Not - Alıntı ekleme hatası:', error);
      Alert.alert('Hata', 'Not - Alıntı eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async () => {
    Alert.alert(
      'Notu - Alıntıyı Sil',
      'Bu notu - alıntıyı silmek istediğinizden emin misiniz?',
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
              const bookCaseRef = doc(db, "bookCases", bookCaseId);
              const bookCaseSnap = await getDoc(bookCaseRef);
              
              if (bookCaseSnap.exists()) {
                const bookCaseData = bookCaseSnap.data();
                const updatedBooks = bookCaseData.books.map(b => {
                  if (b.title === book.title && b.author === book.author) {
                    return {
                      ...b,
                      notes: b.notes.filter(note => note.id !== selectedNote.id)
                    };
                  }
                  return b;
                });

                await updateDoc(bookCaseRef, { books: updatedBooks });
                await loadNotes();
                setNoteDetailVisible(false);
                Alert.alert('Başarılı', 'Not - Alıntı başarıyla silindi!');
              }
            } catch (error) {
              console.error('Not - Alıntı silme hatası:', error);
              Alert.alert('Hata', 'Not - Alıntı silinirken bir hata oluştu.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleUpdateNote = async () => {
    if (!editedTitle.trim() || !editedText.trim()) {
      Alert.alert('Hata', 'Başlık ve metin alanı boş olamaz!');
      return;
    }

    try {
      setLoading(true);
      const bookCaseRef = doc(db, "bookCases", bookCaseId);
      const bookCaseSnap = await getDoc(bookCaseRef);
      
      if (bookCaseSnap.exists()) {
        const bookCaseData = bookCaseSnap.data();
        const updatedBooks = bookCaseData.books.map(b => {
          if (b.title === book.title && b.author === book.author) {
            return {
              ...b,
              notes: b.notes.map(note => {
                if (note.id === selectedNote.id) {
                  return {
                    ...note,
                    title: editedTitle.trim(),
                    text: editedText.trim(),
                    updatedAt: new Date().toISOString()
                  };
                }
                return note;
              })
            };
          }
          return b;
        });

        await updateDoc(bookCaseRef, { books: updatedBooks });
        await loadNotes();
        setIsEditing(false);
        Alert.alert('Başarılı', 'Not - Alıntı başarıyla güncellendi!');
      }
    } catch (error) {
      console.error('Not - Alıntı güncelleme hatası:', error);
      Alert.alert('Hata', 'Not - Alıntı güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const renderNoteItem = (note) => (
    <TouchableOpacity 
      key={note.id}
      style={styles.noteItem}
      onPress={() => {
        setSelectedNote(note);
        setNoteDetailVisible(true);
      }}
    >
      <View style={styles.noteHeader}>
        <Text style={styles.noteTitle}>{note.title}</Text>
        <Text style={styles.noteDate}>
          {new Date(note.createdAt).toLocaleDateString('tr-TR')}
        </Text>
      </View>
      <Text style={styles.notePreview} numberOfLines={2}>
        {note.text}
      </Text>
    </TouchableOpacity>
  );

  const READING_STATUSES = {
    unread: { label: 'Okunmadı', color: '#6B7280', icon: 'book-outline' },
    reading: { label: 'Okunuyor', color: '#2563EB', icon: 'book' },
    finished: { label: 'Okundu', color: '#059669', icon: 'checkmark-circle' },
    dnf: { label: 'Yarım Bırakıldı', color: '#DC2626', icon: 'close-circle' }
  };

  

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.author}>{book.author}</Text>
            
            <View style={[styles.statusBadge, { backgroundColor: READING_STATUSES[book.readingStatus || 'unread'].color }]}>
              <Ionicons 
                name={READING_STATUSES[book.readingStatus || 'unread'].icon} 
                size={16} 
                color="white" 
              />
              <Text style={styles.statusText}>
                {READING_STATUSES[book.readingStatus || 'unread'].label}
              </Text>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            {book.genre && (
              <View style={styles.detailItem}>
                <Ionicons name="bookmark-outline" size={20} color="#666" />
                <Text style={styles.detailText}>Tür: {book.genre}</Text>
              </View>
            )}
            {book.publisher && (
              <View style={styles.detailItem}>
                <Ionicons name="business-outline" size={20} color="#666" />
                <Text style={styles.detailText}>Yayınevi: {book.publisher}</Text>
              </View>
            )}
            {book.publicationYear && (
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.detailText}>Basım Yılı: {book.publicationYear}</Text>
              </View>
            )}
            {book.pageCount && (
              <View style={styles.detailItem}>
                <Ionicons name="document-text-outline" size={20} color="#666" />
                <Text style={styles.detailText}>Sayfa Sayısı: {book.pageCount}</Text>
              </View>
            )}

            <View style={styles.detailsContainer}>
              {/* Mevcut detay bilgileri */}
            </View>

            <ReadingTracker 
              book={book}
              bookCaseId={bookCaseId}
              onProgressUpdate={() => loadNotes()} // Veya sayfayı yenilemek için başka bir fonksiyon
            />
          </View>

          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notlarım - Alıntılarım</Text>
            <ScrollView style={styles.notesList}>
              {notes.length > 0 ? (
                notes.map(renderNoteItem)
              ) : (
                <Text style={styles.emptyNotesText}>Henüz not - alıntı eklenmemiş</Text>
              )}
            </ScrollView>
          </View>
        </ScrollView>

        <TouchableOpacity 
          style={styles.fabButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Not - Alıntı Ekle</Text>
              
              <TextInput
                style={styles.titleInput}
                placeholder="Not - Alıntı Başlığı"
                value={noteTitle}
                onChangeText={setNoteTitle}
                editable={!loading}
              />

              <ScrollView 
                style={styles.noteInputContainer}
                showsVerticalScrollIndicator={true}
              >
                <TextInput
                  style={styles.noteInput}
                  placeholder="Notunuzu - Alıntınızı buraya yazın..."
                  multiline={true}
                  value={noteText}
                  onChangeText={setNoteText}
                  editable={!loading}
                  scrollEnabled={false}
                />
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setModalVisible(false);
                    setNoteTitle('');
                    setNoteText('');
                  }}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleAddNote}
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

        <Modal
          animationType="fade"
          transparent={true}
          visible={noteDetailVisible}
          onRequestClose={() => setNoteDetailVisible(false)}
        >
          <View style={styles.noteDetailContainer}>
            <View style={styles.noteDetailContent}>
              <View style={styles.noteDetailHeader}>
                <View style={styles.noteDetailActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                      setEditedTitle(selectedNote?.title || '');
                      setEditedText(selectedNote?.text || '');
                      setIsEditing(true);
                    }}
                  >
                    <Ionicons name="pencil" size={24} color="#4CAF50" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={handleDeleteNote}
                  >
                    <Ionicons name="trash-bin" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
                {isEditing ? (
                  <TextInput
                    style={styles.editTitleInput}
                    value={editedTitle}
                    onChangeText={setEditedTitle}
                    placeholder="Not - Alıntı Başlığı"
                  />
                ) : (
                  <Text style={styles.noteDetailTitle}>{selectedNote?.title}</Text>
                )}
                <Text style={styles.noteDetailDate}>
                  {selectedNote && new Date(selectedNote.createdAt).toLocaleDateString('tr-TR')}
                </Text>
              </View>
              
              <ScrollView 
                style={styles.noteDetailScroll}
                showsVerticalScrollIndicator={true}
              >
                <View style={styles.noteDetailTextContainer}>
                  {isEditing ? (
                    <TextInput
                      style={styles.editNoteInput}
                      value={editedText}
                      onChangeText={setEditedText}
                      multiline
                      placeholder="Notunuzu - Alıntınızı buraya yazın..."
                    />
                  ) : (
                    <Text style={styles.noteDetailText}>{selectedNote?.text}</Text>
                  )}
                </View>
              </ScrollView>

              {isEditing ? (
                <View style={styles.editButtons}>
                  <TouchableOpacity 
                    style={[styles.editButton, styles.cancelButton]}
                    onPress={() => setIsEditing(false)}
                  >
                    <Text style={styles.cancelButtonText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.editButton, styles.saveButton]}
                    onPress={handleUpdateNote}
                  >
                    <Text style={styles.saveButtonText}>Kaydet</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setNoteDetailVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Kapat</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  author: {
    fontSize: 18,
    color: '#666',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  detailsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  fabButton: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    marginBottom: 16,
    textAlign: 'center',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  noteInputContainer: {
    maxHeight: '60%',
    marginBottom: 16,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
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
  notesSection: {
    flex: 1,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  notesList: {
    paddingHorizontal: 20,
  },
  noteItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  noteDate: {
    fontSize: 12,
    color: '#666',
  },
  notePreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyNotesText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  noteDetailContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteDetailContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  noteDetailHeader: {
    marginBottom: 16,
  },
  noteDetailActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  actionButton: {
    padding: 8,
    marginLeft: 16,
  },
  editTitleInput: {
    fontSize: 20,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  editNoteInput: {
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  editButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  noteDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noteDetailDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  noteDetailScroll: {
    maxHeight: Dimensions.get('window').height * 0.4,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
  },
  noteDetailTextContainer: {
    paddingBottom: 10,
  },
  noteDetailText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
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