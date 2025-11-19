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
  Check,
  PlusIcon,
  PlusCircle
} from 'lucide-react';

const RAGChatApp = () => {
  console.log('🎯 RAGChatApp component rendering...');

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

  const [routeInfo, setRouteInfo] = useState(null);        // wiki_search | vectorstore
  const [statusMsg, setStatusMsg] = useState('');          // các status tạm thời
  const [inflightController, setInflightController] = useState(null); // để hủy stream
  const [selectedFile, setSelectedFile] = useState(null);


  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const API_URL = 'http://192.168.10.104:8000';

  console.log('🔄 Current state:', {
    messagesCount: messages.length,
    userId,
    username,
    currentSessionId,
    sessionsCount: sessions.length,
    userExists,
    sidebarOpen
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUploadButtonClick = async () => {

    // if (!selectedFile) {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
    return;
    // }
    // await uploadPDF();
  };
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setUploadStatus('❌ Vui lòng chọn file PDF!');
        return;
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setUploadStatus('❌ File quá lớn! Vui lòng chọn file nhỏ hơn 10MB.');
        return;
      }

      setSelectedFile(file);
    } else {
      setSelectedFile(null);
      setUploadStatus('');
    }
  };
  const clearSelectedFile = () => {
    console.log('🗑️ Clearing selected file...');
    setSelectedFile(null);
    setUploadStatus('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  // Kiểm tra user tồn tại
  const checkUserExists = async (username) => {
    console.log('🔍 Checking user exists:', username);
    if (!username.trim()) return false;

    try {
      const response = await fetch(`${API_URL}/api/users/${username}`);
      console.log('👤 Check user response:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('👤 User data:', data);
        setUserId(data.user.id);
        setUserExists(true);
        loadSessions(data.user.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error checking user:', error);
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
    console.log('📋 Loading sessions for user:', userId);
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}/sessions`);
      console.log('📋 Load sessions response:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Sessions data:', data);
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('❌ Error loading sessions:', error);
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

  const sendQuestion = async () => {
    if (selectedFile) {
      await uploadPDF();
    }
    if (!userId || !currentQuestion.trim()) {
      alert('Vui lòng đăng nhập và nhập câu hỏi!');
      return;
    }

    // đẩy tin nhắn người dùng
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: currentQuestion,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMessage]);

    // chuẩn bị bot message rỗng để append dần
    const botMsgId = Date.now() + 1;
    const emptyBot = {
      id: botMsgId,
      type: 'bot',
      content: '',
      timestamp: new Date().toLocaleTimeString()
    };
    setIsLoading(true);
    setMessages(prev => [...prev, emptyBot]);

    // giữ lại giá trị trước khi clear
    const questionToSend = currentQuestion;
    setCurrentQuestion('');
    setStatusMsg('');
    setRouteInfo(null);

    try {
      const controller = new AbortController();
      setInflightController(controller);

      const response = await fetch(`${API_URL}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({
          user_id: userId,
          session_id: currentSessionId, // có thể null, backend sẽ tạo mới
          question: questionToSend
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      const applyEvent = (evt) => {
        const { type } = evt || {};
        // console.log('SSE event:', evt);

        if (type === 'session_id') {
          if (evt.session_id && evt.session_id !== currentSessionId) {
            setCurrentSessionId(evt.session_id);
            // reload sidebar sessions
            if (userId) loadSessions(userId);
          }
        } else if (type === 'route') {
          setRouteInfo(evt.source); // 'wiki_search' | 'vectorstore'
        } else if (type === 'status') {
          setStatusMsg(evt.message || '');
        } else if (type === 'documents_retrieved') {
          setStatusMsg(`Đã lấy ${evt.count} tài liệu.`);
        } else if (type === 'generating') {
          setStatusMsg('Đang tạo câu trả lời...');
        } else if (type === 'content') {
          const piece = evt.content || '';
          if (!piece) return;
          // append chunk vào bot message cuối cùng (botMsgId)
          setMessages(prev => prev.map(m => (
            m.id === botMsgId ? { ...m, content: (m.content || '') + piece } : m
          )));
        } else if (type === 'completed') {
          setStatusMsg('Hoàn thành.');
        } else if (type === 'error') {
          setMessages(prev => prev.map(m => (
            m.id === botMsgId
              ? {
                ...m,
                isError: true,
                content: (m.content || '') + `\n\nLỗi: ${evt.error || 'Không rõ'}`
              }
              : m
          )));
        }
      };

      // Đọc luồng SSE
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE phân tách bằng \n\n; mỗi block chứa các dòng bắt đầu với "data: "
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || ''; // giữ lại phần chưa hoàn chỉnh

        for (const part of parts) {
          const lines = part.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const json = line.replace(/^data:\s?/, '');
            try {
              const evt = JSON.parse(json);
              applyEvent(evt);
            } catch (e) {
              console.warn('Không parse được event:', json);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      // chuyển bot message thành lỗi nếu chưa có gì
      setMessages(prev => prev.map(m => (
        m.id === botMsgId && !m.content
          ? { ...m, isError: true, content: `Lỗi: ${error.message}` }
          : m
      )));
    } finally {
      setIsLoading(false);
      setInflightController(null);
      setStatusMsg('');
    }
  };


  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuestion();
    }
  };

  const uploadPDF = async () => {
    if (!selectedFile) {
      setUploadStatus('❌ Không có file được chọn!');
      return;
    }

    setIsUploading(true);
    setUploadStatus('🔄 Đang tải lên...');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      console.log('📤 Uploading file:', selectedFile.name);

      // ✅ THÊM: Gọi API upload thực tế
      const response = await fetch(`${API_URL}/api/upload_pdf`, {
        method: 'POST',
        body: formData
      });

      console.log('📥 Upload response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Upload response data:', data);

      setUploadStatus(`✅ Tải lên thành công: ${data.filename || selectedFile.name}`);

      // ✅ THÊM: Reset sau khi upload thành công
      clearSelectedFile();

    } catch (error) {
      console.error('❌ Upload error:', error);
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
    console.log("message test: ", message);
    return (
      <>
      {<div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>-
        <div className={`flex max-w-2xl lg:max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${isUser ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'
              }`}>
              {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
            </div>
          </div>
          {message.content?<div className={`px-4 py-3 rounded-xl shadow-sm ${isUser
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
            <div className={`text-xs mt-2 ${isUser ? 'text-blue-100' : 'text-gray-400'
              }`}>
              {message.timestamp}
            </div>
          </div>:<div className="flex justify-start">
                  <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg">
                    <div className="animate-pulse flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">Đang tìm kiếm...</span>
                  </div>
                </div>}
        </div>
      </div>}</>
    );
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white shadow-lg overflow-hidden flex flex-col justify-between`}>
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
                  className={`p-3 rounded-lg cursor-pointer transition-colors group relative ${currentSessionId === session.id
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
        <div className=" mt-4 bg-blue-50 rounded-lg p-4 ">
          <h3 className="font-semibold text-blue-800 mb-2">💡 Gợi ý sử dụng:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Đăng nhập hoặc tạo tài khoản để lưu lịch sử chat</li>
            <li>• Tạo cuộc trò chuyện mới cho từng tình huống luật khác nhau</li>
            <li>• Hỏi về các điều luật cụ thể: "Điều kiện kết hôn là gì?"</li>
            <li>• Tìm hiểu về quy trình: "Thủ tục ly hôn như thế nào?"</li>
            <li>• Tải lên tài liệu PDF mới để mở rộng kiến thức của hệ thống</li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ">
        {/* Toggle Sidebar Button */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 left-4 z-10 p-2 bg-white shadow-md rounded-lg hover:bg-gray-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col p-4 h-screen">
          {(routeInfo || statusMsg) && (
            <div className="mb-3 flex items-center gap-2 text-xs">
              {routeInfo && (
                <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Nguồn: {routeInfo === 'wiki_search' ? 'Wikipedia' : 'CSDL nội bộ'}
                </span>
              )}
              {statusMsg && (
                <span className="px-2 py-1 rounded bg-gray-50 text-gray-600 border border-gray-200">
                  {statusMsg}
                </span>
              )}
            </div>
          )}

          {/* Header
          <div className="bg-white rounded-lg shadow-md p-6 mb-6" >
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
              🏛️ Trợ lý Luật Hôn Nhân và Gia Đình Việt Nam 2014
            </h1>

            {currentSessionId && (
              <div className="text-center text-sm text-gray-600 mb-4">
                Session ID: {currentSessionId}
              </div>
            )}
          </div> */}

          {/* Chat Container */}
          <div className="bg-white rounded-lg shadow-md flex flex-col flex-1 overflow-y-auto">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <p></p>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <Bot className="w-12 h-12 mb-4 text-gray-400" />
                <p>Xin chào! Tôi là trợ lý luật hôn nhân và gia đình.</p>
                <p className="text-sm">
                  {!userExists
                    ? "Hãy đăng nhập và đặt câu hỏi để bắt đầu."
                    : "Hãy đặt câu hỏi để bắt đầu cuộc trò chuyện."}
                </p>
              </div>
            ) : (
              messages
                .filter((msg) => msg.text?.trim() !== "")
                .map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))
            )}

            <div ref={messagesEndRef} />
          </div>


            {/* Input Area */}
            <div className="flex flex-col border-t p-4 gap-2">
              {selectedFile && (
                <div className="mt-2 inline-flex items-center gap-2 bg-white border border-green-200 rounded-lg px-3 py-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700 truncate max-w-[240px]">{selectedFile.name}</span>
                  <button
                    onClick={clearSelectedFile}
                    className="p-1 rounded hover:bg-gray-100"
                    title="Bỏ chọn"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              )}
              <div className="flex items-center space-x-2 ">
                <div className="">

                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".pdf"
                      onChange={handleFileChange}
                      class="hidden"
                    />
                    <button
                      onClick={handleUploadButtonClick}
                      disabled={isUploading}
                      className=" bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-400 transition-colors space-x-2"
                    >
                      <PlusCircle className="" />
                    </button>
                  </div>


                </div>
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
                  onClick={() => inflightController?.abort()}
                  disabled={!inflightController}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  Dừng
                </button>

                <button
                  onClick={sendQuestion}
                  disabled={isLoading || !userExists || (!currentQuestion.trim() && !selectedFile)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tips */}

        </div>
      </div>
    </div>
  );
};

export default RAGChatApp;