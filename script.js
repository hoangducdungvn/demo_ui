// Địa chỉ API (thay bằng địa chỉ server của bạn, ví dụ: nếu chạy cục bộ thì http://localhost:8000)
const API_URL = 'http://localhost:8000';

// Gửi câu hỏi
function sendQuestion() {
    const userId = document.getElementById('userId').value;
    const question = document.getElementById('question').value;
    const answerDiv = document.getElementById('answer');

    if (!userId || !question) {
        answerDiv.innerHTML = 'Vui lòng nhập User ID và câu hỏi!';
        return;
    }

    fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            question: question
        })
    })
    .then(response => response.json())
    .then(data => {
        const answer = data.results.answer ? data.results.answer[0].content : 'Không tìm thấy câu trả lời!';
        answerDiv.innerHTML = `<strong>Câu trả lời:</strong> ${answer}`;
    })
    .catch(error => {
        answerDiv.innerHTML = `Lỗi: ${error.message}`;
    });
}

// Tải lên PDF
function uploadPDF() {
    const fileInput = document.getElementById('pdfUpload');
    const uploadStatus = document.getElementById('uploadStatus');
    const file = fileInput.files[0];

    if (!file) {
        uploadStatus.innerHTML = 'Vui lòng chọn một file PDF!';
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    fetch(`${API_URL}/api/upload_pdf`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        uploadStatus.innerHTML = `Tải lên thành công: ${data.filename}`;
    })
    .catch(error => {
        uploadStatus.innerHTML = `Lỗi khi tải lên: ${error.message}`;
    });
}