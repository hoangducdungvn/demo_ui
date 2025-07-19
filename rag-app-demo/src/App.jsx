import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, FileText, User, Bot, Trash2 } from 'lucide-react';

const RAGChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // API URL - thay đổi theo server của bạn
  const API_URL = 'http://localhost:8000';

  // Cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Gửi câu hỏi
  const sendQuestion = async () => {
    if (!userId.trim() || !currentQuestion.trim()) {
      alert('Vui lòng nhập User ID và câu hỏi!');
      return;
    }

    // Thêm tin nhắn người dùng
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          question: currentQuestion
        })
      });

      const data = await response.json();
      
      // Thêm tin nhắn bot
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.results?.answer?.[0]?.content || 'Không tìm thấy câu trả lời!',
        timestamp: new Date().toLocaleTimeString(),
        sources: data.results?.sources || []
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

  // Xử lý nhấn Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuestion();
    }
  };

  // Tải lên PDF
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
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadStatus(`❌ Lỗi khi tải lên: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Xóa lịch sử chat
  const clearChat = () => {
    setMessages([]);
    setUploadStatus('');
  };

  // Format text với styling đẹp
  const formatText = (text) => {
    if (!text) return '';
    
    // Thay thế ** thành bold
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-blue-700">$1</strong>');
    
    // Thay thế các pattern phổ biến
    formatted = formatted.replace(/Điều (\d+)/g, '<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-semibold">Điều $1</span>');
    formatted = formatted.replace(/Chương (\d+)/g, '<span class="bg-green-100 text-green-800 px-2 py-1 rounded-md font-semibold">Chương $1</span>');
    formatted = formatted.replace(/Luật (.*?)(?=\s|$|\.)/g, '<span class="bg-purple-100 text-purple-800 px-2 py-1 rounded-md font-semibold">Luật $1</span>');
    
    // Thay thế bullet points
    formatted = formatted.replace(/- (.*?)(?=\n|$)/g, '<li class="ml-4 mb-1">• $1</li>');
    
    return formatted;
  };

  // Component tin nhắn
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
            {message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-600 mb-2">📚 Nguồn tham khảo:</div>
                <div className="space-y-1">
                  {message.sources.map((source, index) => (
                    <div key={index} className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                      <FileText className="w-3 h-3 mr-1 text-blue-500" />
                      <span>{source}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
            🏛️ Trợ lý Luật Hôn Nhân và Gia Đình Việt Nam 2014
          </h1>
          
          {/* User ID Input */}
          <div className="flex items-center space-x-2 mb-4">
            <User className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Nhập User ID của bạn"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={clearChat}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa Chat</span>
            </button>
          </div>

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
                <p className="text-sm">Hãy nhập User ID và đặt câu hỏi để bắt đầu.</p>
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
                placeholder="Nhập câu hỏi của bạn về luật hôn nhân và gia đình..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="1"
                style={{ minHeight: '42px' }}
              />
              <button
                onClick={sendQuestion}
                disabled={isLoading || !userId.trim() || !currentQuestion.trim()}
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
            <li>• Nhập User ID để hệ thống lưu lịch sử chat của bạn</li>
            <li>• Hỏi về các điều luật cụ thể: "Điều kiện kết hôn là gì?"</li>
            <li>• Tìm hiểu về quy trình: "Thủ tục ly hôn như thế nào?"</li>
            <li>• Tải lên tài liệu PDF mới để mở rộng kiến thức của hệ thống</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RAGChatApp;