import React, { useState, useRef, useEffect } from 'react';
import {
  Send, FileText, User, Bot, Trash2, Plus, MessageCircle,
  Search, Edit2, ChevronLeft, ChevronRight, X, Check,
  PlusCircle, LogOut, Shield, Users, Activity, BarChart,
  Clock
} from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000';

// ==========================================
// 1. COMPONENT: LOGIN SCREEN
// ==========================================
const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  
  const API_URL = 'http://127.0.0.1:8000'; // port backend 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ADMIN LOGIN (Hardcoded cho demo frontend)
    if (username === 'admin' && password === 'admin') {
      onLogin({ id: 'admin', username: 'Admin', role: 'admin' });
      return;
    }

    // USER LOGIN / REGISTER
    if (!username.trim()) {
      setError('Vui lòng nhập username');
      return;
    }

    try {
      if (isRegistering) {
        // Logic Đăng ký
        const response = await fetch(`${API_URL}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email: '' })
        });
        if (response.ok) {
          const data = await response.json();
          // Đăng ký xong tự động login
          onLogin({ id: data.user_id,Hz: username, role: 'user' });
        } else {
          setError('Username đã tồn tại hoặc lỗi server.');
        }
      } else {
        // Logic Đăng nhập (Kiểm tra user tồn tại)
        const response = await fetch(`${API_URL}/api/users/${username}`);
        if (response.ok) {
          const data = await response.json();
          onLogin({ id: data.user.id, username: data.user.username, role: 'user' });
        } else {
          setError('User không tồn tại. Vui lòng chuyển sang Đăng ký.');
        }
      }
    } catch (err) {
      setError('Không thể kết nối đến server backend.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <Bot className="w-12 h-12 text-white mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-white">RAG Chat Assistant</h2>
          <p className="text-blue-100 text-sm">Luật Hôn nhân & Gia đình</p>
        </div>
        
        <div className="p-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            {isRegistering ? 'Tạo tài khoản mới' : 'Đăng nhập hệ thống'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Nhập tên đăng nhập"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={username === 'admin' ? "Nhập password admin" : "Mật khẩu (tùy chọn)"}
                />
              </div>
              {username === 'admin' && <p className="text-xs text-gray-400 mt-1">Gợi ý: admin / admin</p>}
            </div>

            {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {isRegistering ? 'Đăng ký' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="text-sm text-blue-600 hover:underline"
            >
              {isRegistering ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký mới'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. COMPONENT: ADMIN DASHBOARD (UPDATED)
// ==========================================
// ==========================================
// 2. COMPONENT: ADMIN DASHBOARD
// ==========================================
const AdminDashboard = ({ onLogout, currentUser }) => {
  // 1. Khai báo state view
  const [view, setView] = useState('dashboard'); 
  
  const [stats, setStats] = useState({
    total_users: 0,
    total_sessions: 0,
    today_sessions: 0,
    total_documents: 0,
    system_status: 'Checking...'
  });
  const [userList, setUserList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const statsRes = await fetch(`${API_URL}/api/admin/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.status === 'success') {
          setStats(statsData.stats);
        }
      }

      // Lấy danh sách user tùy theo view
      const limit = view === 'users' ? 100 : 10;
      const usersRes = await fetch(`${API_URL}/api/admin/users?limit=${limit}`);
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.status === 'success') {
          setUserList(usersData.users);
        }
      }
    } catch (error) {
      console.error("Admin fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refetch khi view thay đổi
  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 30000);
    return () => clearInterval(interval);
  }, [view]); 

  const deleteUser = async (userId) => {
    if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return;
    try {
        const response = await fetch(`${API_URL}/api/users/${userId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            alert('Xóa thành công');
            setUserList(prev => prev.filter(u => u.id !== userId));
            setStats(prev => ({ ...prev, total_users: prev.total_users - 1 }));
        } else {
            alert('Xóa thất bại');
        }
    } catch (error) {
        alert('Lỗi kết nối');
    }
  };

  const statCards = [
    { title: 'Tổng Users', value: stats.total_users, icon: Users, color: 'bg-blue-500' },
    { title: 'Tổng Sessions', value: stats.total_sessions, icon: MessageCircle, color: 'bg-green-500' },
    { title: 'Sessions Hôm nay', value: stats.today_sessions, icon: Clock, color: 'bg-purple-500' },
    { title: 'Hệ thống', value: stats.system_status, icon: Activity, color: stats.system_status === 'Online' ? 'bg-teal-500' : 'bg-red-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8 px-2">
          <Shield className="w-8 h-8 text-blue-400" />
          <div>
            <span className="text-xl font-bold block">Admin</span>
          </div>
        </div>
        
        {/* Navigation sử dụng biến view */}
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'dashboard' ? 'bg-gray-800 text-blue-400' : 'hover:bg-gray-800 text-gray-400'}`}
          >
            <BarChart className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => setView('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'users' ? 'bg-gray-800 text-blue-400' : 'hover:bg-gray-800 text-gray-400'}`}
          >
            <Users className="w-5 h-5" />
            <span>Quản lý Users</span>
          </button>
        </nav>

        <button onClick={onLogout} className="flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-gray-800 rounded-lg mt-auto transition-colors">
          <LogOut className="w-5 h-5" />
          <span>Đăng xuất</span>
        </button>
      </div>

      {/* Content - Render theo view */}
      <div className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">{view === 'dashboard' ? 'Tổng quan hệ thống' : 'Quản lý người dùng'}</h1>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border">
            <div className="text-right">
              <div className="text-sm font-bold text-gray-800">{currentUser.username}</div>
              <div className="text-xs text-green-500">Administrator</div>
            </div>
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* View Dashboard */}
        {view === 'dashboard' && (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">
                        {isLoading ? '...' : stat.value}
                        </p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg text-white shadow-sm`}>
                        <stat.icon className="w-6 h-6" />
                    </div>
                    </div>
                ))}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Hoạt động gần đây</h3>
                    <button onClick={fetchAdminData} className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Làm mới
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                        <tr>
                        <th className="px-6 py-4">Người dùng</th>
                        <th className="px-6 py-4">Hoạt động cuối</th>
                        <th className="px-6 py-4 text-center">Tổng Sessions</th>
                        <th className="px-6 py-4">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {userList.slice(0, 5).map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-800">
                                {user.username}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{user.last_active}</td>
                            <td className="px-6 py-4 text-sm text-gray-800 font-medium text-center">{user.sessions}</td>
                            <td className="px-6 py-4">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                            </td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                </div>
            </>
        )}

        {/* View Users */}
        {view === 'users' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Danh sách người dùng</h3>
                    <button onClick={fetchAdminData} className="text-blue-600 text-sm hover:underline flex items-center gap-1"><Clock className="w-3 h-3" /> Làm mới</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">Người dùng</th>
                                <th className="px-6 py-4">Hoạt động cuối</th>
                                <th className="px-6 py-4 text-center">Sessions</th>
                                <th className="px-6 py-4 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {userList.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-800">
                                        {user.username}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{user.last_active}</td>
                                    <td className="px-6 py-4 text-sm text-center">{user.sessions}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => deleteUser(user.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                            title="Xóa người dùng"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
// ==========================================
// 3. COMPONENT: USER CHAT (Fixed + Delete Feature)
// ==========================================
const UserChat = ({ currentUser, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [inflightController, setInflightController] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (currentUser?.id) {
      loadSessions(currentUser.id);
    }
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const createNewSession = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, title: 'New Chat' })
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentSessionId(data.session_id);
        setMessages([]);
        loadSessions(currentUser.id);
        if(window.innerWidth < 768) setSidebarOpen(false);
      }
    } catch (error) {
      alert('Lỗi khi tạo session: ' + error.message);
    }
  };

  // --- CHỨC NĂNG MỚI: XÓA SESSION ---
  const deleteSession = async (sessionId, e) => {
    e.stopPropagation(); // Ngăn chặn việc click vào session khi đang ấn xóa
    
    if (!confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) return;

    try {
      const response = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Cập nhật lại danh sách sessions
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        
        // Nếu đang xem session bị xóa, reset về màn hình trắng
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
          setMessages([]);
        }
      } else {
        alert("Không thể xóa session này.");
      }
    } catch (error) {
      console.error("Lỗi xóa session:", error);
      alert("Lỗi kết nối khi xóa.");
    }
  };

  const loadSessionMessages = async (sessionId) => {
    try {
      const response = await fetch(`${API_URL}/api/sessions/${sessionId}/messages`);
      if (response.ok) {
        const data = await response.json();
        const formattedMessages = data.messages.map(msg => ({
          id: msg.id,
          type: msg.role === 'user' ? 'user' : 'bot',
          content: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          isError: false
        }));
        setMessages(formattedMessages);
        setCurrentSessionId(sessionId);
        if(window.innerWidth < 768) setSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendQuestion = async () => {
    if (selectedFile) await uploadPDF();
    if (!currentQuestion.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: currentQuestion,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    setMessages(prev => [...prev, userMessage]);

    const botMsgId = Date.now() + 1;
    const emptyBot = { 
      id: botMsgId, 
      type: 'bot', 
      content: '', 
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
    };
    
    setIsLoading(true);
    setMessages(prev => [...prev, emptyBot]);

    const questionToSend = currentQuestion;
    setCurrentQuestion('');
    setStatusMsg('Đang kết nối...');
    setRouteInfo(null);

    try {
      const controller = new AbortController();
      setInflightController(controller);

      const response = await fetch(`${API_URL}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({
          user_id: currentUser.id,
          session_id: currentSessionId, 
          question: questionToSend
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || ''; 

        // --- SỬA LỖI constKZ Ở ĐÂY ---
        for (const part of parts) {
            const lines = part.split('\n');
            for (const line of lines) {
              if (!line.startsWith('data:')) continue;
              const jsonStr = line.replace(/^data:\s?/, '');
              if (!jsonStr.trim()) continue;
              
              try {
                const evt = JSON.parse(jsonStr);
                
                if (evt.type === 'content') {
                  setMessages(prev => prev.map(m => (
                    m.id === botMsgId ? { ...m, content: (m.content || '') + (evt.content || '') } : m
                  )));
                } else if (evt.type === 'session_id') {
                   if (evt.session_id && evt.session_id !== currentSessionId) {
                       setCurrentSessionId(evt.session_id);
                       loadSessions(currentUser.id);
                   }
                } else if (evt.type === 'status' || evt.type === 'generating') {
                    setStatusMsg(evt.message);
                } else if (evt.type === 'route') {
                    setRouteInfo(evt.source === 'wiki_search' ? 'Wikipedia' : 'CSDL Nội bộ');
                } else if (evt.type === 'completed') {
                    setStatusMsg('');
                } else if (evt.type === 'error') {
                    setMessages(prev => prev.map(m => (
                        m.id === botMsgId ? { ...m, isError: true, content: `Lỗi: ${evt.error}` } : m
                    )));
                }
              } catch (e) { console.warn("Parse error:", e); }
            }
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setMessages(prev => prev.map(m => (
            m.id === botMsgId ? { ...m, isError: true, content: `Lỗi kết nối: ${error.message}` } : m
        )));
      }
    } finally {
      setIsLoading(false);
      setInflightController(null);
      setStatusMsg('');
    }
  };

  const uploadPDF = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadStatus('Đang tải lên...');
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      const response = await fetch(`${API_URL}/api/upload_pdf`, { method: 'POST', body: formData });
      if (response.ok) {
        setUploadStatus('Upload thành công!');
        setTimeout(() => setUploadStatus(''), 3000);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setUploadStatus('Lỗi: Không thể xử lý file');
      }
    } catch (e) { 
      setUploadStatus('Lỗi kết nối server'); 
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.type !== 'application/pdf') {
            alert('Vui lòng chỉ chọn file PDF');
            return;
        }
        if (file.size > 10*1024*1024) {
            alert('File quá lớn (Max 10MB)');
            return;
        }
        setSelectedFile(file);
    }
  };

  const formatText = (text) => {
    if (!text) return '';
    let formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-blue-700">$1</strong>')
        .replace(/Điều (\d+)/g, '<span class="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium text-sm border border-blue-100">Điều $1</span>')
        .replace(/\n/g, '<br/>');
    return formatted;
  };

  const filteredSessions = sessions.filter(s => 
    (s.title || "New Chat").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen bg-white flex font-sans text-gray-900">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80 translate-x-0' : 'w-80 -translate-x-full fixed md:relative md:w-0 md:translate-x-0'} z-20 transition-all duration-300 bg-gray-50 border-r border-gray-200 flex flex-col h-full absolute md:static`}>
        <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                        {currentUser?.username?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm truncate">{currentUser.username}</span>
                        <span className="text-xs text-gray-500">Thành viên</span>
                    </div>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <button onClick={createNewSession} className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 text-sm font-medium shadow-sm">
                <Plus className="w-4 h-4" /> Cuộc trò chuyện mới
            </button>
        </div>

        <div className="p-3">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4"/>
                <input 
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm..." 
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2 mt-2">Lịch sử</div>
            {filteredSessions.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-8">Không tìm thấy lịch sử</div>
            ) : (
                filteredSessions.map(session => (
                    <div 
                        key={session.id} 
                        onClick={() => loadSessionMessages(session.id)}
                        className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${currentSessionId === session.id ? 'bg-white shadow-sm border border-gray-200' : 'hover:bg-gray-100 border border-transparent'}`}
                    >
                        <MessageCircle className={`w-4 h-4 shrink-0 ${currentSessionId === session.id ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                            <div className={`text-sm truncate ${currentSessionId === session.id ? 'font-medium text-gray-900' : 'text-gray-700'}`}>{session.title || "New Chat"}</div>
                            <div className="text-xs text-gray-400">{new Date(session.updated_at).toLocaleDateString()}</div>
                        </div>
                        {/* NÚT XÓA CHAT - Chỉ hiện khi hover hoặc active */}
                        <button 
                            onClick={(e) => deleteSession(session.id, e)}
                            className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all ${currentSessionId === session.id ? 'opacity-100' : ''}`}
                            title="Xóa đoạn chat"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))
            )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-white">
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium">
                <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen relative bg-white w-full">
        {/* Header Mobile */}
        <div className="h-14 border-b border-gray-100 flex items-center justify-between px-4 md:hidden bg-white">
             <div className="font-semibold text-gray-800">RAG Assistant</div>
             <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
        </div>

        {!sidebarOpen && (
             <button onClick={() => setSidebarOpen(true)} className="hidden md:flex absolute top-4 left-4 z-10 p-2 bg-white shadow-md border border-gray-100 rounded-lg hover:bg-gray-50 text-gray-600"><ChevronRight className="w-5 h-5" /></button>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth">
            {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                        <Bot className="w-10 h-10 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Trợ lý Luật Hôn nhân & Gia đình</h2>
                    <p className="text-gray-500 max-w-md">
                        Hãy đặt câu hỏi về các quy định pháp luật, thủ tục ly hôn, quyền nuôi con, hoặc tải lên văn bản liên quan để được hỗ trợ.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 max-w-2xl w-full">
                        {["Điều kiện kết hôn là gì?", "Thủ tục thuận tình ly hôn?", "Quyền nuôi con dưới 36 tháng?", "Tài sản chung vợ chồng?"].map((q, i) => (
                            <button 
                                key={i} 
                                onClick={() => { setCurrentQuestion(q); }}
                                className="p-4 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-100 rounded-xl text-sm text-gray-700 hover:text-blue-700 text-left transition-all"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        <div className={`flex max-w-[85%] md:max-w-[75%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.type === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-blue-600'}`}>
                                {msg.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>
                            
                            <div className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                                    msg.type === 'user' 
                                    ? 'bg-blue-600 text-white rounded-tr-none' 
                                    : msg.isError 
                                        ? 'bg-red-50 text-red-800 border border-red-100 rounded-tl-none'
                                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                                }`}>
                                    {msg.type === 'user' ? (
                                        msg.content
                                    ) : (
                                        msg.content ? (
                                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: formatText(msg.content) }} />
                                        ) : (
                                            <div className="flex gap-1 items-center py-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}/>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}/>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}/>
                                            </div>
                                        )
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
                            </div>
                        </div>
                    </div>
                ))
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Footer / Input Area */}
        <div className="p-4 md:p-6 bg-white border-t border-gray-100">
             {/* Info bar */}
             <div className="flex justify-between items-center mb-3 px-1">
                 <div className="flex items-center gap-2">
                    {statusMsg && (
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full animate-pulse">
                            {statusMsg}
                        </span>
                    )}
                    {routeInfo && (
                        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full border border-purple-100">
                            Nguồn: {routeInfo}
                        </span>
                    )}
                 </div>
                 
                 {selectedFile && (
                     <div className="flex items-center gap-2 text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
                         <FileText className="w-3 h-3" />
                         <span className="truncate max-w-[150px]">{selectedFile.name}</span>
                         <button onClick={() => {setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value=''}} className="hover:text-green-900"><X className="w-3 h-3"/></button>
                     </div>
                 )}
                 {uploadStatus && <span className="text-xs text-gray-500">{uploadStatus}</span>}
             </div>

             {/* Input Box */}
             <div className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all shadow-sm">
                 <input type="file" ref={fileInputRef} accept=".pdf" className="hidden" onChange={handleFileChange} />
                 {/* <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className={`p-3 rounded-xl transition-colors mb-0.5 ${isUploading ? 'bg-gray-200 cursor-not-allowed' : 'hover:bg-gray-200 text-gray-500 hover:text-blue-600'}`}
                    title="Tải lên PDF"
                    disabled={isUploading}
                 >
                     <PlusCircle className="w-6 h-6" />
                 </button> */}
                 
                 <textarea 
                    value={currentQuestion}
                    onChange={e => setCurrentQuestion(e.target.value)}
                    onKeyPress={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendQuestion(); }}}
                    placeholder="Nhập câu hỏi của bạn..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-800 max-h-32 py-3 px-2 resize-none placeholder-gray-400"
                    rows="1"
                    style={{minHeight: '44px'}}
                 />
                 
                 {isLoading ? (
                     <button 
                        onClick={() => inflightController?.abort()}
                        className="p-3 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-colors mb-0.5 font-medium text-xs"
                     >
                        Dừng
                     </button>
                 ) : (
                     <button 
                        onClick={sendQuestion} 
                        disabled={!currentQuestion.trim() && !selectedFile} 
                        className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm mb-0.5"
                     >
                         <Send className="w-5 h-5" />
                     </button>
                 )}
             </div>
             <div className="text-center mt-2">
                <p className="text-[10px] text-gray-400">Mô hình có thể mắc lỗi. Hãy kiểm chứng thông tin quan trọng.</p>
             </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. COMPONENT: MAIN APP ORCHESTRATOR
// ==========================================
const App = () => {
  const [user, setUser] = useState(null);

  // Khôi phục session từ localStorage nếu cần
  useEffect(() => {
    const storedUser = localStorage.getItem('chat_user');
    if (storedUser) {
        try {
            setUser(JSON.parse(storedUser));
        } catch (e) { localStorage.removeItem('chat_user'); }
    }
  }, []);

  const handleLogin = (userData) => {
    console.log("Logged in:", userData);
    setUser(userData);
    localStorage.setItem('chat_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('chat_user');
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard currentUser={user} onLogout={handleLogout} />;
  }

  return <UserChat currentUser={user} onLogout={handleLogout} />;
};

export default App;