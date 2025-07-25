import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Upload, 
  FileText, 
  User, 
  Bot, 
  Trash2, 
  Plus, 
  MessageCircle, 
  Search,
  Edit2,
  ChevronLeft,
  ChevronRight,
  X,
  Check
} from 'lucide-react';

const RAGChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userExists, setUserExists] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const API_URL = 'http://localhost:8000';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Kiểm tra user tồn tại
  const checkUserExists = async (username) => {
    if (!username.trim()) return false;
    
    try {
      const response = await fetch(`${API_URL}/api/users/${username}`);
      if (response.ok) {
        const data = await response.json();
        setUserId(data.user.id);
        setUserExists(true);
        loadSessions(data.user.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking user:', error);
      return false;
    }
  };

  // Tạo user mới
  const createUser = async () => {
    if (!username.trim()) {
      alert('Vui lòng nhập username!');
      return;
    }

    setIsCreatingUser(true);
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email: '' })
      });

      if (response.ok) {
        const data = await response.json();
        setUserId(data.user_id);
        setUserExists(true);
        setSessions([]);
        alert('Tạo user thành công!');
      } else {
        alert('Không thể tạo user. Username có thể đã tồn tại.');
      }
    } catch (error) {
      alert('Lỗi khi tạo user: ' + error.message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Load sessions của user
  const loadSessions = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}/sessions`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  // Tạo session mới
  const createNewSession = async () => {
    if (!userId) {
      alert('Vui lòng đăng nhập trước!');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, title: 'New Chat' })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSessionId(data.session_id);
        setMessages([]);
        loadSessions(userId);
      }
    } catch (error) {
      alert('Lỗi khi tạo session: ' + error.message);
    }
  };

  // Load messages của session
  const loadSessionMessages = async (sessionId) => {
    try {
      const response = await fetch(`${API_URL}/api/sessions/${sessionId}/messages`);
      if (response.ok) {
        const data = await response.json();
        const formattedMessages = data.messages.map(msg => ({
          id: msg.id,
          type: msg.role === 'user' ? 'user' : 'bot',
          content: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString()
        }));
        setMessages(formattedMessages);
        setCurrentSessionId(sessionId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Cập nhật title session
  const updateSessionTitle = async (sessionId, newTitle) => {
    try {
      const response = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });

      if (response.ok) {
        loadSessions(userId);
        setEditingSessionId(null);
      }
    } catch (error) {
      alert('Lỗi khi cập nhật title: ' + error.message);
    }
  };

  // Xóa session
  const deleteSession = async (sessionId) => {
    if (!confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) return;

    try {
      const response = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
          setMessages([]);
        }
        loadSessions(userId);
      }
    } catch (error) {
      alert('Lỗi khi xóa session: ' + error.message);
    }
  };

  // Gửi câu hỏi
  const sendQuestion = async () => {
    if (!userId || !currentQuestion.trim()) {
      alert('Vui lòng đăng nhập và nhập câu hỏi!');
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: currentQuestion,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentQuestion('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          session_id: currentSessionId,
          question: currentQuestion
        })
      });

      const data = await response.json();
      
      // Cập nhật session_id nếu tạo mới
      if (data.session_id && data.session_id !== currentSessionId) {
        setCurrentSessionId(data.session_id);
        loadSessions(userId);
      }

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.answer || 'Không tìm thấy câu trả lời!',
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: `Lỗi: ${error.message}`,
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuestion();
    }
  };

  const uploadPDF = async () => {
    const file = fileInputRef.current?.files?.[0];
    
    if (!file) {
      setUploadStatus('Vui lòng chọn một file PDF!');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Đang tải lên...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/upload_pdf`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      setUploadStatus(`✅ Tải lên thành công: ${data.filename}`);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadStatus(`❌ Lỗi khi tải lên: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const formatText = (text) => {
    if (!text) return '';
    
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-blue-700">$1</strong>');
    formatted = formatted.replace(/Điều (\d+)/g, '<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-semibold">Điều $1</span>');
    formatted = formatted.replace(/Chương (\d+)/g, '<span class="bg-green-100 text-green-800 px-2 py-1 rounded-md font-semibold">Chương $1</span>');
    formatted = formatted.replace(/Luật (.*?)(?=\s|$|\.)/g, '<span class="bg-purple-100 text-purple-800 px-2 py-1 rounded-md font-semibold">Luật $1</span>');
    formatted = formatted.replace(/- (.*?)(?=\n|$)/g, '<li class="ml-4 mb-1">• $1</li>');
    
    return formatted;
  };

  const MessageBubble = ({ message }) => {
    const isUser = message.type === 'user';
    
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
        <div className={`flex max-w-2xl lg:max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
              isUser ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'
            }`}>
              {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
            </div>
          </div>
          <div className={`px-4 py-3 rounded-xl shadow-sm ${
            isUser 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
              : message.isError 
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-white text-gray-800 border border-gray-200'
          }`}>
            <div className={`${isUser ? 'text-sm' : 'text-sm leading-relaxed'}`}>
              {isUser ? (
                message.content
              ) : (
                <div 
                  dangerouslySetInnerHTML={{ __html: formatText(message.content) }}
                  className="prose prose-sm max-w-none"
                />
              )}
            </div>
            <div className={`text-xs mt-2 ${
              isUser ? 'text-blue-100' : 'text-gray-400'
            }`}>
              {message.timestamp}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredSessions = sessions.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white shadow-lg overflow-hidden`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Lịch sử Chat</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* User Login */}
          {!userExists ? (
            <div className="space-y-3">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => checkUserExists(username)}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={createUser}
                  disabled={isCreatingUser}
                  className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors text-sm"
                >
                  {isCreatingUser ? 'Đang tạo...' : 'Tạo mới'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>Xin chào, {username}!</span>
              </div>
              
              <button
                onClick={createNewSession}
                className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Chat</span>
              </button>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm cuộc trò chuyện..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sessions List */}
        {userExists && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors group relative ${
                    currentSessionId === session.id 
                      ? 'bg-blue-50 border-l-4 border-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => loadSessionMessages(session.id)}
                >
                  <div className="flex items-start space-x-2">
                    <MessageCircle className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      {editingSessionId === session.id ? (
                        <div className="flex items-center space-x-1">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updateSessionTitle(session.id, editingTitle);
                              }
                            }}
                            autoFocus
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateSessionTitle(session.id, editingTitle);
                            }}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSessionId(null);
                            }}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm font-medium text-gray-800 truncate">
                            {session.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {session.message_count || 0} tin nhắn • {new Date(session.updated_at).toLocaleDateString()}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {editingSessionId !== session.id && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSessionId(session.id);
                            setEditingTitle(session.title);
                          }}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredSessions.length === 0 && searchQuery && (
                <div className="text-center text-gray-500 py-4">
                  <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Không tìm thấy cuộc trò chuyện nào</p>
                </div>
              )}
              
              {sessions.length === 0 && !searchQuery && userExists && (
                <div className="text-center text-gray-500 py-4">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Chưa có cuộc trò chuyện nào</p>
                  <p className="text-xs">Nhấn "New Chat" để bắt đầu</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toggle Sidebar Button */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 left-4 z-10 p-2 bg-white shadow-md rounded-lg hover:bg-gray-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <div className="flex-1 p-4">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
              🏛️ Trợ lý Luật Hôn Nhân và Gia Đình Việt Nam 2014
            </h1>
            
            {currentSessionId && (
              <div className="text-center text-sm text-gray-600 mb-4">
                Session ID: {currentSessionId}
              </div>
            )}

            {/* PDF Upload Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">📄 Tải lên tài liệu PDF mới</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf"
                  className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <button
                  onClick={uploadPDF}
                  disabled={isUploading}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? 'Đang tải...' : 'Tải lên'}</span>
                </button>
              </div>
              {uploadStatus && (
                <div className="mt-2 text-sm text-gray-600 bg-white p-2 rounded border-l-4 border-blue-500">
                  {uploadStatus}
                </div>
              )}
            </div>
          </div>

          {/* Chat Container */}
          <div className="bg-white rounded-lg shadow-md flex flex-col h-96">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Xin chào! Tôi là trợ lý luật hôn nhân và gia đình.</p>
                  <p className="text-sm">
                    {!userExists ? 'Hãy đăng nhập và đặt câu hỏi để bắt đầu.' : 'Hãy đặt câu hỏi để bắt đầu cuộc trò chuyện.'}
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))
              )}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg">
                    <div className="animate-pulse flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm text-gray-500">Đang tìm kiếm...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex items-center space-x-2">
                <textarea
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={!userExists ? "Vui lòng đăng nhập trước..." : "Nhập câu hỏi của bạn về luật hôn nhân và gia đình..."}
                  disabled={!userExists}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100"
                  rows="1"
                  style={{ minHeight: '42px' }}
                />
                <button
                  onClick={sendQuestion}
                  disabled={isLoading || !userExists || !currentQuestion.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-4 bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">💡 Gợi ý sử dụng:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Đăng nhập hoặc tạo tài khoản để lưu lịch sử chat</li>
              <li>• Tạo cuộc trò chuyện mới cho từng chủ đề khác nhau</li>
              <li>• Hỏi về các điều luật cụ thể: "Điều kiện kết hôn là gì?"</li>
              <li>• Tìm hiểu về quy trình: "Thủ tục ly hôn như thế nào?"</li>
              <li>• Tải lên tài liệu PDF mới để mở rộng kiến thức của hệ thống</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RAGChatApp;